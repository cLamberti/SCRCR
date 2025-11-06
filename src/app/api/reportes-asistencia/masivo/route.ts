
import { NextRequest, NextResponse } from 'next/server';
import { ReporteAsistenciaService } from '@/services/reporteAsistencia.service';
import { registroMasivoAsistenciaSchema } from '@/validators/reporteAsistencia.validator';
import { z } from 'zod';

const service = new ReporteAsistenciaService();

/**
 * POST - Registrar asistencias masivas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const datosValidados = registroMasivoAsistenciaSchema.parse(body);

    // Registrar asistencias
    await service.registrarMasivo(datosValidados);

    return NextResponse.json(
      {
        success: true,
        message: `${datosValidados.asistencias.length} asistencias registradas exitosamente`
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en POST /api/reportes-asistencia/masivo:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Error al registrar asistencias masivas'
      },
      { status: 500 }
    );
  }
}
