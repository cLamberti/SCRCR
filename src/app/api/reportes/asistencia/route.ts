export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin    = searchParams.get("fechaFin");
    const evento      = searchParams.get("evento");
    const usuario     = searchParams.get("usuario");

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const issues: string[] = [];

    if (fechaInicio && !dateRe.test(fechaInicio)) {
      issues.push("fechaInicio: formato inválido (YYYY-MM-DD).");
    }
    if (fechaFin && !dateRe.test(fechaFin)) {
      issues.push("fechaFin: formato inválido (YYYY-MM-DD).");
    }
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      issues.push("rangoFechas: fechaInicio no puede ser mayor que fechaFin.");
    }

    let eventoNum: number | undefined;
    let usuarioNum: number | undefined;

    if (evento) {
      const n = Number(evento);
      if (!Number.isFinite(n) || n <= 0) {
        issues.push("evento: debe ser número positivo.");
      } else {
        eventoNum = n;
      }
    }

    if (usuario) {
      const n = Number(usuario);
      if (!Number.isFinite(n) || n <= 0) {
        issues.push("usuario: debe ser número positivo.");
      } else {
        usuarioNum = n;
      }
    }

    if (issues.length) {
      return NextResponse.json(
        { success: false, message: "Parámetros inválidos.", errors: issues },
        { status: 400 }
      );
    }

    const where: string[] = [];
    const params: any[] = [];

    if (fechaInicio) { params.push(fechaInicio); where.push(`a.fecha_asistencia >= $${params.length}`); }
    if (fechaFin)    { params.push(fechaFin);    where.push(`a.fecha_asistencia <= $${params.length}`); }
    if (eventoNum)   { params.push(eventoNum);   where.push(`a.id_actividad    = $${params.length}`); }
    if (usuarioNum)  { params.push(usuarioNum);  where.push(`a.id_asociado     = $${params.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        a.id,
        a.id_asociado,
        s.nombre_completo AS asociado_nombre,
        a.id_actividad,
        TO_CHAR(a.fecha_asistencia, 'YYYY-MM-DD') AS fecha_asistencia,
        a.fecha_registro::text AS fecha_registro
      FROM asistencias a
      LEFT JOIN asociados s ON s.id = a.id_asociado
      ${whereSql}
      ORDER BY a.fecha_asistencia DESC, a.id DESC
      LIMIT 5000
    `;

    const { rows } = await db.query(sql, params);
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/reportes/asistencia] error:", err);
    return NextResponse.json(
      { success: false, message: "Error interno al obtener el reporte de asistencia." },
      { status: 500 }
    );
  }
}
