import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password) {
      return NextResponse.json(
        { message: 'Por favor, proporciona una contraseña en la URL. Ejemplo: /api/dev/hash-password?password=tu_contraseña' },
        { status: 400 }
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return NextResponse.json({
      password_original: password,
      hash: hashedPassword,
    });

  } catch (error) {
    console.error('Error al generar el hash:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al generar el hash' },
      { status: 500 }
    );
  }
}