
import { NextRequest, NextResponse } from 'next/server';
import { ReporteAsistenciaService, ReporteAsistenciaServiceError } from '@/services/reporteAsistencia.service';

const service = new ReporteAsistenciaService();

/**
 * Maneja las solicitudes POST para crear un nuevo registro de asistencia.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Transformar de camelCase (API) a snake_case (servicio/DB)
    const datosParaServicio = {
      evento_id: body.eventoId,
      asociado_id: body.asociadoId,
      // Asegurar que el estado esté en minúsculas para el ENUM de la DB
      estado: body.estado.toLowerCase(),
      fecha: new Date().toISOString().split('T')[0],
    };

    const nuevoRegistro = await service.crearRegistro(datosParaServicio);

    // Transformar de snake_case (DB) a camelCase (respuesta API)
    const respuestaFormateada = {
      id: nuevoRegistro.id,
      eventoId: nuevoRegistro.evento_id,
      asociadoId: nuevoRegistro.asociado_id,
      estado: nuevoRegistro.estado,
      fechaRegistro: nuevoRegistro.hora_registro,
    };

    return NextResponse.json({
      success: true,
      message: 'Registro de asistencia creado exitosamente.',
      data: respuestaFormateada,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ReporteAsistenciaServiceError) {
      // Loguear el error original para depuración en el servidor
      console.error('[SERVICE_ERROR] en /api/reporte-asistencia:', {
        message: error.message,
        code: error.code,
        originalError: error.originalError,
      });

      // Error de validación de datos de entrada
      if (error.code === 'VALIDATION_ERROR') {
        return NextResponse.json({
          success: false,
          message: error.message,
          errors: error.originalError, // Contiene los detalles de Zod
        }, { status: 400 });
      }
      // Otros errores conocidos del servicio (como el de la DB)
      return NextResponse.json({
        success: false,
        message: error.message, // Mensaje genérico para el cliente
      }, { status: 500 });
    }

    // Errores inesperados
    console.error('Error inesperado en POST /api/reporte-asistencia:', error);
    return NextResponse.json({
      success: false,
      message: 'Ocurrió un error inesperado en el servidor.',
    }, { status: 500 });
  }
}

/**
 * Maneja las solicitudes GET para obtener registros de asistencia por ID de evento.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventoIdStr = searchParams.get('eventoId');

  if (!eventoIdStr) {
    return NextResponse.json({
      success: false,
      message: 'El parámetro "eventoId" es requerido.',
    }, { status: 400 });
  }

  const eventoId = parseInt(eventoIdStr, 10);

  try {
    const registros = await service.obtenerRegistrosPorEvento(eventoId);

    // Transformar la respuesta para el cliente
    const registrosFormateados = registros.map(reg => ({
      id: reg.id,
      eventoId: reg.evento_id,
      asociadoId: reg.asociado_id,
      estado: reg.estado,
      fechaRegistro: reg.hora_registro,
    }));

    return NextResponse.json({
      success: true,
      data: registrosFormateados,
    });

  } catch (error) {
    if (error instanceof ReporteAsistenciaServiceError) {
      if (error.code === 'VALIDATION_ERROR') {
        return NextResponse.json({
          success: false,
          message: error.message,
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 500 });
    }

    console.error(`Error inesperado en GET /api/reporte-asistencia?eventoId=${eventoId}:`, error);
    return NextResponse.json({
      success: false,
      message: 'Ocurrió un error inesperado en el servidor.',
    }, { status: 500 });
  }
}
