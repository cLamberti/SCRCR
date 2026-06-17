import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

type Rol = 'admin' | 'pastorGeneral' | 'juntaDirectiva' | 'asistenteAdministrativo';

// ── Permisos por ruta ────────────────────────────────────────────────────────

const routePermissions: Record<string, Rol[]> = {
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

async function getTokenPayload(token: string): Promise<{ rol: Rol } | null> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return payload as { rol: Rol };
  } catch {
    return null;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

// Rutas API que no requieren autenticación
const publicApiRoutes = ['/api/auth/'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // ── Rutas API ──────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Las rutas de auth son públicas
    if (publicApiRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.next();
    }
    // El resto de API routes requiere token válido
    if (!token) {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
    }
    const payload = await getTokenPayload(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Token inválido o expirado.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Rutas públicas — siempre permitir ─────────────────────────────────────
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ── Rutas de autenticación (/login) ───────────────────────────────────────
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      const payload = await getTokenPayload(token);
      if (payload) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // ── Rutas protegidas por rol ───────────────────────────────────────────────
  const protectedRoute = Object.keys(routePermissions).find(route =>
    pathname.startsWith(route),
  );

  if (protectedRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
