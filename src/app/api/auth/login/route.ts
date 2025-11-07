import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthServiceError } from '@/services/auth.service';
import { UsuarioValidator } from '@/validators/usuario.validator';

const authService = new AuthService();

/**
 * POST /api/auth/login - Iniciar sesión
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener y validar datos del cuerpo
    const body = await request.json();
    const sanitizedData = UsuarioValidator.sanitizarDatos(body);
    
    // 2. Validar formato de datos
    const validation = UsuarioValidator.validarLogin(sanitizedData);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de login inválidos',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // 3. Intentar hacer login
    const result = await authService.login(validation.data!);

    // 4. Responder con datos del usuario y configurar cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        user: result.user
      },
      { status: 200 }
    );

    // 5. Configurar cookie HttpOnly con el token
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60, // 24 horas en segundos
      path: '/'
    });

    console.log('Cookie configurada correctamente para token:', result.token.substring(0, 20) + '...');

    return response;

  } catch (error: any) {
    console.error('Error en POST /api/auth/login:', error);

    // Manejo de errores específicos del servicio
    if (error instanceof AuthServiceError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errors: error.errors || []
        },
        { status: error.statusCode || 500 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor al iniciar sesión'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/login - Verificar estado de sesión
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Obtener token de las cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No hay sesión activa',
          user: null
        },
        { status: 401 }
      );
    }

    // 2. Verificar y decodificar token
    const payload = await authService.verificarToken(token);

    // 3. Obtener datos actuales del usuario
    const user = await authService.obtenerUsuarioPorId(payload.userId);

    if (!user) {
      // Usuario no existe o está inactivo - limpiar cookie
      const response = NextResponse.json(
        {
          success: false,
          message: 'Sesión inválida',
          user: null
        },
        { status: 401 }
      );
      response.cookies.delete('auth-token');
      return response;
    }

    // 4. Sesión válida
    return NextResponse.json(
      {
        success: true,
        message: 'Sesión activa',
        user: user
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error en GET /api/auth/login:', error);

    // Si el token es inválido, limpiar cookie
    const response = NextResponse.json(
      {
        success: false,
        message: 'Sesión inválida',
        user: null
      },
      { status: 401 }
    );

    if (error instanceof AuthServiceError && error.statusCode === 401) {
      response.cookies.delete('auth-token');
    }

    return response;
  }
}