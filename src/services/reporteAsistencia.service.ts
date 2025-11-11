import { ReporteAsistenciaDAO, ReporteAsistenciaDAOError } from '@/dao/reporteAsistencia.dao';
import { CrearReporteAsistenciaRequest, ReporteAsistenciaResponse } from '@/dto/reporteAsistencia.dto';
import { ReporteAsistencia } from '@/models/ReporteAsistencia';

/**
 * Clase de error personalizada para errores del servicio de ReporteAsistencia
 */
export class ReporteAsistenciaServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ReporteAsistenciaServiceError';
  }
}

/**
 * Servicio para la lógica de negocio de ReporteAsistencia
 */
export class ReporteAsistenciaService {
  private dao: ReporteAsistenciaDAO;

  constructor() {
    this.dao = new ReporteAsistenciaDAO();
  }

  /**
   * Valida los datos de entrada para crear un reporte de asistencia
   */
  private validarDatosCreacion(data: CrearReporteAsistenciaRequest): void {
    if (!data.asociado_id || data.asociado_id <= 0) {
      throw new ReporteAsistenciaServiceError(
        'El ID del asociado es requerido y debe ser mayor a 0',
        'VALIDATION_ERROR'
      );
    }

    if (!data.evento_id || data.evento_id <= 0) {
      throw new ReporteAsistenciaServiceError(
        'El ID del evento es requerido y debe ser mayor a 0',
        'VALIDATION_ERROR'
      );
    }

    if (!data.fecha) {
      throw new ReporteAsistenciaServiceError(
        'La fecha es requerida',
        'VALIDATION_ERROR'
      );
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(data.fecha)) {
      throw new ReporteAsistenciaServiceError(
        'La fecha debe estar en formato YYYY-MM-DD',
        'VALIDATION_ERROR'
      );
    }

    if (!data.estado || !['presente', 'ausente', 'justificado'].includes(data.estado)) {
      throw new ReporteAsistenciaServiceError(
        'El estado debe ser: presente, ausente o justificado',
        'VALIDATION_ERROR'
      );
    }

    // Si el estado es justificado, debe haber una justificación
    if (data.estado === 'justificado' && !data.justificacion) {
      throw new ReporteAsistenciaServiceError(
        'La justificación es requerida cuando el estado es "justificado"',
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Mapea un objeto ReporteAsistencia a ReporteAsistenciaResponse
   */
  private mapToResponse(reporte: ReporteAsistencia): ReporteAsistenciaResponse {
    return {
      id: reporte.id,
      asociado_id: reporte.asociado_id,
      evento_id: reporte.evento_id,
      fecha: reporte.fecha,
      estado: reporte.estado,
      hora_registro: reporte.hora_registro,
      justificacion: reporte.justificacion,
    };
  }

  /**
   * Crea un nuevo registro de asistencia
   */
  async crearRegistro(data: CrearReporteAsistenciaRequest): Promise<ReporteAsistenciaResponse> {
    try {
      // Validar datos de entrada
      this.validarDatosCreacion(data);

      // Crear el registro en la base de datos
      const reporte = await this.dao.crear(data);

      return this.mapToResponse(reporte);
    } catch (error) {
      if (error instanceof ReporteAsistenciaServiceError) {
        throw error;
      }

      if (error instanceof ReporteAsistenciaDAOError) {
        if (error.code === 'FOREIGN_KEY_VIOLATION') {
          throw new ReporteAsistenciaServiceError(
            'El asociado o evento especificado no existe',
            'NOT_FOUND',
            error
          );
        }
        if (error.code === 'DUPLICATE_KEY') {
          throw new ReporteAsistenciaServiceError(
            'Ya existe un registro de asistencia para este asociado en este evento',
            'DUPLICATE_ENTRY',
            error
          );
        }
        throw new ReporteAsistenciaServiceError(
          'Error al crear el registro de asistencia',
          'DATABASE_ERROR',
          error
        );
      }

      throw new ReporteAsistenciaServiceError(
        'Error inesperado al crear el registro de asistencia',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene todos los registros de asistencia para un evento específico
   */
  async obtenerRegistrosPorEvento(eventoId: number): Promise<ReporteAsistenciaResponse[]> {
    try {
      if (!eventoId || eventoId <= 0) {
        throw new ReporteAsistenciaServiceError(
          'El ID del evento es requerido y debe ser mayor a 0',
          'VALIDATION_ERROR'
        );
      }

      const reportes = await this.dao.obtenerPorEventoId(eventoId);

      return reportes.map(reporte => this.mapToResponse(reporte));
    } catch (error) {
      if (error instanceof ReporteAsistenciaServiceError) {
        throw error;
      }

      if (error instanceof ReporteAsistenciaDAOError) {
        throw new ReporteAsistenciaServiceError(
          'Error al obtener los registros de asistencia',
          'DATABASE_ERROR',
          error
        );
      }

      throw new ReporteAsistenciaServiceError(
        'Error inesperado al obtener los registros de asistencia',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Actualiza el estado de un registro de asistencia existente
   */
  async actualizarRegistro(
    id: number,
    data: { estado: string; justificacion?: string }
  ): Promise<ReporteAsistencia> {
    try {
      // Validar el estado
      const estadoLower = data.estado.toLowerCase();
      if (!['presente', 'ausente', 'justificado'].includes(estadoLower)) {
        throw new ReporteAsistenciaServiceError(
          'Estado inválido. Debe ser: presente, ausente o justificado',
          'VALIDATION_ERROR'
        );
      }

      // Si el estado es 'justificado', la justificación es obligatoria
      if (estadoLower === 'justificado' && !data.justificacion?.trim()) {
        throw new ReporteAsistenciaServiceError(
          'La justificación es obligatoria cuando el estado es "justificado"',
          'VALIDATION_ERROR'
        );
      }

      // Verificar que el registro existe
      const registroExistente = await this.dao.obtenerPorId(id);
      if (!registroExistente) {
        throw new ReporteAsistenciaServiceError(
          'Registro de asistencia no encontrado',
          'NOT_FOUND'
        );
      }

      // Actualizar el registro
      const registroActualizado = await this.dao.actualizar(
        id,
        estadoLower as 'presente' | 'ausente' | 'justificado',
        data.justificacion
      );

      return registroActualizado;
    } catch (error: any) {
      if (error instanceof ReporteAsistenciaServiceError) {
        throw error;
      }

      if (error instanceof ReporteAsistenciaDAOError) {
        throw new ReporteAsistenciaServiceError(
          error.message,
          error.code,
          error.originalError
        );
      }

      throw new ReporteAsistenciaServiceError(
        'Error al actualizar el registro de asistencia',
        'UNKNOWN_ERROR',
        error
      );
    }
  }
}
