import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const isHardDelete = searchParams.get("hardDelete") === "true";

    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (isHardDelete) {
      await prisma.usuario.delete({
        where: { id },
      });
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
        message: "Usuario desactivado (soft delete)",
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
