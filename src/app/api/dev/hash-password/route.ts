import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Solo disponible en desarrollo. Usa el CLI de Prisma para gestionar contraseñas.' }, { status: 410 });
}