
import { NextRequest, NextResponse } from 'next/server';
import { ReporteAsistenciaService } from '@/services/reporteAsistencia.service';
import { actualizarReporteAsistenciaSchema } from '@/validators/reporteAsistencia.validator';
import { z } from 'zod';

const service = new ReporteAsistenciaService();

/**
 * GET - Obtener un reporte de asistencia por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID inválido'
        },
        { status: 400 }
      );
    }

    const reporte = await service.obtenerPorId(id);

    if (!reporte) {
      return NextResponse.json(
        {
          success: false,
          message: 'Reporte de asistencia no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reporte
    });

  } catch (error) {
    console.error(`Error en GET /api/reportes-asistencia/${params.id}:`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener reporte de asistencia'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar un reporte de asistencia
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID inválido'
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar datos
    const datosValidados = actualizarReporteAsistenciaSchema.parse(body);

    // Actualizar reporte
    const reporte = await service.actualizar(id, datosValidados);

    if (!reporte) {
      return NextResponse.json(
        {
          success: false,
          message: 'Reporte de asistencia no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte de asistencia actualizado exitosamente',
      data: reporte
    });

  } catch (error) {
    console.error(`Error en PUT /api/reportes-asistencia/${params.id}:`, error);

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

    return NextResponse.json(
      {
        success: false,
        message: 'Error al actualizar reporte de asistencia'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar un reporte de asistencia
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID inválido'
        },
        { status: 400 }
      );
    }

    const eliminado = await service.eliminar(id);

    if (!eliminado) {
      return NextResponse.json(
        {
          success: false,
          message: 'Reporte de asistencia no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte de asistencia eliminado exitosamente'
    });

  } catch (error) {
    console.error(`Error en DELETE /api/reportes-asistencia/${params.id}:`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error al eliminar reporte de asistencia'
      },
      { status: 500 }
    );
  }
}
