import { NextRequest, NextResponse } from "next/server";
import {
  CrearEventoRequest,
  EventoResponse,
  ListarEventosResponse,
} from "@/dto/evento.dto";
import { EventoValidator } from "@/validators/evento.validator";
import { db } from "@/lib/db";

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

    let query = "SELECT * FROM eventos WHERE 1=1";
    const params: any[] = [];
    let i = 1;

    if (nombre) {
      query += ` AND nombre ILIKE $${i}`;
      params.push(`%${nombre}%`);
      i++;
    }
    if (fechaDesde) {
      query += ` AND fecha >= $${i}`;
      params.push(fechaDesde);
      i++;
    }
    if (fechaHasta) {
      query += ` AND fecha <= $${i}`;
      params.push(fechaHasta);
      i++;
    }
    if (typeof activo === "boolean") {
      query += ` AND activo = $${i}`;
      params.push(activo);
      i++;
    }

    const countQuery = query.replace("SELECT *", "SELECT COUNT(*)");
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    query += ` ORDER BY fecha DESC, hora DESC NULLS LAST LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const response: ListarEventosResponse = {
      success: true,
      data: result.rows,
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
    const dup = await db.query(
      `SELECT id FROM eventos 
       WHERE lower(nombre) = lower($1) AND fecha = $2 AND activo = true 
       LIMIT 1`,
      [data.nombre, data.fecha]
    );
    if (dup.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un evento activo con ese nombre en esa fecha.",
        },
        { status: 409 }
      );
    }

    const insertSQL = `
      INSERT INTO eventos (nombre, descripcion, fecha, hora, activo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const descripcionValue =
      data.descripcion !== undefined && data.descripcion !== null
        ? data.descripcion
        : null;

    const horaValue =
      data.hora !== undefined && data.hora !== null ? data.hora : null;

    const activoValue =
      typeof data.activo === "boolean" ? data.activo : true;

    const values = [
      data.nombre,
      descripcionValue,
      data.fecha,
      horaValue,
      activoValue,
    ];

    const result = await db.query(insertSQL, values);
    const evento: EventoResponse = result.rows[0];

    return NextResponse.json(
      { success: true, message: "Evento creado exitosamente", data: evento },
      { status: 201 }
    );
  } catch (error: any) {
    const msg = error?.message || "";
    if (
      msg.includes("uq_eventos_nombre_fecha") ||
      msg.includes("uq_eventos_nombre_fecha_activo")
    ) {
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
