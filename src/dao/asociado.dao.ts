import { neon } from '@neondatabase/serverless';
import {
  CrearAsociadoRequest,
  ActualizarAsociadoRequest,
} from '@/dto/asociado.dto';
import { Asociado, AsociadoModel } from '@/models/Asociado';

/**
 * Interfaz para el resultado de paginación
 */
export interface PaginacionResultado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Clase de error personalizada para errores del DAO
 */
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

/**
 * Data Access Object para la entidad Asociado
 */
export class AsociadoDAO {
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
      throw new AsociadoDAOError(
        'No se pudo establecer conexión con la base de datos',
        'CONNECTION_ERROR'
      );
    }
    return this.sql;
  }

  /**
   * Mapea una fila de la base de datos a un objeto Asociado
   */
  private mapRowToAsociado(row: any): Asociado {
    return new AsociadoModel({
      id: row.id,
      nombreCompleto: row.nombre_completo,
      cedula: row.cedula,
      correo: row.correo,
      telefono: row.telefono,
      ministerio: row.ministerio,
      direccion: row.direccion,
      fechaIngreso: row.fecha_ingreso,
      estado: row.estado
    });
  }

  /**
   * Crea un nuevo asociado en la base de datos
   */
  async crear(data: CrearAsociadoRequest): Promise<Asociado> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        INSERT INTO asociados (
          nombre_completo,
          cedula,
          correo,
          telefono,
          ministerio,
          direccion,
          fecha_ingreso,
          estado
        ) VALUES (
          ${data.nombreCompleto},
          ${data.cedula},
          ${data.correo || null},
          ${data.telefono || null},
          ${data.ministerio || null},
          ${data.direccion || null},
          ${data.fechaIngreso ? new Date(data.fechaIngreso) : new Date()},
          ${data.estado ?? 1}
        )
        RETURNING *
      `;
      
      if (!result || result.length === 0) {
        throw new AsociadoDAOError(
          'No se pudo crear el asociado',
          'CREATE_FAILED'
        );
      }

      return this.mapRowToAsociado(result[0]);
    } catch (error: any) {
      if (error instanceof AsociadoDAOError) {
        throw error;
      }
      
      // Manejar errores específicos de PostgreSQL
      if (error.code === '23505') {
        throw new AsociadoDAOError(
          'Ya existe un asociado con esta cédula',
          'DUPLICATE_KEY',
          error
        );
      }

      throw new AsociadoDAOError(
        'Error al crear el asociado en la base de datos',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene un asociado por su ID
   */
  async obtenerPorId(id: number): Promise<Asociado | null> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        SELECT * FROM asociados
        WHERE id = ${id}
      `;
      
      if (!result || result.length === 0) {
        return null;
      }

      return this.mapRowToAsociado(result[0]);
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al obtener el asociado por ID',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene un asociado por su cédula
   */
  async obtenerPorCedula(cedula: string): Promise<Asociado | null> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        SELECT * FROM asociados
        WHERE cedula = ${cedula}
      `;
      
      if (!result || result.length === 0) {
        return null;
      }

      return this.mapRowToAsociado(result[0]);
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al obtener el asociado por cédula',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene todos los asociados con paginación
   */
  async obtenerTodos(
    page: number = 1,
    limit: number = 10,
    estado?: number
  ): Promise<PaginacionResultado<Asociado>> {
    try {
      const sql = await this.getConnection();
      const offset = (page - 1) * limit;
      
      let dataResult;
      let countResult;
      
      if (estado !== undefined) {
        dataResult = await sql`
          SELECT * FROM asociados
          WHERE estado = ${estado}
          ORDER BY id DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        
        countResult = await sql`
          SELECT COUNT(*) as count FROM asociados
          WHERE estado = ${estado}
        `;
      } else {
        dataResult = await sql`
          SELECT * FROM asociados
          ORDER BY id DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        
        countResult = await sql`
          SELECT COUNT(*) as count FROM asociados
        `;
      }

      const total = parseInt(countResult[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.map((row: any) => this.mapRowToAsociado(row)),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al obtener la lista de asociados',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Actualiza un asociado existente
   */
  async actualizar(id: number, data: ActualizarAsociadoRequest): Promise<Asociado> {
    try {
      const sql = await this.getConnection();
      
      // Construir objeto con solo los campos a actualizar
      const updates: any = {};
      
      if (data.nombreCompleto !== undefined) updates.nombre_completo = data.nombreCompleto;
      if (data.cedula !== undefined) updates.cedula = data.cedula;
      if (data.correo !== undefined) updates.correo = data.correo;
      if (data.telefono !== undefined) updates.telefono = data.telefono;
      if (data.ministerio !== undefined) updates.ministerio = data.ministerio;
      if (data.direccion !== undefined) updates.direccion = data.direccion;
      if (data.fechaIngreso !== undefined) updates.fecha_ingreso = new Date(data.fechaIngreso);
      if (data.estado !== undefined) updates.estado = data.estado;

      if (Object.keys(updates).length === 0) {
        throw new AsociadoDAOError(
          'No hay campos para actualizar',
          'NO_UPDATES'
        );
      }

      // Construir la consulta dinámicamente
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = ${index + 1}`)
        .join(', ');
      
      const values = Object.values(updates);
      values.push(id);

      const result = await sql`
        UPDATE asociados
        SET ${sql(updates)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (!result || result.length === 0) {
        throw new AsociadoDAOError(
          'Asociado no encontrado',
          'NOT_FOUND'
        );
      }

      return this.mapRowToAsociado(result[0]);
    } catch (error: any) {
      if (error instanceof AsociadoDAOError) {
        throw error;
      }

      if (error.code === '23505') {
        throw new AsociadoDAOError(
          'Ya existe un asociado con esta cédula',
          'DUPLICATE_KEY',
          error
        );
      }

      throw new AsociadoDAOError(
        'Error al actualizar el asociado',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Elimina un asociado (soft delete - cambia estado a 0)
   */
  async eliminar(id: number): Promise<boolean> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        UPDATE asociados
        SET estado = 0
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result && result.length > 0;
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al eliminar el asociado',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Elimina permanentemente un asociado (hard delete)
   */
  async eliminarPermanente(id: number): Promise<boolean> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        DELETE FROM asociados
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result && result.length > 0;
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al eliminar permanentemente el asociado',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Busca asociados por nombre
   */
  async buscarPorNombre(nombre: string, limit: number = 10): Promise<Asociado[]> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        SELECT * FROM asociados
        WHERE nombre_completo ILIKE ${'%' + nombre + '%'}
        AND estado = 1
        ORDER BY nombre_completo
        LIMIT ${limit}
      `;
      
      return result.map((row: any) => this.mapRowToAsociado(row));
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al buscar asociados por nombre',
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene estadísticas de asociados
   */
  async obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
  }> {
    try {
      const sql = await this.getConnection();
      
      const result = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 1) as activos,
          COUNT(*) FILTER (WHERE estado = 0) as inactivos
        FROM asociados
      `;
      
      return {
        total: parseInt(result[0].total),
        activos: parseInt(result[0].activos),
        inactivos: parseInt(result[0].inactivos)
      };
    } catch (error) {
      throw new AsociadoDAOError(
        'Error al obtener estadísticas',
        'DATABASE_ERROR',
        error
      );
    }
  }
}