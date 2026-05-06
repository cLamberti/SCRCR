import { db } from '@/lib/db';
import {
    CrearCongregadoRequest,
    ActualizarCongregadoRequest,
    FiltrosCongregadoRequest,
} from '@/dto/congregado.dto';
import { Congregado, CongregadoModel, EstadoCongregado } from '@/models/Congregado';
import { AuditoriaDAO } from './auditoria.dao';

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

    private mapRowToCongregado(row: any): Congregado {
        return new CongregadoModel({
            id:                row.id,
            nombre:            row.nombre,
            cedula:            row.cedula,
            fechaIngreso:      row.fecha_ingreso,
            telefono:          row.telefono,
            segundoTelefono:   row.segundo_telefono,
            estadoCivil:       row.estado_civil,
            ministerio:        row.ministerio,
            segundoMinisterio: row.segundo_ministerio,
            urlFotoCedula:     row.url_foto_cedula,
            estado:            row.estado,
            createdAt:         row.created_at,
            updatedAt:         row.updated_at,
        });
    }

    async crear(data: CrearCongregadoRequest): Promise<Congregado> {
        try {
            const result = await db.query(
                `INSERT INTO congregados (
                    nombre, cedula, fecha_ingreso, telefono,
                    segundo_telefono, estado_civil, ministerio,
                    segundo_ministerio, url_foto_cedula, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    data.nombre,
                    data.cedula,
                    data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
                    data.telefono,
                    data.segundoTelefono   || null,
                    data.estadoCivil,
                    data.ministerio,
                    data.segundoMinisterio || null,
                    data.urlFotoCedula,
                    data.estado ?? EstadoCongregado.ACTIVO,
                ]
            );

            const congregado = this.mapRowToCongregado(result.rows[0]);
            await AuditoriaDAO.registrar('congregados', congregado.id, 'creacion', 'Registro inicial del congregado');
            return congregado;
        } catch (error: any) {
            if (error instanceof CongregadoDAOError) throw error;
            if (error.code === '23505') {
                throw new CongregadoDAOError('Ya existe un congregado con esta cédula', 'DUPLICATE_KEY', error);
            }
            throw new CongregadoDAOError('Error al crear el congregado', 'DATABASE_ERROR', error);
        }
    }

    async obtenerPorId(id: number): Promise<Congregado | null> {
        try {
            const result = await db.query(
                'SELECT * FROM congregados WHERE id = $1',
                [id]
            );
            return result.rows.length ? this.mapRowToCongregado(result.rows[0]) : null;
        } catch (error) {
            throw new CongregadoDAOError('Error al obtener el congregado por ID', 'DATABASE_ERROR', error);
        }
    }

    async obtenerPorCedula(cedula: string): Promise<Congregado | null> {
        try {
            const result = await db.query(
                'SELECT * FROM congregados WHERE cedula = $1',
                [cedula]
            );
            return result.rows.length ? this.mapRowToCongregado(result.rows[0]) : null;
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
            const offset     = (page - 1) * limit;
            const conditions: string[] = [];
            const values: any[]        = [];

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

            const countResult = await db.query(
                `SELECT COUNT(*) as count FROM congregados ${where}`,
                values
            );
            const total      = parseInt(countResult.rows[0].count, 10);
            const totalPages = Math.max(1, Math.ceil(total / limit));

            const dataResult = await db.query(
                `SELECT * FROM congregados ${where} ORDER BY nombre ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
                [...values, limit, offset]
            );

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

            const segundoTelefono   = data.segundoTelefono   === null ? null : (data.segundoTelefono   ?? existente.segundoTelefono);
            const segundoMinisterio = data.segundoMinisterio === null ? null : (data.segundoMinisterio ?? existente.segundoMinisterio);

            const result = await db.query(
                `UPDATE congregados SET
                    nombre             = $1,
                    cedula             = $2,
                    fecha_ingreso      = $3,
                    telefono           = $4,
                    segundo_telefono   = $5,
                    estado_civil       = $6,
                    ministerio         = $7,
                    segundo_ministerio = $8,
                    url_foto_cedula    = $9,
                    estado             = $10,
                    updated_at         = CURRENT_TIMESTAMP
                WHERE id = $11
                RETURNING *`,
                [
                    data.nombre        ?? existente.nombre,
                    data.cedula        ?? existente.cedula,
                    data.fechaIngreso  ? new Date(data.fechaIngreso) : existente.fechaIngreso,
                    data.telefono      ?? existente.telefono,
                    segundoTelefono,
                    data.estadoCivil   ?? existente.estadoCivil,
                    data.ministerio    ?? existente.ministerio,
                    segundoMinisterio,
                    data.urlFotoCedula ?? existente.urlFotoCedula,
                    data.estado        ?? existente.estado,
                    id,
                ]
            );

            const congregado = this.mapRowToCongregado(result.rows[0]);
            await AuditoriaDAO.registrar('congregados', congregado.id, 'edicion', 'Actualización de información del congregado');
            return congregado;
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
            const result = await db.query(
                'UPDATE congregados SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
                [EstadoCongregado.INACTIVO, id]
            );
            if (result.rows.length > 0) {
              await AuditoriaDAO.registrar('congregados', id, 'eliminacion', 'Desactivación del congregado (Inactivo)');
              return true;
            }
            return false;
        } catch (error) {
            throw new CongregadoDAOError('Error al eliminar el congregado', 'DATABASE_ERROR', error);
        }
    }

    async eliminarPermanente(id: number): Promise<boolean> {
        try {
            const result = await db.query(
                'DELETE FROM congregados WHERE id = $1 RETURNING id',
                [id]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new CongregadoDAOError('Error al eliminar permanentemente el congregado', 'DATABASE_ERROR', error);
        }
    }

    async listarTodos(): Promise<Congregado[]> {
        try {
            const result = await db.query(
                'SELECT * FROM congregados ORDER BY nombre ASC'
            );
            return result.rows.map((row: any) => this.mapRowToCongregado(row));
        } catch (error) {
            throw new CongregadoDAOError('Error al listar todos los congregados', 'DATABASE_ERROR', error);
        }
    }

    async buscarPorNombre(nombre: string, limit: number = 10): Promise<Congregado[]> {
        try {
            const result = await db.query(
                `SELECT * FROM congregados
                 WHERE nombre ILIKE $1 AND estado = $2
                 ORDER BY nombre ASC
                 LIMIT $3`,
                [`%${nombre}%`, EstadoCongregado.ACTIVO, limit]
            );
            return result.rows.map((row: any) => this.mapRowToCongregado(row));
        } catch (error) {
            throw new CongregadoDAOError('Error al buscar congregados por nombre', 'DATABASE_ERROR', error);
        }
    }

    async obtenerEstadisticas(): Promise<{ total: number; activos: number; inactivos: number }> {
        try {
            const result = await db.query(
                `SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE estado = $1) as activos,
                    COUNT(*) FILTER (WHERE estado = $2) as inactivos
                 FROM congregados`,
                [EstadoCongregado.ACTIVO, EstadoCongregado.INACTIVO]
            );
            return {
                total:     parseInt(result.rows[0].total,    10),
                activos:   parseInt(result.rows[0].activos,  10),
                inactivos: parseInt(result.rows[0].inactivos, 10),
            };
        } catch (error) {
            throw new CongregadoDAOError('Error al obtener estadísticas', 'DATABASE_ERROR', error);
        }
    }
}