import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no configurado');
    const decoded = jwt.verify(token, secret) as { id: number };

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombreCompleto: true,
        username: true,
        email: true,
        rol: true,
        estado: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: usuario });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no configurado');
    const decoded = jwt.verify(token, secret) as { id: number };

    const { nombreCompleto, email, password } = await request.json();

    const dataToUpdate: any = {};

    if (nombreCompleto) {
      if (typeof nombreCompleto !== 'string' || nombreCompleto.trim().length < 3) {
        return NextResponse.json(
          { success: false, message: "El nombre completo debe tener al menos 3 caracteres" },
          { status: 400 }
        );
      }
      dataToUpdate.nombreCompleto = nombreCompleto.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: "El formato del correo electrónico no es válido" },
          { status: 400 }
        );
      }
      dataToUpdate.email = email.trim().toLowerCase();
    }

    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { success: false, message: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: decoded.id },
      data: dataToUpdate,
      select: {
        id: true,
        nombreCompleto: true,
        username: true,
        email: true,
        rol: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: updatedUser,
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "El correo electrónico ya está en uso por otro usuario" },
        { status: 409 }
      );
    }
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
