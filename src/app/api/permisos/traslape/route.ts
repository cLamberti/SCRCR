import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PermisoDAO } from '@/dao/permiso.dao';
import { isValidDateYYYYMMDD } from '@/validators/permiso.validator';

const permisoDAO = new PermisoDAO();

function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
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
    const fechaInicio = searchParams.get('fechaInicio') || '';
    const fechaFin = searchParams.get('fechaFin') || '';

    if (!isValidDateYYYYMMDD(fechaInicio) || !isValidDateYYYYMMDD(fechaFin)) {
      return NextResponse.json(
        { success: false, message: 'Formato de fechas inválido (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      return NextResponse.json(
        { success: false, message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' },
        { status: 400 }
      );
    }

    const hasOverlap = await permisoDAO.verificarTraslape(user.id, fechaInicio, fechaFin);
    return NextResponse.json({ success: true, hasOverlap });
  } catch (error: any) {
    console.error('Error GET /api/permisos/traslape:', error);
    return NextResponse.json({ success: false, message: 'Error validando traslape' }, { status: 500 });
  }
}
