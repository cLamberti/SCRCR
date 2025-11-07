
import { ZodError } from 'zod';
import { UsuarioService, UsuarioServiceError } from '@/services/usuario.service';
import { LoginSchema } from '@/dto/usuario.dto';
import { NextRequest, NextResponse } from 'next/server';

const usuarioService = new UsuarioService();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de un usuario y devuelve un JWT
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDTO'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT para autenticación
 *                 data:
 *                   $ref: '#/components/schemas/UsuarioResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
export async function POST(req: NextRequest) {
  try {
    console.log('=== LOGIN REQUEST ===');
    
    // Leer el body
    const body = await req.json();
    console.log('Body completo recibido:', body);
    console.log('Username:', body.username);
    console.log('Password presente:', !!body.password);

    // Validar con Zod
    let validatedData;
    try {
      validatedData = LoginSchema.parse(body);
      console.log('Datos validados correctamente');
    } catch (zodError) {
      if (zodError instanceof ZodError) {
        console.log('=== ERROR DE VALIDACIÓN ===');
        console.log('Errores:', zodError.issues);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Datos de inicio de sesión inválidos', 
            errors: zodError.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          },
          { status: 400 }
        );
      }
      throw zodError;
    }

    // Intentar login
    console.log('Llamando al servicio de login...');
    const { token, usuario } = await usuarioService.login(validatedData);
    console.log('Login exitoso, generando respuesta...');

    const response = NextResponse.json({ 
      success: true, 
      token, 
      data: usuario 
    });

    // Establecer cookie con el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    console.log('Cookie establecida');
    console.log('=== FIN LOGIN REQUEST ===');

    return response;

  } catch (error) {
    console.error('=== ERROR EN LOGIN ===');
    console.error('Tipo de error:', error?.constructor?.name);
    console.error('Error completo:', error);

    if (error instanceof UsuarioServiceError) {
      console.error('Error del servicio:', error.message, 'Status:', error.statusCode);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error('Error desconocido:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
