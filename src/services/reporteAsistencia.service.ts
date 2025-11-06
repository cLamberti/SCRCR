
import { ReporteAsistenciaDAO, ReporteAsistenciaDAOError } from '@/dao/reporteAsistencia.dao';
import { CrearReporteAsistenciaRequest, crearReporteAsistenciaSchema } from '@/dto/reporteAsistencia.dto';
import { ReporteAsistencia } from '@/models/ReporteAsistencia';
import { ZodError } from 'zod';

/**
 * Clase de error personalizada para el servicio de ReporteAsistencia
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
  private reporteAsistenciaDAO: ReporteAsistenciaDAO;

  constructor() {
    this.reporteAsistenciaDAO = new ReporteAsistenciaDAO();
  }

  /**
   * Crea un nuevo registro de asistencia, validando los datos de entrada
   */
  async crearRegistro(data: CrearReporteAsistenciaRequest): Promise<ReporteAsistencia> {
    try {
      // Preparamos los datos para la validación
      const dataToValidate = {
        ...data,
        // Si la fecha no viene, la generamos en formato YYYY-MM-DD
        fecha: data.fecha || new Date().toISOString().split('T')[0],
      };

      // 1. Validar los datos de entrada con Zod
      const validatedData = crearReporteAsistenciaSchema.parse(dataToValidate);

      // 2. Llamar al DAO para crear el registro
      const nuevoRegistro = await this.reporteAsistenciaDAO.crear(validatedData);
      return nuevoRegistro;

    } catch (error) {
      // Manejar errores de validación de Zod
      if (error instanceof ZodError) {
        throw new ReporteAsistenciaServiceError(
          'Datos de entrada inválidos',
          'VALIDATION_ERROR',
          error.issues
        );
      }
      
      // Manejar errores específicos del DAO
      if (error instanceof ReporteAsistenciaDAOError) {
        throw new ReporteAsistenciaServiceError(
          error.message,
          error.code,
          error.originalError
        );
      }

      // Manejar cualquier otro error inesperado
      throw new ReporteAsistenciaServiceError(
        'Error inesperado en el servicio al crear el registro',
        'INTERNAL_SERVICE_ERROR',
        error
      );
    }
  }

  /**
   * Obtiene todos los registros de asistencia para un evento específico
   */
  async obtenerRegistrosPorEvento(eventoId: number): Promise<ReporteAsistencia[]> {
    try {
      // Validar que el ID del evento sea un número positivo
      if (!eventoId || eventoId <= 0) {
        throw new ReporteAsistenciaServiceError(
          'El ID del evento es inválido',
          'VALIDATION_ERROR'
        );
      }

      // Llamar al DAO para obtener los registros
      const registros = await this.reporteAsistenciaDAO.obtenerPorEventoId(eventoId);
      return registros;

    } catch (error) {
      if (error instanceof ReporteAsistenciaServiceError || error instanceof ReporteAsistenciaDAOError) {
        throw error;
      }

      throw new ReporteAsistenciaServiceError(
        'Error inesperado en el servicio al obtener los registros',
        'INTERNAL_SERVICE_ERROR',
        error
      );
    }
  }
}
