/**
 * Controller para agregar un nuevo asociado
 */
import { NextRequest, NextResponse } from 'next/server';
import { AsociadoService } from '@/services/asociado.service';
import { CrearAsociadoRequest } from '@/dto/asociado.dto';
import { ZodError } from 'zod';

const asociadoService = new AsociadoService();

/**
 * GET /api/asociados
 * Obtiene todos los asociados sin paginación.
 */
export async function GET(request: NextRequest) {
  try {
    // Usamos el método obtenerTodos() del servicio para traer todos los asociados
    const result = await asociadoService.obtenerTodos();

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error al obtener los asociados:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor al obtener los asociados.',
        errors: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/asociados
 * Crea un nuevo asociado.
 */
export async function POST(request: NextRequest) {
  try {
    const data: CrearAsociadoRequest = await request.json();
    const nuevoAsociado = await asociadoService.crear(data);

    return NextResponse.json({
      success: true,
      data: nuevoAsociado,
      message: 'Asociado creado exitosamente.',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al crear el asociado:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error de validación en los datos del asociado.',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error interno del servidor al crear el asociado.',
      },
      { status: 500 }
    );
  }
}