
import { neon } from '@neondatabase/serverless';
import { ReporteAsistencia } from '@/models/ReporteAsistencia';
import { CrearReporteAsistenciaRequest } from '@/dto/reporteAsistencia.dto';

/**
 * Clase de error personalizada para errores del DAO de ReporteAsistencia
 */
export class ReporteAsistenciaDAOError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ReporteAsistenciaDAOError';
  }
}

/**
 * Data Access Object para la entidad ReporteAsistencia (tabla asistencias)
 */
export class ReporteAsistenciaDAO {
  private connectionString: string;
  private sql: any;

  constructor(connectionString?: string) {
    this.connectionString = connectionString || process.env.DATABASE_URL || '';
    this.sql = neon(this.connectionString);
  }

  /**
   * Obtiene la conexión a la base de datos
   */
  private async getConnection(): Promise<any> {
    if (!this.sql) {
      throw new ReporteAsistenciaDAOError(
        'No se pudo establecer conexión con la base de datos',
        'CONNECTION_ERROR'
      );
    }
    return this.sql;
  }

  /**
   * Mapea una fila de la base de datos a un objeto ReporteAsistencia
   */
  private mapRowToReporteAsistencia(row: any): ReporteAsistencia {
    const fechaRegistro = new Date(row.fecha_registro);
    return {
      id: row.id,
      asociado_id: row.asociado_id,
      evento_id: row.evento_id,
      // Extraemos la fecha en formato YYYY-MM-DD
      fecha: fechaRegistro.toISOString().split('T')[0],
      estado: row.estado,
      hora_registro: row.hora_registro,
      justificacion: row.justificacion,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  /**
   * Crea un nuevo registro de asistencia en la base de datos
   */
  async crear(data: CrearReporteAsistenciaRequest): Promise<ReporteAsistencia> {
    try {
      const sql = await this.getConnection();
      
      // La hora actual se registrará en la base de datos
      const result = await sql`
        INSERT INTO asistencias (
          asociado_id,
          evento_id,
          fecha_registro,
          estado,
          justificacion,
          hora_registro
        ) VALUES (
          ${data.asociado_id},
          ${data.evento_id},
          ${new Date(data.fecha)},
          ${data.estado},
          ${data.justificacion || null},
          NOW()::time
        )
        RETURNING *
      `;
      
      if (!result || result.length === 0) {
        throw new ReporteAsistenciaDAOError(
          'No se pudo crear el registro de asistencia',
          'CREATE_FAILED'
        );
      }

      return this.mapRowToReporteAsistencia(result[0]);
    } catch (error: any) {
      if (error instanceof ReporteAsistenciaDAOError) {
        throw error;
      }
      
      // Manejar errores específicos de PostgreSQL (ej. foreign key, unique constraint)
      if (error.code === '23503') { // Foreign key violation
        throw new ReporteAsistenciaDAOError(
          'El asociado_id o evento_id no existen',
          'FOREIGN_KEY_VIOLATION',
          error
        );
      }
       if (error.code === '23505') { // Unique constraint violation
        throw new ReporteAsistenciaDAOError(
          'Este asociado ya tiene un registro de asistencia para este evento',
          'DUPLICATE_KEY',
          error
        );
      }

      throw new ReporteAsistenciaDAOError(
        'Error al crear el registro de asistencia en la base de datos',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene todos los registros de asistencia para un evento específico
   */
  async obtenerPorEventoId(eventoId: number): Promise<ReporteAsistencia[]> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        SELECT * FROM asistencias
        WHERE evento_id = ${eventoId}
        ORDER BY id ASC
      `;
      
      return result.map((row: any) => this.mapRowToReporteAsistencia(row));
    } catch (error) {
      throw new ReporteAsistenciaDAOError(
        'Error al obtener los registros de asistencia por evento',
        'DATABASE_ERROR',
        error
      );
    }
  }
}
