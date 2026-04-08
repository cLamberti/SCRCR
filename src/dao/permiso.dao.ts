import { neon } from '@neondatabase/serverless';
import { Permiso, PermisoModel } from '@/models/Permiso';
import { CrearPermisoRequest, PermisoExtendidoDto } from '@/dto/permiso.dto';

export class PermisoDAOError extends Error {
  constructor(message: string, public code?: string, public originalError?: unknown) {
    super(message);
    this.name = 'PermisoDAOError';
  }
}

export interface PaginacionResultado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PermisoDAO {
  private sql: ReturnType<typeof neon>;

  constructor(connectionString?: string) {
    const url = connectionString || process.env.POSTGRES_URL || '';
    this.sql = neon(url);
  }

  private mapRowToPermiso(row: any): Permiso {
    return new PermisoModel({
      id: row.id,
      usuarioId: row.usuario_id,
      fechaInicio: row.fecha_inicio.toISOString().split('T')[0],
      fechaFin: row.fecha_fin.toISOString().split('T')[0],
      motivo: row.motivo,
      documentoUrl: row.documento_url || null,
      estado: row.estado,
      observacionesResolucion: row.observaciones_resolucion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private mapRowToPermisoExtendido(row: any): PermisoExtendidoDto {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      nombreCompleto: row.nombre_completo,
      fechaInicio: row.fecha_inicio.toISOString().split('T')[0],
      fechaFin: row.fecha_fin.toISOString().split('T')[0],
      motivo: row.motivo,
      documentoUrl: row.documento_url || null,
      estado: row.estado,
      observacionesResolucion: row.observaciones_resolucion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async crear(usuarioId: number, data: CrearPermisoRequest): Promise<Permiso> {
    try {
      const result = await this.sql`
        INSERT INTO permisos (
          usuario_id, fecha_inicio, fecha_fin, motivo, documento_url, estado
        ) VALUES (
          ${usuarioId},
          ${data.fechaInicio},
          ${data.fechaFin},
          ${data.motivo},
          ${data.documentoUrl || null},
          ${data.estado || 'PENDIENTE'}
        )
        RETURNING *
      ` as any[];

      if (!result || result.length === 0) {
        throw new PermisoDAOError('No se pudo crear el permiso', 'CREATE_FAILED');
      }

      return this.mapRowToPermiso(result[0]);
    } catch (error: any) {
      throw new PermisoDAOError('Error al crear el permiso en la base de datos', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorId(id: number): Promise<PermisoExtendidoDto | null> {
    try {
      const result = await this.sql`
        SELECT p.*, u.nombre_completo 
        FROM permisos p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.id = ${id}
      ` as any[];
      return result.length ? this.mapRowToPermisoExtendido(result[0]) : null;
    } catch (error) {
      throw new PermisoDAOError('Error al obtener el permiso por ID', 'DATABASE_ERROR', error);
    }
  }

  async verificarTraslape(usuarioId: number, fechaInicio: string, fechaFin: string): Promise<boolean> {
    try {
      const result = await this.sql`
        SELECT id FROM permisos
        WHERE usuario_id = ${usuarioId}
        AND estado IN ('PENDIENTE', 'APROBADO')
        AND (
          (fecha_inicio <= ${fechaFin} AND fecha_fin >= ${fechaInicio})
        )
        LIMIT 1
      ` as any[];
      return result.length > 0;
    } catch (error) {
      throw new PermisoDAOError('Error al verificar traslape de fechas', 'DATABASE_ERROR', error);
    }
  }

  async obtenerTodos(
    page: number = 1,
    limit: number = 10,
    usuarioId?: number // Si es un usuario normal, listamos solo los suyos
  ): Promise<PaginacionResultado<PermisoExtendidoDto>> {
    try {
      const offset = (page - 1) * limit;

      let dataResult;
      let countResult;

      if (usuarioId !== undefined) {
        dataResult = await this.sql`
          SELECT p.*, u.nombre_completo 
          FROM permisos p
          JOIN usuarios u ON p.usuario_id = u.id
          WHERE p.usuario_id = ${usuarioId}
          ORDER BY p.id DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as any[];

        countResult = await this.sql`
          SELECT COUNT(*) as count FROM permisos WHERE usuario_id = ${usuarioId}
        ` as any[];
      } else {
        dataResult = await this.sql`
          SELECT p.*, u.nombre_completo 
          FROM permisos p
          JOIN usuarios u ON p.usuario_id = u.id
          ORDER BY p.id DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as any[];

        countResult = await this.sql`
          SELECT COUNT(*) as count FROM permisos
        ` as any[];
      }

      const total = parseInt(countResult[0].count);
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data: dataResult.map(row => this.mapRowToPermisoExtendido(row)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new PermisoDAOError('Error al obtener la lista de permisos', 'DATABASE_ERROR', error);
    }
  }

  async actualizarEstado(id: number, estado: 'APROBADO' | 'RECHAZADO', observaciones?: string): Promise<Permiso> {
    try {
      const result = await this.sql`
        UPDATE permisos SET
          estado = ${estado},
          observaciones_resolucion = ${observaciones || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      ` as any[];

      if (!result || result.length === 0) {
        throw new PermisoDAOError('Error al actualizar estado del permiso', 'UPDATE_FAILED');
      }

      return this.mapRowToPermiso(result[0]);
    } catch (error) {
      throw new PermisoDAOError('Error al actualizar estado', 'DATABASE_ERROR', error);
    }
  }
}
