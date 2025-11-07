
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Definir permisos por ruta y rol
const routePermissions: Record<string, string[]> = {
  '/registro-asociados': ['admin', 'tesorero', 'pastorGeneral'],
  '/consulta-asociados': ['admin', 'tesorero', 'pastorGeneral'],
  '/eliminar-asociados': ['admin', 'pastorGeneral'],
  '/gestion-usuarios': ['admin', 'pastorGeneral'],
  '/reportes': ['admin', 'tesorero', 'pastorGeneral'],
  '/configuracion': ['admin'],
  '/dashboard': ['admin', 'tesorero', 'pastorGeneral'],
};

// Rutas que solo pueden acceder usuarios no autenticados
const authRoutes = ['/login'];

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/', '/recuperar-password'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  console.log('=== MIDDLEWARE ===');
  console.log('Path:', pathname);
  console.log('Token presente:', !!token);

  // Permitir rutas públicas
  if (publicRoutes.includes(pathname)) {
    console.log('Ruta pública, permitiendo acceso');
    return NextResponse.next();
  }

  // Si está intentando acceder a una ruta de autenticación y ya tiene token
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      console.log('Usuario con token intentando acceder a login, redirigiendo a home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Verificar si la ruta requiere autenticación
  const protectedRoute = Object.keys(routePermissions).find(route => 
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    // Si no hay token, redirigir a login
    if (!token) {
      console.log('No hay token, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar el rol del usuario
    try {
      console.log('Verificando permisos para:', protectedRoute);
      
      // Hacer una petición interna para verificar el usuario y su rol
      const verifyUrl = new URL('/api/auth/verify-role', request.url);
      const verifyResponse = await fetch(verifyUrl, {
        headers: {
          'Cookie': `auth-token=${token}`,
        },
      });

      if (!verifyResponse.ok) {
        console.log('Token inválido, redirigiendo a login');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const { rol } = await verifyResponse.json();
      console.log('Rol del usuario:', rol);

      const allowedRoles = routePermissions[protectedRoute];
      console.log('Roles permitidos:', allowedRoles);

      if (!allowedRoles.includes(rol)) {
        console.log('Rol no autorizado, redirigiendo a home');
        const response = NextResponse.redirect(new URL('/', request.url));
        
        // Agregar header para mostrar mensaje de error
        response.headers.set('X-Unauthorized', 'true');
        response.headers.set('X-Unauthorized-Message', 'No tienes permisos para acceder a esta página');
        
        return response;
      }

      console.log('Rol autorizado, permitiendo acceso');
      return NextResponse.next();

    } catch (error) {
      console.error('Error verificando rol:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rutas no protegidas
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
