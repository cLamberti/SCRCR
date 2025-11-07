import { neon } from "@neondatabase/serverless";
import { RegistroAsistenciaRequest, AsistenciaResponse } from "@/dto/asistencia.dto";


export class AsistenciaDAOError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "AsistenciaDAOError";
  }
}

export class AsistenciaDAO {
  private connectionString: string;
  private sql: any;

  constructor(connectionString?: string) {
    this.connectionString = connectionString || process.env.POSTGRES_URL || "";
    this.sql = neon(this.connectionString);
  }

  private async getConnection(): Promise<any> {
    if (!this.sql) {
      throw new AsistenciaDAOError(
        "No se pudo establecer conexión con la base de datos",
        "CONNECTION_ERROR"
      );
    }
    return this.sql;
  }

 
  async existeAsociado(id_asociado: number): Promise<boolean> {
    try {
      const sql = await this.getConnection();
      const result = await sql`
        SELECT 1 FROM asociados WHERE id = ${id_asociado} LIMIT 1
      `;
      return !!(result && result.length > 0);
    } catch (error) {
      throw new AsistenciaDAOError(
        "Error al verificar existencia de asociado",
        "DATABASE_ERROR",
        error
      );
    }
  }

 
  async obtenerPorAsociadoActividadYFecha(
    id_asociado: number,
    id_actividad: number,
    fecha_asistencia: string 
  ): Promise<AsistenciaResponse | null> {
    try {
      const sql = await this.getConnection();
      const result = await sql`
        SELECT
          id,
          id_asociado,
          id_actividad,
          TO_CHAR(fecha_asistencia, 'YYYY-MM-DD') AS fecha_asistencia,
          fecha_registro::text AS fecha_registro
        FROM asistencias
        WHERE id_asociado = ${id_asociado}
          AND id_actividad = ${id_actividad}
          AND fecha_asistencia = TO_DATE(${fecha_asistencia}, 'YYYY-MM-DD')
        LIMIT 1
      `;
      if (!result || result.length === 0) return null;
      return {
        id: result[0].id,
        id_asociado: result[0].id_asociado,
        id_actividad: result[0].id_actividad,
        fecha_asistencia: result[0].fecha_asistencia,
        fecha_registro: result[0].fecha_registro,
      };
    } catch (error) {
      throw new AsistenciaDAOError(
        "Error al consultar asistencia existente",
        "DATABASE_ERROR",
        error
      );
    }
  }


  async crear(params: RegistroAsistenciaRequest): Promise<AsistenciaResponse> {
    try {
      const sql = await this.getConnection();
      const result = await sql`
        INSERT INTO asistencias (
          id_asociado,
          id_actividad,
          fecha_asistencia,
          fecha_registro
        )
        VALUES (
          ${params.id_asociado},
          ${params.id_actividad},
          TO_DATE(${params.fecha_asistencia}, 'YYYY-MM-DD'),
          NOW()
        )
        RETURNING
          id,
          id_asociado,
          id_actividad,
          TO_CHAR(fecha_asistencia, 'YYYY-MM-DD') AS fecha_asistencia,
          fecha_registro::text AS fecha_registro
      `;
      if (!result || result.length === 0) {
        throw new AsistenciaDAOError("No se pudo crear la asistencia", "CREATE_FAILED");
      }
      return {
        id: result[0].id,
        id_asociado: result[0].id_asociado,
        id_actividad: result[0].id_actividad,
        fecha_asistencia: result[0].fecha_asistencia,
        fecha_registro: result[0].fecha_registro,
      };
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AsistenciaDAOError(
          "Registro de asistencia duplicado",
          "DUPLICATE_KEY",
          error
        );
      }
      throw new AsistenciaDAOError(
        "Error al crear la asistencia",
        "DATABASE_ERROR",
        error
      );
    }
  }
}
