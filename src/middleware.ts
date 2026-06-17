import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rutas que solo admin puede acceder (protección fuerte en Edge)
const ADMIN_ONLY_ROUTES = ['/gestion-roles', '/gestion-usuarios'];

// Rutas que requieren cualquier JWT válido
const PROTECTED_ROUTES = [
  '/consulta-asociados',
  '/congregados',
  '/eventos',
  '/planilla',
  '/reportes',
  '/permisos',
  '/actas',
  '/configuracion',
];

// Rutas solo para no autenticados
const AUTH_ROUTES = ['/login'];

// Rutas públicas sin restricción
const PUBLIC_ROUTES = ['/', '/recuperar-password'];

// Rutas API que no requieren autenticación
const PUBLIC_API_ROUTES = ['/api/auth/'];

async function getTokenPayload(token: string): Promise<{ rol: string } | null> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return payload as { rol: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // ── API routes ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.next();
    }
    if (!token) {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
    }
    const payload = await getTokenPayload(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Token inválido o expirado.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Rutas públicas ─────────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();

  // ── Login (solo para no autenticados) ─────────────────────────────────────
  if (AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    if (token) {
      const payload = await getTokenPayload(token);
      if (payload) return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // ── Rutas solo admin ───────────────────────────────────────────────────────
  if (ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = await getTokenPayload(token);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('auth-token');
      return res;
    }
    if (payload.rol !== 'admin') return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  // ── Rutas protegidas (cualquier usuario autenticado) ───────────────────────
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = await getTokenPayload(token);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('auth-token');
      return res;
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
