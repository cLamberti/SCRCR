import { NextRequest, NextResponse } from "next/server";
import { ActualizarEventoRequest, EventoResponse } from "@/dto/evento.dto";
import { EventoValidator } from "@/validators/evento.validator";
import { db } from "@/lib/db";

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

    const result = await db.query("SELECT * FROM eventos WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const evento: EventoResponse = result.rows[0];
    return NextResponse.json({ success: true, data: evento });
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

    const cur = await db.query("SELECT * FROM eventos WHERE id = $1", [id]);
    if (cur.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }
    const actual = cur.rows[0];

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
    const descripcion =
      data.descripcion !== undefined ? data.descripcion : actual.descripcion;
    const fecha = data.fecha !== undefined ? data.fecha : actual.fecha;
    const horaFinal =
      data.hora !== undefined
        ? data.hora !== null
          ? data.hora
          : null
        : actual.hora;
    const activo =
      data.activo !== undefined ? Boolean(data.activo) : actual.activo;

    // duplicados contra otros activos
    const dup = await db.query(
      `SELECT id FROM eventos 
       WHERE lower(nombre) = lower($1) AND fecha = $2 AND activo = true AND id <> $3
       LIMIT 1`,
      [nombre, fecha, id]
    );
    if (dup.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe otro evento activo con ese nombre en esa fecha.",
        },
        { status: 409 }
      );
    }

    const campos: string[] = [];
    const valores: any[] = [];
    let i = 1;

    if (data.nombre !== undefined) {
      campos.push(`nombre = $${i}`);
      valores.push(nombre);
      i++;
    }
    if (data.descripcion !== undefined) {
      campos.push(`descripcion = $${i}`);
      valores.push(descripcion);
      i++;
    }
    if (data.fecha !== undefined) {
      campos.push(`fecha = $${i}`);
      valores.push(fecha);
      i++;
    }
    if (data.hora !== undefined) {
      campos.push(`hora = $${i}`);
      valores.push(horaFinal);
      i++;
    }
    if (data.activo !== undefined) {
      campos.push(`activo = $${i}`);
      valores.push(activo);
      i++;
    }

    if (campos.length === 0) {
      return NextResponse.json(
        { success: false, message: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    campos.push("updated_at = CURRENT_TIMESTAMP");
    const sql = `
      UPDATE eventos 
      SET ${campos.join(", ")}
      WHERE id = $${i}
      RETURNING *
    `;
    valores.push(id);

    const result = await db.query(sql, valores);
    return NextResponse.json({
      success: true,
      message: "Evento actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error: any) {
    const msg = error?.message || "";
    if (
      msg.includes("uq_eventos_nombre_fecha") ||
      msg.includes("uq_eventos_nombre_fecha_activo")
    ) {
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

    const check = await db.query("SELECT id FROM eventos WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const result = await db.query(
      `UPDATE eventos 
       SET activo = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Evento eliminado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}
