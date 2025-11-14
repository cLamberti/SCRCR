import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/asistencia/registro
 * Body esperado:
 * {
 *   "id_asociado": number,
 *   "id_actividad": number,   // id del evento
 *   "fecha_asistencia": "YYYY-MM-DD"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const id_asociado = Number(body?.id_asociado);
    const id_actividad = Number(body?.id_actividad);
    const fecha_asistencia = String(body?.fecha_asistencia ?? "").trim();


    if (!id_asociado || id_asociado <= 0) {
      return NextResponse.json(
        { success: false, message: "id_asociado inválido" },
        { status: 400 }
      );
    }
    if (!id_actividad || id_actividad <= 0) {
      return NextResponse.json(
        { success: false, message: "id_actividad inválido" },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_asistencia)) {
      return NextResponse.json(
        { success: false, message: "fecha_asistencia debe ser YYYY-MM-DD" },
        { status: 400 }
      );
    }

 
    const existeAsociado = await db.query(
      "SELECT 1 FROM asociados WHERE id = $1 LIMIT 1",
      [id_asociado]
    );
    if (existeAsociado.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "El asociado no existe" },
        { status: 404 }
      );
    }

   
    const existeEvento = await db.query(
      "SELECT 1 FROM eventos WHERE id = $1 AND activo = true LIMIT 1",
      [id_actividad]
    );
    if (existeEvento.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "El evento no existe o está inactivo" },
        { status: 404 }
      );
    }

    // Evitar duplicados
    const dup = await db.query(
      `SELECT 1 FROM asistencias 
       WHERE id_asociado = $1 AND id_actividad = $2 AND fecha_asistencia = $3 
       LIMIT 1`,
      [id_asociado, id_actividad, fecha_asistencia]
    );
    if (dup.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La asistencia ya fue registrada para ese asociado, actividad y fecha.",
        },
        { status: 409 }
      );
    }

    // Insertar
    const insertSQL = `
      INSERT INTO asistencias (id_asociado, id_actividad, fecha_asistencia, fecha_registro)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id, id_asociado, id_actividad, fecha_asistencia, fecha_registro
    `;
    const values = [id_asociado, id_actividad, fecha_asistencia];

    const result = await db.query(insertSQL, values);
    const row = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: "Asistencia registrada correctamente.",
        data: row,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/asistencia/registro] error:", err);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
