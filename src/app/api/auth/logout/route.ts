import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout - Cerrar sesión
 */
export async function POST(request: NextRequest) {
  try {
    // Crear respuesta de logout exitoso
    const response = NextResponse.json(
      {
        success: true,
        message: 'Sesión cerrada exitosamente'
      },
      { status: 200 }
    );

    // Eliminar la cookie de autenticación
    response.cookies.delete('auth-token');

    return response;

  } catch (error: any) {
    console.error('Error en POST /api/auth/logout:', error);

    // Aunque haya error, intentar limpiar la cookie
    const response = NextResponse.json(
      {
        success: false,
        message: 'Error al cerrar sesión'
      },
      { status: 500 }
    );

    response.cookies.delete('auth-token');
    return response;
  }
}

/**
 * GET /api/auth/logout - Método no permitido
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Método no permitido. Use POST para cerrar sesión.'
    },
    { status: 405 }
  );
}