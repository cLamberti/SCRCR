
import { NextResponse } from 'next/server';
import { UsuarioDAO } from '@/dao/usuario.dao';
import { LoginSchema } from '@/validators/usuario.validator';
import bcrypt from 'bcryptjs';

const usuarioDAO = new UsuarioDAO();

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
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de entrada no válidos',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Buscar usuario por username
    const usuario = await usuarioDAO.obtenerPorUsername(username);

    if (!usuario) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (usuario.estado !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario inactivo. Contacte al administrador.',
        },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValido) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Login exitoso - devolver datos del usuario (sin el passwordHash)
    const { passwordHash, ...usuarioSinPassword } = usuario;

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: usuarioSinPassword,
      },
    });

  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al iniciar sesión';
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

