import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { AsociadoValidator } from '@/validators/asociado.validator';
import { ActualizarAsociadoRequest } from '@/dto/asociado.dto';

const asociadoDAO = new AsociadoDAO();

/**
 * PUT /api/asociados/update
 * - Acepta el ID por query (?id=123) o en el body ({"id":123,...})
 * - Body: campos parciales para actualizar (ActualizarAsociadoRequest)
 */
export async function PUT(request: NextRequest) {
  try {
    
    const url = new URL(request.url);
    const idFromQuery = url.searchParams.get('id');

    const rawBody = await request.json().catch(() => ({} as any));
    const idFromBody = rawBody?.id;

    const idNum = Number(idFromQuery ?? idFromBody);

    if (!idNum || Number.isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de asociado inválido',
          errors: ['El ID debe ser un número mayor a 0 (use ?id= o body.id)'],
        },
        { status: 400 }
      );
    }

    const { id, ...body } = rawBody as { id?: number } & Partial<ActualizarAsociadoRequest>;

    const sanitizedData = AsociadoValidator.sanitizarDatos(body as ActualizarAsociadoRequest);
    const validation = AsociadoValidator.validarActualizarAsociado(sanitizedData);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de asociado inválidos',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const actualizado = await asociadoDAO.actualizar(idNum, sanitizedData);


    return NextResponse.json(
      {
        success: true,
        data: {
          ...actualizado,
      
          fechaIngreso: new Date(actualizado.fechaIngreso).toISOString(),
        },
        message: 'Asociado actualizado exitosamente',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error en /api/asociados/update:', error);


    if (error?.code === 'NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          message: 'Asociado no encontrado',
          errors: ['No existe un asociado con este ID'],
        },
        { status: 404 }
      );
    }
    if (error?.code === 'DUPLICATE_KEY') {
      return NextResponse.json(
        {
          success: false,
          message: 'Ya existe un asociado con esta cédula',
          errors: ['Cédula duplicada'],
        },
        { status: 409 }
      );
    }
    if (error?.code === 'NO_UPDATES') {
      return NextResponse.json(
        {
          success: false,
          message: 'No hay campos para actualizar',
          errors: ['Envíe al menos un campo válido en el body'],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Error al actualizar el asociado',
        errors: [error?.message || 'Unexpected'],
      },
      { status: 500 }
    );
  }
}

/**
 * (Opcional) También puedes aceptar PATCH si tu equipo lo usa para updates parciales.
 * Descomenta si lo necesitan:
 */
// export const PATCH = PUT;