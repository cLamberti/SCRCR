import { NextRequest, NextResponse } from 'next/server';
import { listarActasAsociacion, crearActaAsociacion } from '@/dao/acta.dao';

export async function GET() {
  try {
    const actas = await listarActasAsociacion();
    return NextResponse.json({ success: true, data: actas });
  } catch (error) {
    console.error('GET /api/actas/asociacion:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener actas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, tipoSesion, urlActa, nombreArchivo } = body;

    if (!fecha || !tipoSesion) {
      return NextResponse.json(
        { success: false, message: 'Fecha y tipo de sesión son requeridos.' },
        { status: 400 },
      );
    }

    const acta = await crearActaAsociacion({ fecha, tipoSesion, urlActa, nombreArchivo });
    return NextResponse.json({ success: true, data: acta }, { status: 201 });
  } catch (error) {
    console.error('POST /api/actas/asociacion:', error);
    return NextResponse.json({ success: false, message: 'Error al crear acta.' }, { status: 500 });
  }
}
