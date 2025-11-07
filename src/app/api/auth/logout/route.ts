
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cierra la sesión del usuario
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });

    // Eliminar la cookie de autenticación
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { success: false, message: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
