/**
 * Controller para agregar un nuevo asociado
 */
import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { AsociadoValidator } from '@/validators/asociado.validator';
import { CrearAsociadoRequest } from '@/dto/asociado.dto';
import { ConsultaAsociadoValidator } from '@/validators/asociado.validator';

const asociadoDAO = new AsociadoDAO();

/**
 * GET /api/asociados - Listar todos los asociados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const nombreCompleto = searchParams.get('nombreCompleto') ?? undefined;
    const cedula = searchParams.get('cedula') ?? undefined;
    const estado = searchParams.get('estado') ?? undefined;
    const page = searchParams.get('page') ?? undefined;
    const limit = searchParams.get('limit') ?? undefined;

    const { valid, errors, filtros } = ConsultaAsociadoValidator.validarFiltros({
      nombreCompleto,
      cedula,
      estado,
      page,
      limit
    });

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors
        },
        { status: 400 }
      );
    }

    // Si se envía cédula, buscar directamente
    if (filtros.cedula) {
      const asociado = await asociadoDAO.obtenerPorCedula(filtros.cedula);
      return NextResponse.json({
        success: true,
        data: asociado ? [asociado] : [],
        pagination: { page: 1, limit: 1, total: asociado ? 1 : 0, totalPages: asociado ? 1 : 0 }
      });
    }

    // Si se envía nombre, buscar por nombre
    if (filtros.nombreCompleto) {
      const lista = await asociadoDAO.buscarPorNombre(filtros.nombreCompleto, filtros.limit);
      return NextResponse.json({
        success: true,
        data: lista,
        pagination: { page: 1, limit: filtros.limit, total: lista.length, totalPages: 1 }
      });
    }

    // Listado general con paginación
    const resultado = await asociadoDAO.obtenerTodos(filtros.page, filtros.limit, filtros.estado);
    return NextResponse.json({
      success: true,
      data: resultado.data,
      pagination: {
        page: resultado.page,
        limit: resultado.limit,
        total: resultado.total,
        totalPages: resultado.totalPages
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error al obtener la lista de asociados'
      },
      { status: 500 }
    );
  }
}


/**
 * POST /api/asociados - Crear un nuevo asociado
 */
export async function POST(request: NextRequest) {
  try {
    const body: CrearAsociadoRequest = await request.json();

    // Sanitizar datos
    const sanitizedData = AsociadoValidator.sanitizarDatos(body);

    // Validar datos
    const validation = AsociadoValidator.validarCrearAsociado(sanitizedData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de asociado inválidos',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Crear el asociado
    const nuevoAsociado = await asociadoDAO.crear(sanitizedData);

    return NextResponse.json(
      {
        success: true,
        data: nuevoAsociado,
        message: 'Asociado creado exitosamente'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear asociado:', error);
    
    if (error.code === 'DUPLICATE_KEY') {
      return NextResponse.json(
        {
          success: false,
          message: 'Ya existe un asociado con esta cédula',
          errors: ['Cédula duplicada']
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al crear el asociado',
        errors: [error.message]
      },
      { status: 500 }
    );
  }
}