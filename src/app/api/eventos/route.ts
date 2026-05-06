import { NextRequest, NextResponse } from "next/server";
import {
  CrearEventoRequest,
  EventoResponse,
  ListarEventosResponse,
} from "@/dto/evento.dto";
import { EventoValidator } from "@/validators/evento.validator";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
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

/**
 * GET /api/eventos - Listar eventos con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nombre = searchParams.get("nombre") || undefined;
    const fechaDesde = searchParams.get("fechaDesde") || undefined;
    const fechaHasta = searchParams.get("fechaHasta") || undefined;
    const activoParam = searchParams.get("activo");
    const activo =
      activoParam !== null ? (activoParam === "true" ? true : false) : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const where: Prisma.EventoWhereInput = {};

    if (nombre) {
      where.nombre = { contains: nombre, mode: 'insensitive' };
    }
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }
    if (typeof activo === "boolean") {
      where.activo = activo;
    }

    const total = await prisma.evento.count({ where });
    const eventos = await prisma.evento.findMany({
      where,
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ],
      take: limit,
      skip: offset,
    });

    const response: ListarEventosResponse = {
      success: true,
      data: eventos.map(mapEventoToResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al listar eventos:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eventos - Crear un nuevo evento
 * Reglas: fecha válida/no pasada + duplicados (nombre+fecha activos)
 */
export async function POST(request: NextRequest) {
  try {
    const raw: CrearEventoRequest = await request.json();

    const data = EventoValidator.sanitizarDatos(raw);
    const check = EventoValidator.validarCrearEvento(data);
    if (!check.valid) {
      return NextResponse.json(
        { success: false, message: "Errores de validación", errors: check.errors },
        { status: 400 }
      );
    }

    // Duplicados (nombre+fecha, solo activos)
    const dup = await prisma.evento.findFirst({
      where: {
        nombre: { equals: data.nombre, mode: 'insensitive' },
        fecha: new Date(data.fecha),
        activo: true
      }
    });

    if (dup) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un evento activo con ese nombre en esa fecha.",
        },
        { status: 409 }
      );
    }

    const descripcionValue =
      data.descripcion !== undefined && data.descripcion !== null
        ? data.descripcion
        : null;

    const horaValue = data.hora ? new Date(`1970-01-01T${data.hora}Z`) : new Date('1970-01-01T00:00:00Z');
    const activoValue = typeof data.activo === "boolean" ? data.activo : true;

    const evento = await prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: descripcionValue,
        fecha: new Date(data.fecha),
        hora: horaValue,
        activo: activoValue,
      }
    });

    await AuditoriaDAO.registrar('eventos', evento.id, 'creacion', `Evento creado: ${evento.nombre}`);

    return NextResponse.json(
      { success: true, message: "Evento creado exitosamente", data: mapEventoToResponse(evento) },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un evento activo con ese nombre en esa fecha.",
        },
        { status: 409 }
      );
    }

    console.error("Error al crear evento:", error);
    return NextResponse.json(
      { success: false, message: "Error al crear evento" },
      { status: 500 }
    );
  }
}
