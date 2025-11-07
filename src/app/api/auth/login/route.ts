
import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/dto/usuario.dto';
import { UsuarioService, UsuarioServiceError } from '@/services/usuario.service';
import { ZodError } from 'zod';

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
    const body = await req.json();
    const validatedData = LoginSchema.parse(body);

    const { token, usuario } = await usuarioService.login(validatedData);

    return NextResponse.json({ success: true, token, data: usuario });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Datos de inicio de sesión inválidos', errors: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof UsuarioServiceError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error('Error en POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
