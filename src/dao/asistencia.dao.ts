import { pool } from "@/lib/db";
import { RegistroAsistenciaRequest, AsistenciaResponse } from "@/dto/asistencia.dto";

export class AsistenciaDAO {

  async existeAsociado(id_asociado: number): Promise<boolean> {
    const sql = `SELECT 1 FROM asociados WHERE id = $1 LIMIT 1`;
    const { rows } = await pool.query(sql, [id_asociado]);
    return rows.length > 0;
  }

 
  async obtenerPorAsociadoActividadYFecha(
    id_asociado: number,
    id_actividad: number,
    fecha_asistencia: string
  ): Promise<AsistenciaResponse | null> {
    const sql = `
      SELECT 
        id,
        id_asociado,
        id_actividad,
        TO_CHAR(fecha_asistencia, 'YYYY-MM-DD') AS fecha_asistencia,
        fecha_registro::text AS fecha_registro
      FROM asistencias
      WHERE id_asociado = $1
        AND id_actividad = $2
        AND fecha_asistencia = $3
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [id_asociado, id_actividad, fecha_asistencia]);
    return rows[0] ?? null;
  }

  async crear(data: RegistroAsistenciaRequest): Promise<AsistenciaResponse> {
    const sql = `
      INSERT INTO asistencias (
        id_asociado, id_actividad, fecha_asistencia, fecha_registro
      ) VALUES ($1, $2, $3, NOW())
      RETURNING 
        id,
        id_asociado,
        id_actividad,
        TO_CHAR(fecha_asistencia,'YYYY-MM-DD') AS fecha_asistencia,
        fecha_registro::text AS fecha_registro
    `;
    const { rows } = await pool.query(sql, [
      data.id_asociado,
      data.id_actividad,
      data.fecha_asistencia,
    ]);
    return rows[0];
  }
}
