import { NextRequest, NextResponse } from "next/server";
import { ActualizarEventoRequest, EventoResponse } from "@/dto/evento.dto";
import { EventoValidator } from "@/validators/evento.validator";
import { prisma } from "@/lib/db";
import { AuditoriaDAO } from "@/dao/auditoria.dao";

function mapEventoToResponse(evento: any): EventoResponse {
  return {
    ...evento,
    fecha: evento.fecha instanceof Date ? evento.fecha.toISOString().split('T')[0] : evento.fecha,
    hora: evento.hora instanceof Date ? evento.hora.toISOString().split('T')[1].substring(0, 8) : evento.hora,
    created_at: evento.createdAt ? evento.createdAt.toISOString() : evento.created_at,
    updated_at: evento.updatedAt ? evento.updatedAt.toISOString() : evento.updated_at,
  };
}

/** GET /api/eventos/[id] */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID de evento inválido" },
        { status: 400 }
      );
    }

    const evento = await prisma.evento.findUnique({
      where: { id }
    });

    if (!evento) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: mapEventoToResponse(evento) });
  } catch (error) {
    console.error("Error al obtener evento:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener evento" },
      { status: 500 }
    );
  }
}

/** PUT /api/eventos/[id] */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID de evento inválido" },
        { status: 400 }
      );
    }

    const actual = await prisma.evento.findUnique({
      where: { id }
    });

    if (!actual) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const raw: ActualizarEventoRequest = await request.json();
    const data = EventoValidator.sanitizarDatos(raw);
    const check = EventoValidator.validarActualizarEvento(data);
    if (!check.valid) {
      return NextResponse.json(
        { success: false, message: "Errores de validación", errors: check.errors },
        { status: 400 }
      );
    }

    const nombre = data.nombre !== undefined ? data.nombre : actual.nombre;
    const descripcion = data.descripcion !== undefined ? data.descripcion : actual.descripcion;
    const fecha = data.fecha !== undefined ? new Date(data.fecha) : actual.fecha;
    const horaFinal = data.hora !== undefined 
      ? (data.hora !== null ? new Date(`1970-01-01T${data.hora}Z`) : null) 
      : actual.hora;
    const activo = data.activo !== undefined ? Boolean(data.activo) : actual.activo;

    // duplicados contra otros activos
    const dup = await prisma.evento.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        fecha: fecha,
        activo: true,
        id: { not: id }
      }
    });

    if (dup) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe otro evento activo con ese nombre en esa fecha.",
        },
        { status: 409 }
      );
    }

    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = nombre;
    if (data.descripcion !== undefined) updateData.descripcion = descripcion;
    if (data.fecha !== undefined) updateData.fecha = fecha;
    if (data.hora !== undefined) updateData.hora = horaFinal;
    if (data.activo !== undefined) updateData.activo = activo;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const result = await prisma.evento.update({
      where: { id },
      data: updateData
    });

    await AuditoriaDAO.registrar('eventos', id, 'edicion', `Modificación del evento: ${result.nombre}`);

    return NextResponse.json({
      success: true,
      message: "Evento actualizado exitosamente",
      data: mapEventoToResponse(result),
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe otro evento activo con ese nombre en esa fecha.",
        },
        { status: 409 }
      );
    }

    console.error("Error al actualizar evento:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

/** DELETE /api/eventos/[id] — soft delete */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID de evento inválido" },
        { status: 400 }
      );
    }

    const actual = await prisma.evento.findUnique({
      where: { id }
    });

    if (!actual) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const result = await prisma.evento.update({
      where: { id },
      data: {
        activo: false
      }
    });

    await AuditoriaDAO.registrar('eventos', id, 'eliminacion', `Desactivación del evento: ${result.nombre}`);

    return NextResponse.json({
      success: true,
      message: "Evento eliminado exitosamente",
      data: mapEventoToResponse(result),
    });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}
