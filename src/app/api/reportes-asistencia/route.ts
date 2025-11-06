
import { NextRequest, NextResponse } from 'next/server';
import { ReporteAsistenciaService } from '@/services/reporteAsistencia.service';
import { 
  crearReporteAsistenciaSchema,
  filtrosReporteAsistenciaSchema 
} from '@/validators/reporteAsistencia.validator';
import { z } from 'zod';

const service = new ReporteAsistenciaService();

/**
 * GET - Obtener reportes de asistencia con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Construir objeto de filtros desde query params
    const filtros: any = {};
    
    if (searchParams.has('asociadoId')) {
      filtros.asociadoId = parseInt(searchParams.get('asociadoId')!);
    }
    if (searchParams.has('eventoId')) {
      filtros.eventoId = parseInt(searchParams.get('eventoId')!);
    }
    if (searchParams.has('fechaInicio')) {
      filtros.fechaInicio = searchParams.get('fechaInicio');
    }
    if (searchParams.has('fechaFin')) {
      filtros.fechaFin = searchParams.get('fechaFin');
    }
    if (searchParams.has('estado')) {
      filtros.estado = searchParams.get('estado');
    }
    if (searchParams.has('ministerio')) {
      filtros.ministerio = searchParams.get('ministerio');
    }
    if (searchParams.has('nombreAsociado')) {
      filtros.nombreAsociado = searchParams.get('nombreAsociado');
    }
    if (searchParams.has('cedulaAsociado')) {
      filtros.cedulaAsociado = searchParams.get('cedulaAsociado');
    }
    if (searchParams.has('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina')!);
    }
    if (searchParams.has('porPagina')) {
      filtros.porPagina = parseInt(searchParams.get('porPagina')!);
    }

    // Validar filtros
    const filtrosValidados = filtrosReporteAsistenciaSchema.parse(filtros);
    
    // Buscar reportes
    const resultado = await service.buscar(filtrosValidados);

    return NextResponse.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Error en GET /api/reportes-asistencia:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de filtros inválidos',
          errors: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener reportes de asistencia'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear un nuevo reporte de asistencia
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const datosValidados = crearReporteAsistenciaSchema.parse(body);

    // Crear reporte
    const reporte = await service.crear(datosValidados);

    return NextResponse.json(
      {
        success: true,
        message: 'Reporte de asistencia creado exitosamente',
        data: reporte
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en POST /api/reportes-asistencia:', error);

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
        message: 'Error al crear reporte de asistencia'
      },
      { status: 500 }
    );
  }
}
