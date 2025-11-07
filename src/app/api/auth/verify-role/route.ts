
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET || 'uwrT0PdHQ7gkJeoaD3iKqMGk';
    
    try {
      const decoded = jwt.verify(token, secret) as {
        id: number;
        username: string;
        rol: string;
      };

      return NextResponse.json({
        success: true,
        rol: decoded.rol,
        id: decoded.id,
        username: decoded.username,
      });
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error en /api/auth/verify-role:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
