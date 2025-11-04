import { NextRequest, NextResponse } from 'next/server';
import { AsistenciaService, AsistenciaServiceError } from '@/services/asistencia.service';
import { RegistroAsistenciaRequest } from '@/dto/asistencia.dto';

// Inicializar el servicio
const asistenciaService = new AsistenciaService();

/**
 * POST /api/asistencia - Registrar una nueva asistencia
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener y parsear el cuerpo de la solicitud
    const body: RegistroAsistenciaRequest = await request.json();

    // 2. Invocar la lógica de negocio en la capa de Servicio
    const resultado = await asistenciaService.registroAsistencia(body);

    // 3. Responder con el resultado del servicio
    return NextResponse.json(resultado, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Error en POST /api/asistencia:', error);

    // Manejo de errores específicos del Servicio
    if (error instanceof AsistenciaServiceError) {
      return NextResponse.json(
        { success: false, message: error.message, errors: error.errors },
        { status: error.statusCode || 400 } // Usar el código de estado del error si está definido
      );
    }

    // Manejo de errores genéricos (e.g., error al parsear JSON)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor al registrar asistencia.' },
      { status: 500 }
    );
  }
}

// Para evitar advertencias de Next.js si no se usa GET (No es necesario implementarlo)
export async function GET() {
  return NextResponse.json({ message: 'Ruta de listado de asistencia no implementada' }, { status: 200 });
}