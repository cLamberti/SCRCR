
import { UsuarioValidator } from '@/validators/usuario.validator';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UsuarioDAO } from '@/dao/usuario.dao';

const usuarioDAO = new UsuarioDAO();

// GET - Obtener todos los usuarios
export async function GET() {
  try {
    const usuarios = await usuarioDAO.findAll();

    return NextResponse.json({
      success: true,
      data: usuarios,
      message: 'Usuarios obtenidos exitosamente',
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

// POST - Crear un nuevo usuario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = UsuarioValidator.validarRegistro(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos de entrada no válidos',
          errors: validation.errors,
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
      estado: 1,
    });

    return NextResponse.json({
      success: true,
      data: nuevoUsuario,
      message: 'Usuario creado exitosamente',
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/usuarios:', error);
    
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
