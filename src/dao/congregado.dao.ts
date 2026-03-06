import { neon } from '@neondatabase/serverless';
import {
    CrearCongregadoRequest,
    ActualizarCongregadoRequest,
    FiltrosCongregadoRequest,
} from '@/dto/congregado.dto';
import { Congregado, CongregadoModel, EstadoCongregado } from '@/models/Congregado';

export interface PaginacionResultado<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class CongregadoDAOError extends Error {
    constructor(
        message: string,
        public code?: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'CongregadoDAOError';
    }
}

export class CongregadoDAO {
    private sql: ReturnType<typeof neon>;

    constructor(connectionString?: string) {
        const url = connectionString || process.env.POSTGRES_URL || '';
        this.sql = neon(url);
    }

    private mapRowToCongregado(row: any): Congregado {
        return new CongregadoModel({
            id: row.id,
            nombre: row.nombre,
            cedula: row.cedula,
            fechaIngreso: row.fecha_ingreso,
            telefono: row.telefono,
            segundoTelefono: row.segundo_telefono,
            estadoCivil: row.estado_civil,
            ministerio: row.ministerio,
            segundoMinisterio: row.segundo_ministerio,
            urlFotoCedula: row.url_foto_cedula,
            estado: row.estado,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    async crear(data: CrearCongregadoRequest): Promise<Congregado> {
        try {
            const result = await this.sql`
        INSERT INTO congregados (
          nombre, cedula, fecha_ingreso, telefono,
          segundo_telefono, estado_civil, ministerio,
          segundo_ministerio, url_foto_cedula, estado
        ) VALUES (
          ${data.nombre},
          ${data.cedula},
          ${data.fechaIngreso ? new Date(data.fechaIngreso) : new Date()},
          ${data.telefono},
          ${data.segundoTelefono || null},
          ${data.estadoCivil},
          ${data.ministerio},
          ${data.segundoMinisterio || null},
          ${data.urlFotoCedula},
          ${data.estado ?? EstadoCongregado.ACTIVO}
        )
        RETURNING *
      ` as any[];

            if (!result || result.length === 0) {
                throw new CongregadoDAOError('No se pudo crear el congregado', 'CREATE_FAILED');
            }

            return this.mapRowToCongregado(result[0]);
        } catch (error: any) {
            if (error instanceof CongregadoDAOError) throw error;
            if (error.code === '23505') {
                throw new CongregadoDAOError('Ya existe un congregado con esta cédula', 'DUPLICATE_KEY', error);
            }
            throw new CongregadoDAOError('Error al crear el congregado en la base de datos', 'DATABASE_ERROR', error);
        }
    }

    async obtenerPorId(id: number): Promise<Congregado | null> {
        try {
            const result = await this.sql`SELECT * FROM congregados WHERE id = ${id}` as any[];
            return result.length ? this.mapRowToCongregado(result[0]) : null;
        } catch (error) {
            throw new CongregadoDAOError('Error al obtener el congregado por ID', 'DATABASE_ERROR', error);
        }
    }

    async obtenerPorCedula(cedula: string): Promise<Congregado | null> {
        try {
            const result = await this.sql`SELECT * FROM congregados WHERE cedula = ${cedula}` as any[];
            return result.length ? this.mapRowToCongregado(result[0]) : null;
        } catch (error) {
            throw new CongregadoDAOError('Error al obtener el congregado por cédula', 'DATABASE_ERROR', error);
        }
    }

    async obtenerTodos(
        page: number = 1,
        limit: number = 10,
        estado?: EstadoCongregado,
        filtros?: Pick<FiltrosCongregadoRequest, 'nombre' | 'cedula' | 'estadoCivil' | 'ministerio' | 'fechaIngresoDesde' | 'fechaIngresoHasta'>
    ): Promise<PaginacionResultado<Congregado>> {
        try {
            const offset = (page - 1) * limit;

            const conditions: string[] = [];
            const values: any[] = [];

            if (estado !== undefined) {
                values.push(estado);
                conditions.push(`estado = $${values.length}`);
            }
            if (filtros?.nombre) {
                values.push(`%${filtros.nombre}%`);
                conditions.push(`nombre ILIKE $${values.length}`);
            }
            if (filtros?.cedula) {
                values.push(`%${filtros.cedula}%`);
                conditions.push(`cedula ILIKE $${values.length}`);
            }
            if (filtros?.estadoCivil) {
                values.push(filtros.estadoCivil);
                conditions.push(`estado_civil = $${values.length}`);
            }
            if (filtros?.ministerio) {
                values.push(`%${filtros.ministerio}%`);
                const idx1 = values.length;
                values.push(`%${filtros.ministerio}%`);
                const idx2 = values.length;
                conditions.push(`(ministerio ILIKE $${idx1} OR segundo_ministerio ILIKE $${idx2})`);
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

            const dataResult = await this.sql.query(
                `SELECT * FROM congregados ${where} ORDER BY id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
                [...values, limit, offset]
            ) as { rows: any[] };

            const countResult = await this.sql.query(
                `SELECT COUNT(*) as count FROM congregados ${where}`,
                values
            ) as { rows: any[] };

            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.max(1, Math.ceil(total / limit));

            return {
                data: dataResult.rows.map((row: any) => this.mapRowToCongregado(row)),
                total,
                page,
                limit,
                totalPages,
            };
        } catch (error) {
            throw new CongregadoDAOError('Error al obtener la lista de congregados', 'DATABASE_ERROR', error);
        }
    }

    async actualizar(id: number, data: ActualizarCongregadoRequest): Promise<Congregado> {
        try {
            const existente = await this.obtenerPorId(id);
            if (!existente) {
                throw new CongregadoDAOError('Congregado no encontrado', 'NOT_FOUND');
            }

            // Manejo especial para validación de nulos explícitos (borrar campo) en DTO
            const segundoTelefono = data.segundoTelefono === null ? null : (data.segundoTelefono ?? existente.segundoTelefono);
            const segundoMinisterio = data.segundoMinisterio === null ? null : (data.segundoMinisterio ?? existente.segundoMinisterio);

            const result = await this.sql`
        UPDATE congregados SET
          nombre              = ${data.nombre ?? existente.nombre},
          cedula              = ${data.cedula ?? existente.cedula},
          fecha_ingreso       = ${data.fechaIngreso ? new Date(data.fechaIngreso) : existente.fechaIngreso},
          telefono            = ${data.telefono ?? existente.telefono},
          segundo_telefono    = ${segundoTelefono},
          estado_civil        = ${data.estadoCivil ?? existente.estadoCivil},
          ministerio          = ${data.ministerio ?? existente.ministerio},
          segundo_ministerio  = ${segundoMinisterio},
          url_foto_cedula     = ${data.urlFotoCedula ?? existente.urlFotoCedula},
          estado              = ${data.estado ?? existente.estado},
          updated_at          = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      ` as any[];

            if (!result || result.length === 0) {
                throw new CongregadoDAOError('Error al actualizar el congregado', 'UPDATE_FAILED');
            }

            return this.mapRowToCongregado(result[0]);
        } catch (error: any) {
            if (error instanceof CongregadoDAOError) throw error;
            if (error.code === '23505') {
                throw new CongregadoDAOError('Ya existe un congregado con esta cédula', 'DUPLICATE_KEY', error);
            }
            throw new CongregadoDAOError('Error al actualizar el congregado', 'DATABASE_ERROR', error);
        }
    }

    async eliminar(id: number): Promise<boolean> {
        try {
            const result = await this.sql`
        UPDATE congregados SET estado = ${EstadoCongregado.INACTIVO}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING id
      ` as any[];
            return result.length > 0;
        } catch (error) {
            throw new CongregadoDAOError('Error al eliminar el congregado', 'DATABASE_ERROR', error);
        }
    }

    async eliminarPermanente(id: number): Promise<boolean> {
        try {
            const result = await this.sql`
        DELETE FROM congregados WHERE id = ${id} RETURNING id
      ` as any[];
            return result.length > 0;
        } catch (error) {
            throw new CongregadoDAOError('Error al eliminar permanentemente el congregado', 'DATABASE_ERROR', error);
        }
    }

    async listarTodos(): Promise<Congregado[]> {
        try {
            const result = await this.sql`
        SELECT * FROM congregados ORDER BY nombre
      ` as any[];
            return result.map((row: any) => this.mapRowToCongregado(row));
        } catch (error) {
            throw new CongregadoDAOError('Error al listar todos los congregados', 'DATABASE_ERROR', error);
        }
    }

    async buscarPorNombre(nombre: string, limit: number = 10): Promise<Congregado[]> {
        try {
            const result = await this.sql`
        SELECT * FROM congregados
        WHERE nombre ILIKE ${'%' + nombre + '%'} AND estado = ${EstadoCongregado.ACTIVO}
        ORDER BY nombre
        LIMIT ${limit}
      ` as any[];
            return result.map((row: any) => this.mapRowToCongregado(row));
        } catch (error) {
            throw new CongregadoDAOError('Error al buscar congregados por nombre', 'DATABASE_ERROR', error);
        }
    }

    async obtenerEstadisticas(): Promise<{ total: number; activos: number; inactivos: number }> {
        try {
            const result = await this.sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = ${EstadoCongregado.ACTIVO}) as activos,
          COUNT(*) FILTER (WHERE estado = ${EstadoCongregado.INACTIVO}) as inactivos
        FROM congregados
      ` as any[];
            return {
                total: parseInt(result[0].total),
                activos: parseInt(result[0].activos),
                inactivos: parseInt(result[0].inactivos),
            };
        } catch (error) {
            throw new CongregadoDAOError('Error al obtener estadísticas', 'DATABASE_ERROR', error);
        }
    }
}
