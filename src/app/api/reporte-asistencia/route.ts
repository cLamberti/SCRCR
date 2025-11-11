
import { NextRequest, NextResponse } from 'next/server';
import { ReporteAsistenciaDAO } from '@/dao/reporteAsistencia.dao';

const reporteDAO = new ReporteAsistenciaDAO();

/**
 * GET /api/reporte-asistencia?eventoId=X
 * Obtiene todos los registros de asistencia para un evento
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventoId = searchParams.get('eventoId');

    if (!eventoId) {
      return NextResponse.json(
        {
          success: false,
          message: 'El ID del evento es requerido',
        },
        { status: 400 }
      );
    }

    const registros = await reporteDAO.obtenerPorEventoId(Number(eventoId));

    return NextResponse.json({
      success: true,
      data: registros,
      message: `Se encontraron ${registros.length} registros de asistencia`,
    });
  } catch (error: any) {
    console.error('Error al obtener registros de asistencia:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al obtener los registros de asistencia',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reporte-asistencia
 * Crea un nuevo registro de asistencia
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventoId, asociadoId, estado, fecha, justificacion } = body;

    if (!eventoId || !asociadoId || !estado || !fecha) {
      return NextResponse.json(
        {
          success: false,
          message: 'Faltan campos requeridos',
        },
        { status: 400 }
      );
    }

    const nuevoRegistro = await reporteDAO.crear({
      evento_id: eventoId,
      asociado_id: asociadoId,
      estado,
      fecha,
      justificacion,
    });

    return NextResponse.json({
      success: true,
      data: nuevoRegistro,
      message: 'Asistencia registrada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al crear registro de asistencia:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al registrar la asistencia',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reporte-asistencia?id=X
 * Actualiza un registro de asistencia existente
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'El ID del registro es requerido',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { estado, justificacion } = body;

    if (!estado) {
      return NextResponse.json(
        {
          success: false,
          message: 'El estado es requerido',
        },
        { status: 400 }
      );
    }

    const registroActualizado = await reporteDAO.actualizar(Number(id), {
      estado,
      justificacion,
    });

    return NextResponse.json({
      success: true,
      data: registroActualizado,
      message: 'Asistencia actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al actualizar registro de asistencia:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al actualizar la asistencia',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reporte-asistencia?eventoId=X
 * Elimina todos los registros de asistencia de un evento
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventoId = searchParams.get('eventoId');

    if (!eventoId) {
      return NextResponse.json(
        {
          success: false,
          message: 'El ID del evento es requerido',
        },
        { status: 400 }
      );
    }

    const eliminados = await reporteDAO.eliminarPorEvento(Number(eventoId));

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${eliminados} registros de asistencia`,
    });
  } catch (error: any) {
    console.error('Error al eliminar registros de asistencia:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al eliminar los registros',
      },
      { status: 500 }
    );
  }
}
