
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verifica si el token JWT es válido
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido o expirado
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No hay token' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
    
    try {
      const decoded = jwt.verify(token, secret) as any;
      
      // Devolver los datos del usuario sin información sensible
      return NextResponse.json({
        success: true,
        data: {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          nombreCompleto: decoded.nombreCompleto,
          rol: decoded.rol,
        }
      });
    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error en GET /api/auth/verify:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
