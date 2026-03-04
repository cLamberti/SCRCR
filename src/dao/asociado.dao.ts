import { neon } from '@neondatabase/serverless';
import {
  CrearAsociadoRequest,
  ActualizarAsociadoRequest,
  FiltrosAsociadoRequest,
} from '@/dto/asociado.dto';
import { Asociado, AsociadoModel } from '@/models/Asociado';

export interface PaginacionResultado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AsociadoDAOError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AsociadoDAOError';
  }
}

export class AsociadoDAO {
  private sql: ReturnType<typeof neon>;

  constructor(connectionString?: string) {
    const url = connectionString || process.env.POSTGRES_URL || '';
    this.sql = neon(url);
  }

  private mapRowToAsociado(row: any): Asociado {
    return new AsociadoModel({
      id:             row.id,
      nombreCompleto: row.nombre_completo,
      cedula:         row.cedula,
      correo:         row.correo,
      telefono:       row.telefono,
      ministerio:     row.ministerio,
      direccion:      row.direccion,
      fechaIngreso:   row.fecha_ingreso,
      estado:         row.estado,
    });
  }

  async crear(data: CrearAsociadoRequest): Promise<Asociado> {
    try {
      const result = await this.sql`
        INSERT INTO asociados (
          nombre_completo, cedula, correo, telefono,
          ministerio, direccion, fecha_ingreso, estado
        ) VALUES (
          ${data.nombreCompleto},
          ${data.cedula},
          ${data.correo      || null},
          ${data.telefono    || null},
          ${data.ministerio  || null},
          ${data.direccion   || null},
          ${data.fechaIngreso ? new Date(data.fechaIngreso) : new Date()},
          ${data.estado ?? 1}
        )
        RETURNING *
      `;

      if (!result || (result as any[]).length === 0) {
        throw new AsociadoDAOError('No se pudo crear el asociado', 'CREATE_FAILED');
      }

      return this.mapRowToAsociado((result as any[])[0]);
    } catch (error: any) {
      if (error instanceof AsociadoDAOError) throw error;
      if (error.code === '23505') {
        throw new AsociadoDAOError('Ya existe un asociado con esta cédula', 'DUPLICATE_KEY', error);
      }
      throw new AsociadoDAOError('Error al crear el asociado en la base de datos', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorId(id: number): Promise<Asociado | null> {
    try {
      const result = await this.sql`
        SELECT * FROM asociados WHERE id = ${id}
      `;
      return result.length ? this.mapRowToAsociado(result[0]) : null;
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener el asociado por ID', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorCedula(cedula: string): Promise<Asociado | null> {
    try {
      const result = await this.sql`
        SELECT * FROM asociados WHERE cedula = ${cedula}
      `;
      return result.length ? this.mapRowToAsociado(result[0]) : null;
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener el asociado por cédula', 'DATABASE_ERROR', error);
    }
  }

  /**
   * Lista asociados con filtros opcionales y paginación.
   * Soporta: estado, nombreCompleto (ILIKE), cedula (ILIKE), ministerio (ILIKE),
   * fechaIngresoDesde, fechaIngresoHasta.
   */
  async obtenerTodos(
    page: number = 1,
    limit: number = 10,
    estado?: number,
    filtros?: Pick<FiltrosAsociadoRequest, 'nombreCompleto' | 'cedula' | 'ministerio' | 'fechaIngresoDesde' | 'fechaIngresoHasta'>
  ): Promise<PaginacionResultado<Asociado>> {
    try {
      const offset = (page - 1) * limit;

      /* Construir condiciones dinámicas */
      const conditions: string[] = [];
      const values: any[]        = [];

      if (estado !== undefined) {
        values.push(estado);
        conditions.push(`estado = $${values.length}`);
      }
      if (filtros?.nombreCompleto) {
        values.push(`%${filtros.nombreCompleto}%`);
        conditions.push(`nombre_completo ILIKE $${values.length}`);
      }
      if (filtros?.cedula) {
        values.push(`%${filtros.cedula}%`);
        conditions.push(`cedula ILIKE $${values.length}`);
      }
      if (filtros?.ministerio) {
        values.push(`%${filtros.ministerio}%`);
        conditions.push(`ministerio ILIKE $${values.length}`);
      }
      if (filtros?.fechaIngresoDesde) {
        values.push(new Date(filtros.fechaIngresoDesde));
        conditions.push(`fecha_ingreso >= $${values.length}`);
      }
      if (filtros?.fechaIngresoHasta) {
        values.push(new Date(filtros.fechaIngresoHasta));
        conditions.push(`fecha_ingreso <= $${values.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      /* Neon no acepta query dinámica con tagged template en este caso,
         usamos sql.query para poder pasar parámetros posicionales */
      const dataResult = await this.sql.query(
        `SELECT * FROM asociados ${where} ORDER BY id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      );

      const countResult = await this.sql.query(
        `SELECT COUNT(*) as count FROM asociados ${where}`,
        values
      );

      const total      = parseInt(countResult.rows[0].count);
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data: dataResult.rows.map((row: any) => this.mapRowToAsociado(row)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener la lista de asociados', 'DATABASE_ERROR', error);
    }
  }

  async actualizar(id: number, data: ActualizarAsociadoRequest): Promise<Asociado> {
    try {
      const existente = await this.obtenerPorId(id);
      if (!existente) {
        throw new AsociadoDAOError('Asociado no encontrado', 'NOT_FOUND');
      }

      const result = await this.sql`
        UPDATE asociados SET
          nombre_completo = ${data.nombreCompleto ?? existente.nombreCompleto},
          cedula          = ${data.cedula         ?? existente.cedula},
          correo          = ${data.correo         ?? existente.correo},
          telefono        = ${data.telefono        ?? existente.telefono},
          ministerio      = ${data.ministerio      ?? existente.ministerio},
          direccion       = ${data.direccion       ?? existente.direccion},
          fecha_ingreso   = ${data.fechaIngreso
                              ? new Date(data.fechaIngreso)
                              : existente.fechaIngreso},
          estado          = ${data.estado ?? existente.estado}
        WHERE id = ${id}
        RETURNING *
      `;

      if (!result || (result as any[]).length === 0) {
        throw new AsociadoDAOError('Error al actualizar el asociado', 'UPDATE_FAILED');
      }

      return this.mapRowToAsociado((result as any[])[0]);
    } catch (error: any) {
      if (error instanceof AsociadoDAOError) throw error;
      if (error.code === '23505') {
        throw new AsociadoDAOError('Ya existe un asociado con esta cédula', 'DUPLICATE_KEY', error);
      }
      throw new AsociadoDAOError('Error al actualizar el asociado', 'DATABASE_ERROR', error);
    }
  }

  async eliminar(id: number): Promise<boolean> {
    try {
      const result = await this.sql`
        UPDATE asociados SET estado = 0 WHERE id = ${id} RETURNING id
      `;
      return result.length > 0;
    } catch (error) {
      throw new AsociadoDAOError('Error al eliminar el asociado', 'DATABASE_ERROR', error);
    }
  }

  async eliminarPermanente(id: number): Promise<boolean> {
    try {
      const result = await this.sql`
        DELETE FROM asociados WHERE id = ${id} RETURNING id
      `;
      return result.length > 0;
    } catch (error) {
      throw new AsociadoDAOError('Error al eliminar permanentemente el asociado', 'DATABASE_ERROR', error);
    }
  }

  async listarTodos(): Promise<Asociado[]> {
    try {
      const result = await this.sql`
        SELECT * FROM asociados ORDER BY nombre_completo
      `;
      return (result as any[]).map((row: any) => this.mapRowToAsociado(row));
    } catch (error) {
      throw new AsociadoDAOError('Error al listar todos los asociados', 'DATABASE_ERROR', error);
    }
  }

  async buscarPorNombre(nombre: string, limit: number = 10): Promise<Asociado[]> {
    try {
      const result = await this.sql`
        SELECT * FROM asociados
        WHERE nombre_completo ILIKE ${'%' + nombre + '%'} AND estado = 1
        ORDER BY nombre_completo
        LIMIT ${limit}
      `;
      return (result as any[]).map((row: any) => this.mapRowToAsociado(row));
    } catch (error) {
      throw new AsociadoDAOError('Error al buscar asociados por nombre', 'DATABASE_ERROR', error);
    }
  }

  async obtenerEstadisticas(): Promise<{ total: number; activos: number; inactivos: number }> {
    try {
      const result = await this.sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 1) as activos,
          COUNT(*) FILTER (WHERE estado = 0) as inactivos
        FROM asociados
      `;
      return {
        total:    parseInt(result[0].total),
        activos:  parseInt(result[0].activos),
        inactivos: parseInt(result[0].inactivos),
      };
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener estadísticas', 'DATABASE_ERROR', error);
    }
  }
}