
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UsuarioDAO } from '@/dao/usuario.dao';

const usuarioDAO = new UsuarioDAO();

export async function GET(req: NextRequest) {
  try {
    console.log('=== GET /api/auth/me ===');
    
    const token = req.cookies.get('auth-token')?.value;
    console.log('Token presente:', !!token);

    if (!token) {
      console.log('No hay token en las cookies');
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
      console.log('Token decodificado:', { id: decoded.id, username: decoded.username, rol: decoded.rol });
    } catch (jwtError) {
      console.error('Error al verificar token:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener información actualizada del usuario
    const usuario = await usuarioDAO.obtenerPorUsername(decoded.username);
    console.log('Usuario encontrado:', !!usuario);

    if (!usuario || usuario.estado !== 1) {
      console.log('Usuario no válido o inactivo');
      return NextResponse.json(
        { success: false, message: 'Usuario no válido' },
        { status: 401 }
      );
    }

    console.log('Retornando datos del usuario');
    return NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
