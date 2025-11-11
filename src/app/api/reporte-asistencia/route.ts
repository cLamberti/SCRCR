
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
        { success: false, message: 'eventoId es requerido' },
        { status: 400 }
      );
    }

    const dao = new ReporteAsistenciaDAO();
    const registros = await dao.obtenerPorEventoId(Number(eventoId));
     console.log('Registros desde DAO:', registros); // Debug

     // Asegurarse de que los datos tengan el formato correcto
    const registrosFormateados = registros.map(registro => ({
      id: registro.id,
      asociadoId: registro.asociado_id,
      eventoId: registro.evento_id,
      estado: registro.estado,
      fecha: registro.fecha,
      justificacion: registro.justificacion,
      horaRegistro: registro.hora_registro,
      createdAt: registro.created_at,
      updatedAt: registro.updated_at,
    }));

    console.log('Registros formateados:', registrosFormateados); // Debug

    return NextResponse.json({
      success: true,
      data: registrosFormateados,
      message: `Se encontraron ${registros.length} registros`
    });
  } catch (error) {
    console.error('Error en GET /api/reporte-asistencia:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener registros' },
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
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const dao = new ReporteAsistenciaDAO();

    const registroActualizado = await dao.actualizar(Number(id), {
      estado: body.estado,
      justificacion: body.justificacion,
    });

    console.log('Registro actualizado:', registroActualizado); // Debug

    return NextResponse.json({
      success: true,
      data: {
        id: registroActualizado.id,
        asociadoId: registroActualizado.asociado_id,
        eventoId: registroActualizado.evento_id,
        estado: registroActualizado.estado,
        fecha: registroActualizado.fecha,
        justificacion: registroActualizado.justificacion,
        horaRegistro: registroActualizado.hora_registro,
        createdAt: registroActualizado.created_at,
        updatedAt: registroActualizado.updated_at,
      },
      message: 'Registro actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en PUT /api/reporte-asistencia:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar registro' },
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
