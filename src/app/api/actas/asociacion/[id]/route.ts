import { NextRequest, NextResponse } from 'next/server';
import { obtenerActaAsociacion, actualizarActaAsociacion, eliminarActaAsociacion } from '@/dao/acta.dao';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const acta = await obtenerActaAsociacion(Number(id));
    if (!acta) return NextResponse.json({ success: false, message: 'Acta no encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true, data: acta });
  } catch (error) {
    console.error('GET /api/actas/asociacion/[id]:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener acta.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const acta = await actualizarActaAsociacion(Number(id), body);
    if (!acta) return NextResponse.json({ success: false, message: 'Acta no encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true, data: acta });
  } catch (error) {
    console.error('PUT /api/actas/asociacion/[id]:', error);
    return NextResponse.json({ success: false, message: 'Error al actualizar acta.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ok = await eliminarActaAsociacion(Number(id));
    if (!ok) return NextResponse.json({ success: false, message: 'Acta no encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Acta eliminada.' });
  } catch (error) {
    console.error('DELETE /api/actas/asociacion/[id]:', error);
    return NextResponse.json({ success: false, message: 'Error al eliminar acta.' }, { status: 500 });
  }
}
