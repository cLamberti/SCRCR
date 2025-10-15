/**
 * Controller para buscar un asociado por ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { AsociadoValidator } from '@/validators/asociado.validator';
import { ActualizarAsociadoRequest } from '@/dto/asociado.dto';

const asociadoDAO = new AsociadoDAO();

/**
 * GET /api/asociados/[id] - Obtener un asociado por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asociadoId = parseInt(id);

    if (isNaN(asociadoId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de asociado inválido',
          errors: ['El ID debe ser un número']
        },
        { status: 400 }
      );
    }

    const asociado = await asociadoDAO.obtenerPorId(asociadoId);

    if (!asociado) {
      return NextResponse.json(
        {
          success: false,
          message: 'Asociado no encontrado',
          errors: ['No existe un asociado con este ID']
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: asociado,
      message: 'Asociado obtenido exitosamente'
    });
  } catch (error: any) {
    console.error('Error al obtener asociado:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al obtener el asociado',
        errors: [error.message]
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/asociados/[id] - Actualizar un asociado
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asociadoId = parseInt(id);

    if (isNaN(asociadoId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de asociado inválido',
          errors: ['El ID debe ser un número']
        },
        { status: 400 }
      );
    }

    const body: ActualizarAsociadoRequest = await request.json();

    // Sanitizar datos
    const sanitizedData = AsociadoValidator.sanitizarDatos(body);

    // Validar datos
    const validation = AsociadoValidator.validarActualizarAsociado(sanitizedData);
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

    // Actualizar el asociado
    const asociadoActualizado = await asociadoDAO.actualizar(asociadoId, sanitizedData);

    return NextResponse.json({
      success: true,
      data: asociadoActualizado,
      message: 'Asociado actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar asociado:', error);
    
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          message: 'Asociado no encontrado',
          errors: ['No existe un asociado con este ID']
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al actualizar el asociado',
        errors: [error.message]
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/asociados/[id] - Eliminar un asociado (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asociadoId = parseInt(id);

    if (isNaN(asociadoId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de asociado inválido',
          errors: ['El ID debe ser un número']
        },
        { status: 400 }
      );
    }

    const eliminado = await asociadoDAO.eliminar(asociadoId);

    if (!eliminado) {
      return NextResponse.json(
        {
          success: false,
          message: 'Asociado no encontrado',
          errors: ['No existe un asociado con este ID']
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Asociado eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar asociado:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al eliminar el asociado',
        errors: [error.message]
      },
      { status: 500 }
    );
  }
}
