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

    const secret = process.env.JWT_SECRET || "uwrT0PdHQ7gkJeoaD3iKqMGk";
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

    const secret = process.env.JWT_SECRET || "uwrT0PdHQ7gkJeoaD3iKqMGk";
    const decoded = jwt.verify(token, secret) as { id: number };

    const { nombreCompleto, email, password } = await request.json();

    const dataToUpdate: any = {};
    if (nombreCompleto) dataToUpdate.nombreCompleto = nombreCompleto;
    if (email) dataToUpdate.email = email;
    if (password) {
      const saltRounds = 10;
      dataToUpdate.passwordHash = await bcrypt.hash(password, saltRounds);
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
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
