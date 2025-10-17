/**
 * Controller para actualizar un asociado
 */
import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { AsociadoValidator } from '@/validators/asociado.validator';
import { ActualizarAsociadoRequest } from '@/dto/asociado.dto';

const asociadoDAO = new AsociadoDAO();

/**
 * PUT /api/asociados/update - Actualizar un asociado
 */
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de asociado inválido',
          errors: ['El ID debe ser un número']
        },
        { status: 400 }
      );
    }

    const asociadoId = parseInt(id);
    const body: ActualizarAsociadoRequest = await request.json();

    const sanitizedData = AsociadoValidator.sanitizarDatos(body);

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