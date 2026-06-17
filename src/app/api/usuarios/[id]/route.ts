import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

function getAuthenticatedUser(request: NextRequest): { id: number; rol: string } | null {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no configurado');
    return jwt.verify(token, secret) as { id: number; rol: string };
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = getAuthenticatedUser(request);
    if (!caller) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    if (caller.rol !== "admin") {
      return NextResponse.json(
        { success: false, message: "No tienes permisos para eliminar usuarios" },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    if (caller.id === id) {
      return NextResponse.json(
        { success: false, message: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const isHardDelete = request.nextUrl.searchParams.get("hardDelete") === "true";

    if (isHardDelete) {
      await prisma.usuario.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: "Usuario eliminado permanentemente",
      });
    } else {
      await prisma.usuario.update({
        where: { id },
        data: { estado: 0 },
      });
      return NextResponse.json({
        success: true,
        message: "Usuario desactivado correctamente",
      });
    }
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
