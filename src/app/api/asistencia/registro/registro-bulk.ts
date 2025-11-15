import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/asistencia/registro-bulk
 * Body:
 * {
 *   "evento_id": number,
 *   "persona_ids": number[],
 *   "fecha": "YYYY-MM-DD"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const evento_id = Number(body?.evento_id);
    const persona_ids = Array.isArray(body?.persona_ids) ? body.persona_ids as number[] : [];
    const fecha = String(body?.fecha ?? "").trim();

    if (!evento_id || evento_id <= 0) {
      return NextResponse.json(
        { success: false, message: "evento_id inválido" },
        { status: 400 }
      );
    }
    if (!persona_ids.length) {
      return NextResponse.json(
        { success: false, message: "persona_ids vacío" },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json(
        { success: false, message: "fecha debe ser YYYY-MM-DD" },
        { status: 400 }
      );
    }

  
    const ev = await db.query(
      "SELECT 1 FROM eventos WHERE id = $1 AND activo = true LIMIT 1",
      [evento_id]
    );
    if (ev.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "El evento no existe o está inactivo" },
        { status: 404 }
      );
    }

    // filtramos ids existentes
    const existentes = await db.query(
      `SELECT id FROM asociados WHERE id = ANY($1::int[])`,
      [persona_ids]
    );
    const setExist = new Set<number>(existentes.rows.map((r: any) => r.id));
    const idsValidos = persona_ids.filter((id) => setExist.has(id));

    if (!idsValidos.length) {
      return NextResponse.json(
        { success: false, message: "Ningún asociado válido para registrar" },
        { status: 400 }
      );
    }


    const dups = await db.query(
      `SELECT id_asociado FROM asistencias
       WHERE id_actividad = $1 AND fecha_asistencia = $2
         AND id_asociado = ANY($3::int[])`,
      [evento_id, fecha, idsValidos]
    );
    const setDup = new Set<number>(dups.rows.map((r: any) => r.id_asociado));

    const aInsertar = idsValidos.filter((id) => !setDup.has(id));
    let inserted = 0;

    if (aInsertar.length > 0) {
  
      const insertSQL = `
        INSERT INTO asistencias (id_asociado, id_actividad, fecha_asistencia, fecha_registro)
        SELECT x.id_asociado, $1, $2, CURRENT_TIMESTAMP
        FROM UNNEST($3::int[]) AS x(id_asociado)
        RETURNING id
      `;
      const res = await db.query(insertSQL, [evento_id, fecha, aInsertar]);
      inserted = res.rowCount || 0;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registro masivo de asistencia completado.",
        inserted,
        duplicated: idsValidos.length - aInsertar.length,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/asistencia/registro-bulk] error:", err);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
