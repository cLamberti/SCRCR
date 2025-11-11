
import { ReporteAsistencia, EstadoAsistencia } from '@/models/ReporteAsistencia';
import { neon } from '@neondatabase/serverless';
import { CrearReporteAsistenciaRequest, ActualizarReporteAsistenciaRequest } from '@/dto/reporteAsistencia.dto';

export class ReporteAsistenciaDAOError extends Error {
  code: string;
  originalError?: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.code = code;
    this.originalError = originalError;
    this.name = 'ReporteAsistenciaDAOError';
  }
}

export class ReporteAsistenciaDAO {
  private connectionString: string;
  private sql: any;

  constructor(connectionString?: string) {
    this.connectionString = connectionString || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    this.sql = neon(this.connectionString);
  }

  private async getConnection(): Promise<any> {
    if (!this.sql) {
      throw new ReporteAsistenciaDAOError(
        'No se pudo establecer conexión con la base de datos',
        'CONNECTION_ERROR'
      );
    }
    return this.sql;
  }

  private mapRowToReporteAsistencia(row: any): ReporteAsistencia {
    console.log('Mapeando fila:', row); // Debug
    const estadoValido = ['presente', 'ausente', 'justificado'].includes(row.estado);
    if (!estadoValido) {
      console.warn(`Estado inválido encontrado: ${row.estado}, usando 'ausente' por defecto`);
    }

    return {
      id: Number(row.id),
      asociado_id: Number(row.asociado_id),
      evento_id: Number(row.evento_id),
      fecha: row.fecha instanceof Date 
        ? row.fecha.toISOString().split('T')[0]
        : new Date(row.fecha).toISOString().split('T')[0],
      estado: estadoValido ? row.estado as EstadoAsistencia : EstadoAsistencia.Ausente,
      hora_registro: row.hora_registro || null,
      justificacion: row.justificacion || null,
      created_at: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
      updated_at: row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
    };
  }

  async crear(data: CrearReporteAsistenciaRequest): Promise<ReporteAsistencia> {
    try {
      const sql = await this.getConnection();
      
      console.log('Creando registro con datos:', data); // Debug
      
      const result = await sql`
        INSERT INTO reportes_asistencia (
          asociado_id,
          evento_id,
          fecha,
          estado,
          justificacion,
          hora_registro
        ) VALUES (
          ${data.asociado_id},
          ${data.evento_id},
          ${data.fecha},
          ${data.estado},
          ${data.justificacion || null},
          CURRENT_TIME
        )
        ON CONFLICT (asociado_id, evento_id, fecha)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          justificacion = EXCLUDED.justificacion,
          hora_registro = CURRENT_TIME,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      console.log('Resultado de crear:', result); // Debug
      
      if (!result || result.length === 0) {
        throw new ReporteAsistenciaDAOError(
          'No se pudo crear el registro de asistencia',
          'CREATE_FAILED'
        );
      }

      return this.mapRowToReporteAsistencia(result[0]);
    } catch (error: any) {
      console.error('Error en crear:', error); // Debug
      
      if (error instanceof ReporteAsistenciaDAOError) {
        throw error;
      }
      
      if (error.code === '23503') {
        throw new ReporteAsistenciaDAOError(
          'El asociado o evento no existe',
          'FOREIGN_KEY_VIOLATION',
          error
        );
      }

      throw new ReporteAsistenciaDAOError(
        `Error al crear el registro: ${error.message}`,
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
 * Actualiza un registro de asistencia existente
 */
async actualizar(
  id: number,
  data: { estado: string; justificacion?: string }
): Promise<ReporteAsistencia> {
  try {
    const sql = await this.getConnection();
    
    const result = await sql`
      UPDATE reportes_asistencia
      SET 
        estado = ${data.estado},
        justificacion = ${data.justificacion || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!result || result.length === 0) {
      throw new ReporteAsistenciaDAOError(
        'No se pudo actualizar el registro de asistencia',
        'UPDATE_FAILED'
      );
    }

    return this.mapRowToReporteAsistencia(result[0]);
  } catch (error: any) {
    if (error instanceof ReporteAsistenciaDAOError) {
      throw error;
    }
    
    throw new ReporteAsistenciaDAOError(
      'Error al actualizar el registro de asistencia en la base de datos',
      'DATABASE_ERROR',
      error
    );
  }
}
  async obtenerPorEventoId(eventoId: number): Promise<ReporteAsistencia[]> {
    try {
      const sql = await this.getConnection();
      
      console.log('Obteniendo registros para evento:', eventoId); // Debug
      
      const result = await sql`
        SELECT * FROM reportes_asistencia
        WHERE evento_id = ${eventoId}
        ORDER BY id ASC
      `;
      
      console.log('Registros encontrados:', result.length); // Debug
      console.log('Primer registro:', result[0]); // Debug
      
      return result.map((row: any) => this.mapRowToReporteAsistencia(row));
    } catch (error: any) {
      console.error('Error en obtenerPorEventoId:', error); // Debug
      
      throw new ReporteAsistenciaDAOError(
        `Error al obtener registros: ${error.message}`,
        'DATABASE_ERROR',
        error
      );
    }
  }

  async eliminarPorEvento(eventoId: number): Promise<number> {
    try {
      const sql = await this.getConnection();
      
      console.log('Eliminando registros del evento:', eventoId); // Debug
      
      const result = await sql`
        DELETE FROM reportes_asistencia
        WHERE evento_id = ${eventoId}
        RETURNING id
      `;
      
      console.log('Registros eliminados:', result.length); // Debug
      
      return result.length;
    } catch (error: any) {
      console.error('Error en eliminarPorEvento:', error); // Debug
      
      throw new ReporteAsistenciaDAOError(
        `Error al eliminar registros: ${error.message}`,
        'DATABASE_ERROR',
        error
      );
    }
  }

  async obtenerPorId(id: number): Promise<ReporteAsistencia | null> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        SELECT * FROM reportes_asistencia
        WHERE id = ${id}
      `;
      
      if (!result || result.length === 0) {
        return null;
      }

      return this.mapRowToReporteAsistencia(result[0]);
    } catch (error: any) {
      throw new ReporteAsistenciaDAOError(
        `Error al obtener registro por ID: ${error.message}`,
        'DATABASE_ERROR',
        error
      );
    }
  }
}
