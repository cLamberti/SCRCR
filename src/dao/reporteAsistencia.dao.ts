
import { Pool, PoolClient } from 'pg';
import { 
  ReporteAsistencia, 
  EstadoAsistencia,
  ReporteAsistenciaConAsociado 
} from '@/models/ReporteAsistencia';

/**
 * Interfaz para filtros de búsqueda
 */
export interface FiltrosReporteAsistencia {
  asociadoId?: number;
  eventoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: EstadoAsistencia;
  ministerio?: string;
  nombreAsociado?: string;
  cedulaAsociado?: string;
  pagina?: number;
  porPagina?: number;
}

/**
 * Interfaz para datos de creación
 */
export interface CrearReporteAsistenciaData {
  asociadoId: number;
  eventoId: number;
  fecha?: string;
  estado: EstadoAsistencia;
  horaRegistro?: string;
  observaciones?: string;
  justificacion?: string;
}

/**
 * Interfaz para datos de actualización
 */
export interface ActualizarReporteAsistenciaData {
  estado?: EstadoAsistencia;
  horaRegistro?: string;
  observaciones?: string;
  justificacion?: string;
}

/**
 * Interfaz para registro masivo
 */
export interface RegistroMasivoData {
  eventoId: number;
  asistencias: Array<{
    asociadoId: number;
    estado: EstadoAsistencia;
    horaRegistro?: string;
    observaciones?: string;
  }>;
}

/**
 * DAO para operaciones de base de datos de reportes de asistencia
 */
export class ReporteAsistenciaDAO {
  constructor(private pool: Pool) {}

  /**
   * Crear un nuevo reporte de asistencia
   */
  async crear(data: CrearReporteAsistenciaData, client?: PoolClient): Promise<ReporteAsistencia> {
    const useClient = client || this.pool;
    
    const query = `
      INSERT INTO reportes_asistencia (
        asociado_id,
        evento_id,
        fecha,
        estado,
        hora_registro,
        observaciones,
        justificacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        asociado_id as "asociadoId",
        evento_id as "eventoId",
        fecha,
        estado,
        hora_registro as "horaRegistro",
        observaciones,
        justificacion,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      data.asociadoId,
      data.eventoId,
      data.fecha || new Date().toISOString().split('T')[0],
      data.estado,
      data.horaRegistro || new Date().toTimeString().split(' ')[0],
      data.observaciones || null,
      data.justificacion || null
    ];

    const result = await useClient.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtener un reporte por ID
   */
  async obtenerPorId(id: number): Promise<ReporteAsistencia | null> {
    const query = `
      SELECT 
        id,
        asociado_id as "asociadoId",
        evento_id as "eventoId",
        fecha,
        estado,
        hora_registro as "horaRegistro",
        observaciones,
        justificacion,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM reportes_asistencia
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener reporte con información del asociado
   */
  async obtenerConAsociado(id: number): Promise<ReporteAsistenciaConAsociado | null> {
    const query = `
      SELECT 
        ra.id,
        ra.asociado_id as "asociadoId",
        ra.evento_id as "eventoId",
        ra.fecha,
        ra.estado,
        ra.hora_registro as "horaRegistro",
        ra.observaciones,
        ra.justificacion,
        ra.created_at as "createdAt",
        ra.updated_at as "updatedAt",
        a.nombre_completo as "nombreAsociado",
        a.cedula as "cedulaAsociado",
        a.ministerio as "ministerioAsociado"
      FROM reportes_asistencia ra
      INNER JOIN asociados a ON ra.asociado_id = a.id
      WHERE ra.id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Buscar reportes con filtros
   */
  async buscar(filtros: FiltrosReporteAsistencia): Promise<{
    reportes: ReporteAsistenciaConAsociado[];
    total: number;
    pagina: number;
    porPagina: number;
    totalPaginas: number;
  }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Construir condiciones WHERE
    if (filtros.asociadoId) {
      conditions.push(`ra.asociado_id = ${paramIndex++}`);
      values.push(filtros.asociadoId);
    }

    if (filtros.eventoId) {
      conditions.push(`ra.evento_id = ${paramIndex++}`);
      values.push(filtros.eventoId);
    }

    if (filtros.fechaInicio) {
      conditions.push(`ra.fecha >= ${paramIndex++}`);
      values.push(filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      conditions.push(`ra.fecha <= ${paramIndex++}`);
      values.push(filtros.fechaFin);
    }

    if (filtros.estado) {
      conditions.push(`ra.estado = ${paramIndex++}`);
      values.push(filtros.estado);
    }

    if (filtros.ministerio) {
      conditions.push(`LOWER(a.ministerio) LIKE LOWER(${paramIndex++})`);
      values.push(`%${filtros.ministerio}%`);
    }

    if (filtros.nombreAsociado) {
      conditions.push(`LOWER(a.nombre_completo) LIKE LOWER(${paramIndex++})`);
      values.push(`%${filtros.nombreAsociado}%`);
    }

    if (filtros.cedulaAsociado) {
      conditions.push(`a.cedula LIKE ${paramIndex++}`);
      values.push(`%${filtros.cedulaAsociado}%`);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reportes_asistencia ra
      INNER JOIN asociados a ON ra.asociado_id = a.id
      ${whereClause}
    `;

    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Paginación
    const pagina = filtros.pagina || 1;
    const porPagina = filtros.porPagina || 50;
    const offset = (pagina - 1) * porPagina;

    // Consulta principal
    const query = `
      SELECT 
        ra.id,
        ra.asociado_id as "asociadoId",
        ra.evento_id as "eventoId",
        ra.fecha,
        ra.estado,
        ra.hora_registro as "horaRegistro",
        ra.observaciones,
        ra.justificacion,
        ra.created_at as "createdAt",
        ra.updated_at as "updatedAt",
        a.nombre_completo as "nombreAsociado",
        a.cedula as "cedulaAsociado",
        a.ministerio as "ministerioAsociado"
      FROM reportes_asistencia ra
      INNER JOIN asociados a ON ra.asociado_id = a.id
      ${whereClause}
      ORDER BY ra.fecha DESC, ra.hora_registro DESC
      LIMIT ${paramIndex++} OFFSET ${paramIndex++}
    `;

    values.push(porPagina, offset);

    const result = await this.pool.query(query, values);

    return {
      reportes: result.rows,
      total,
      pagina,
      porPagina,
      totalPaginas: Math.ceil(total / porPagina)
    };
  }

  /**
   * Actualizar un reporte de asistencia
   */
  async actualizar(
    id: number, 
    data: ActualizarReporteAsistenciaData
  ): Promise<ReporteAsistencia | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.estado !== undefined) {
      fields.push(`estado = ${paramIndex++}`);
      values.push(data.estado);
    }

    if (data.horaRegistro !== undefined) {
      fields.push(`hora_registro = ${paramIndex++}`);
      values.push(data.horaRegistro);
    }

    if (data.observaciones !== undefined) {
      fields.push(`observaciones = ${paramIndex++}`);
      values.push(data.observaciones);
    }

    if (data.justificacion !== undefined) {
      fields.push(`justificacion = ${paramIndex++}`);
      values.push(data.justificacion);
    }

    if (fields.length === 0) {
      return this.obtenerPorId(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE reportes_asistencia
      SET ${fields.join(', ')}
      WHERE id = ${paramIndex}
      RETURNING 
        id,
        asociado_id as "asociadoId",
        evento_id as "eventoId",
        fecha,
        estado,
        hora_registro as "horaRegistro",
        observaciones,
        justificacion,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Eliminar un reporte de asistencia
   */
  async eliminar(id: number): Promise<boolean> {
    const query = 'DELETE FROM reportes_asistencia WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Verificar si existe un reporte para un asociado en un evento
   */
  async existeReporte(asociadoId: number, eventoId: number): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM reportes_asistencia 
        WHERE asociado_id = $1 AND evento_id = $2
      )
    `;
    const result = await this.pool.query(query, [asociadoId, eventoId]);
    return result.rows[0].exists;
  }

  /**
   * Registrar asistencias masivas
   */
  async registrarMasivo(data: RegistroMasivoData, client?: PoolClient): Promise<void> {
    const useClient = client || this.pool;
    
    for (const asistencia of data.asistencias) {
      const query = `
        INSERT INTO reportes_asistencia (
          asociado_id,
          evento_id,
          fecha,
          estado,
          hora_registro,
          observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const values = [
        asistencia.asociadoId,
        data.eventoId,
        new Date().toISOString().split('T')[0],
        asistencia.estado,
        asistencia.horaRegistro || new Date().toTimeString().split(' ')[0],
        asistencia.observaciones || null
      ];

      await useClient.query(query, values);
    }
  }

  /**
   * Obtener reportes por evento
   */
  async obtenerPorEvento(eventoId: number): Promise<ReporteAsistenciaConAsociado[]> {
    const query = `
      SELECT 
        ra.id,
        ra.asociado_id as "asociadoId",
        ra.evento_id as "eventoId",
        ra.fecha,
        ra.estado,
        ra.hora_registro as "horaRegistro",
        ra.observaciones,
        ra.justificacion,
        ra.created_at as "createdAt",
        ra.updated_at as "updatedAt",
        a.nombre_completo as "nombreAsociado",
        a.cedula as "cedulaAsociado",
        a.ministerio as "ministerioAsociado"
      FROM reportes_asistencia ra
      INNER JOIN asociados a ON ra.asociado_id = a.id
      WHERE ra.evento_id = $1
      ORDER BY ra.fecha DESC, ra.hora_registro DESC
    `;

    const result = await this.pool.query(query, [eventoId]);
    return result.rows;
  }

  /**
   * Obtener reportes por asociado
   */
  async obtenerPorAsociado(asociadoId: number): Promise<ReporteAsistenciaConAsociado[]> {
    const query = `
      SELECT 
        ra.id,
        ra.asociado_id as "asociadoId",
        ra.evento_id as "eventoId",
        ra.fecha,
        ra.estado,
        ra.hora_registro as "horaRegistro",
        ra.observaciones,
        ra.justificacion,
        ra.created_at as "createdAt",
        ra.updated_at as "updatedAt",
        a.nombre_completo as "nombreAsociado",
        a.cedula as "cedulaAsociado",
        a.ministerio as "ministerioAsociado"
      FROM reportes_asistencia ra
      INNER JOIN asociados a ON ra.asociado_id = a.id
      WHERE ra.asociado_id = $1
      ORDER BY ra.fecha DESC, ra.hora_registro DESC
    `;

    const result = await this.pool.query(query, [asociadoId]);
    return result.rows;
  }

  /**
   * Obtener estadísticas por evento
   */
  async obtenerEstadisticasPorEvento(eventoId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*)::INTEGER as total_registros,
        COUNT(CASE WHEN estado = 'presente' THEN 1 END)::INTEGER as total_presentes,
        COUNT(CASE WHEN estado = 'ausente' THEN 1 END)::INTEGER as total_ausentes,
        COUNT(CASE WHEN estado = 'justificado' THEN 1 END)::INTEGER as total_justificados,
        COUNT(CASE WHEN estado = 'tardanza' THEN 1 END)::INTEGER as total_tardanzas,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN estado = 'presente' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
          ELSE 0
        END as porcentaje_asistencia
      FROM reportes_asistencia
      WHERE evento_id = $1
    `;

    const result = await this.pool.query(query, [eventoId]);
    return result.rows[0];
  }

  /**
   * Obtener estadísticas por asociado
   */
  async obtenerEstadisticasPorAsociado(asociadoId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*)::INTEGER as total_registros,
        COUNT(CASE WHEN estado = 'presente' THEN 1 END)::INTEGER as total_presentes,
        COUNT(CASE WHEN estado = 'ausente' THEN 1 END)::INTEGER as total_ausentes,
        COUNT(CASE WHEN estado = 'justificado' THEN 1 END)::INTEGER as total_justificados,
        COUNT(CASE WHEN estado = 'tardanza' THEN 1 END)::INTEGER as total_tardanzas,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN estado = 'presente' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
          ELSE 0
        END as porcentaje_asistencia
      FROM reportes_asistencia
      WHERE asociado_id = $1
    `;

    const result = await this.pool.query(query, [asociadoId]);
    return result.rows[0];
  }
}
