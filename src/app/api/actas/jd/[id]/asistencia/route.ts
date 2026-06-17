import { NextRequest, NextResponse } from 'next/server';
import { obtenerAsistenciasJD, registrarAsistenciaJD } from '@/dao/acta.dao';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const asistencias = await obtenerAsistenciasJD(Number(id));
    return NextResponse.json({ success: true, data: asistencias });
  } catch (error) {
    console.error('GET /api/actas/jd/[id]/asistencia:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener asistencias.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { asociadoId, estado, justificacion } = body;

    if (!asociadoId || !estado) {
      return NextResponse.json(
        { success: false, message: 'asociadoId y estado son requeridos.' },
        { status: 400 },
      );
    }

    const row = await registrarAsistenciaJD(Number(id), { asociadoId, estado, justificacion });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error('POST /api/actas/jd/[id]/asistencia:', error);
    return NextResponse.json({ success: false, message: 'Error al registrar asistencia.' }, { status: 500 });
  }
}
