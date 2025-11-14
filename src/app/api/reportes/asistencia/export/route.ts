export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function escapeCSV(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin    = searchParams.get("fechaFin");
    const evento      = searchParams.get("evento");
    const usuario     = searchParams.get("usuario");

    // Validaciones
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
      LIMIT 50000
    `;

    const { rows } = await db.query(sql, params);

    const header = [
      "id",
      "id_asociado",
      "asociado_nombre",
      "id_actividad",
      "fecha_asistencia",
      "fecha_registro",
    ];

    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((r: any) =>
          [
            r.id,
            r.id_asociado,
            r.asociado_nombre ?? "",
            r.id_actividad,
            r.fecha_asistencia,
            r.fecha_registro,
          ]
            .map(escapeCSV)
            .join(",")
        )
        .join("\n");

    const filename = `reporte_asistencia_${Date.now()}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/reportes/asistencia/export] error:", err);
    return NextResponse.json(
      { success: false, message: "Error interno al exportar el reporte de asistencia." },
      { status: 500 }
    );
  }
}
