import { NextRequest, NextResponse } from 'next/server';
import { PlanillaDAO } from '@/dao/empleado.dao';

const dao = new PlanillaDAO();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await dao.obtenerPorId(Number(id));
    if (!data) return NextResponse.json({ success: false, message: 'Planilla no encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener la planilla.' }, { status: 500 });
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dao.cerrarPeriodo(Number(id));
    return NextResponse.json({ success: true, message: 'Planilla cerrada exitosamente.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al cerrar la planilla.' }, { status: 500 });
  }
}
