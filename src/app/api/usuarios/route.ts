
import { NextResponse } from 'next/server';
import { UsuarioDAO } from '@/dao/usuario.dao';
import { crearUsuarioSchema } from '@/validators/usuario.validators';
import bcrypt from 'bcryptjs';

const usuarioDAO = new UsuarioDAO();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = crearUsuarioSchema.safeParse(body);

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

    const { nombreCompleto, username, email, password, rol } = validation.data;

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear el usuario en la base de datos
    const nuevoUsuario = await usuarioDAO.create({
      nombreCompleto,
      username,
      email,
      passwordHash,
      rol,
      estado: 1, // Por defecto, los usuarios se crean como 'Activo'
    });

    return NextResponse.json({
      success: true,
      data: nuevoUsuario,
      message: 'Usuario creado exitosamente',
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/usuarios:', error);
    // Manejar errores de duplicados
    if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
      const detail = (error as any).detail || '';
      let message = 'Error de duplicado.';
      if (detail.includes('username')) {
        message = 'El nombre de usuario ya existe.';
      } else if (detail.includes('email')) {
        message = 'El correo electrónico ya está en uso.';
      }
      return NextResponse.json({ success: false, message }, { status: 409 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el usuario';
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const usuarios = await usuarioDAO.findAll();

    return NextResponse.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error('Error en GET /api/usuarios:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener usuarios';
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
