import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PermisoService } from '@/services/permiso.service';
import { validateAprobarRechazarInput } from '@/validators/permiso.validator';

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const allowedRoles = ['admin', 'pastorGeneral', 'asistenteAdministrativo'];
    if (!allowedRoles.includes(user.rol)) {
      return NextResponse.json({ success: false, message: 'No autorizado para aprobar o rechazar permisos' }, { status: 403 });
    }

    const body = await req.json();
    const validation = validateAprobarRechazarInput(body);

    if (!validation.ok) {
      return NextResponse.json({ success: false, errors: validation.issues }, { status: 400 });
    }

    const { id } = await params;
    const permisoId = parseInt(id, 10);

    const permiso = await permisoService.aprobarRechazarPermiso(permisoId, {
      estado: body.estado,
      observacionesResolucion: body.observacionesResolucion
    });

    return NextResponse.json({ success: true, data: permiso });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }
    if (error.code === 'INVALID_STATUS') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('Error PATCH /api/permisos/[id]/estado:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}