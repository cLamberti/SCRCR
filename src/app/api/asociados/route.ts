/**
 * Controller para agregar un nuevo asociado
 */
import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { AsociadoValidator } from '@/validators/asociado.validator';
import { CrearAsociadoRequest } from '@/dto/asociado.dto';

const asociadoDAO = new AsociadoDAO();

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
