import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PERMISOS_DEFAULT, ROLES, type ModuloKey } from '@/lib/modulos';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No hay token' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 401 });
    }

    const rol = decoded.rol;

    // Fetch role permissions from DB; fall back to defaults if table is empty
    let modulosPermitidos: string[] = [];
    try {
      const rows = await prisma.permisoRol.findMany({
        where: { rol, activo: true },
        select: { modulo: true },
      });
      if (rows.length > 0) {
        modulosPermitidos = rows.map(r => r.modulo);
      } else {
        // Seed not run yet — use static defaults
        modulosPermitidos = Object.entries(PERMISOS_DEFAULT)
          .filter(([, roles]) => roles.includes(rol as any))
          .map(([mod]) => mod);
      }
    } catch {
      // DB unavailable — fall back to static defaults
      modulosPermitidos = Object.entries(PERMISOS_DEFAULT)
        .filter(([, roles]) => roles.includes(rol as any))
        .map(([mod]) => mod);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        nombreCompleto: decoded.nombreCompleto,
        rol,
        modulosPermitidos,
      },
    });
  } catch (error) {
    console.error('GET /api/auth/verify:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
