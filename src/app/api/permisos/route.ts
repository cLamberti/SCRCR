import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PermisoService } from '@/services/permiso.service';
import { validateCrearPermisoInput } from '@/validators/permiso.validator';

const permisoService = new PermisoService();

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET || 'uwrT0PdHQ7gkJeoaD3iKqMGk';
  try {
    return jwt.verify(token, secret) as { id: number; username: string; rol: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Si es asistenteAdministrativo, admin o pastorGeneral puede ver todos. Si no, solo los suyos.
    const isAdminRoles = ['admin', 'pastorGeneral', 'asistenteAdministrativo', 'tesorero'].includes(user.rol);
    const fetchUserId = isAdminRoles ? undefined : user.id;

    const result = await permisoService.obtenerPermisos(page, limit, fetchUserId);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/permisos:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateCrearPermisoInput(body);

    if (!validation.ok) {
      return NextResponse.json({ success: false, errors: validation.issues }, { status: 400 });
    }

    const permiso = await permisoService.crearPermiso(user.id, {
      fechaInicio: body.fechaInicio,
      fechaFin: body.fechaFin,
      motivo: body.motivo,
      documentoUrl: body.documentoUrl || null,
      estado: 'PENDIENTE'
    });

    return NextResponse.json({ success: true, data: permiso }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'OVERLAP_ERROR') {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    console.error('Error POST /api/permisos:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
