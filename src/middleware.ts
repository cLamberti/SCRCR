import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ── Permisos por ruta ────────────────────────────────────────────────────────

const routePermissions: Record<string, string[]> = {
  '/consulta-asociados': ['admin', 'juntaDirectiva'],
  '/congregados':        ['admin', 'pastorGeneral', 'asistenteAdministrativo'],
  '/eventos':            ['admin', 'pastorGeneral', 'asistenteAdministrativo'],
  '/gestion-usuarios':   ['admin', 'asistenteAdministrativo'],
  '/planilla':           ['admin', 'juntaDirectiva'],
  '/reportes':           ['admin', 'pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  '/permisos':           ['admin', 'pastorGeneral', 'asistenteAdministrativo'],
  '/actas':              ['admin', 'juntaDirectiva'],
  '/configuracion':      ['admin', 'pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
};

// Rutas solo para no autenticados
const authRoutes = ['/login'];

// Rutas públicas sin restricción
const publicRoutes = ['/', '/recuperar-password'];

// ── Helper: verificar JWT en Edge ────────────────────────────────────────────

async function getTokenPayload(token: string): Promise<{ rol: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
    const { payload } = await jwtVerify(token, secret);
    return payload as { rol: string };
  } catch {
    return null;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas — siempre permitir
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Rutas de autenticación (/login)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      // Solo redirigir si el token es realmente válido
      const payload = await getTokenPayload(token);
      if (payload) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Rutas protegidas
  const protectedRoute = Object.keys(routePermissions).find(route =>
    pathname.startsWith(route),
  );

  if (protectedRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar token y rol directamente (sin fetch interno)
    const payload = await getTokenPayload(token);

    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    const allowedRoles = routePermissions[protectedRoute];
    if (!allowedRoles.includes(payload.rol)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
