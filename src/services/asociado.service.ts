import {
  CrearAsociadoRequest,
  ActualizarAsociadoRequest,
  AsociadoResponse,
  AsociadoResponseWithMessage,
  ListarAsociadosResponse,
  FiltrosAsociadoRequest
} from '@/dto/asociado.dto';
import { AsociadoValidator } from '@/validators/asociado.validator';

/**
 * Clase de error personalizada para errores del servicio
 */
export class AsociadoServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'AsociadoServiceError';
  }
}

/**
 * Servicio para manejar operaciones CRUD de asociados
 */
export class AsociadoService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/asociados') {
    this.baseUrl = baseUrl;
  }

  /**
   * Crea un nuevo asociado
   */
  async crear(data: CrearAsociadoRequest): Promise<AsociadoResponse> {
    try {
      // Sanitizar datos
      const sanitizedData = AsociadoValidator.sanitizarDatos(data);

      // Validar datos
      const validation = AsociadoValidator.validarCrearAsociado(sanitizedData);
      if (!validation.valid) {
        throw new AsociadoServiceError(
          'Datos de asociado inválidos',
          400,
          validation.errors
        );
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AsociadoServiceError(
          errorData.message || 'Error al crear el asociado',
          response.status,
          errorData.errors
        );
      }

      const result: AsociadoResponseWithMessage = await response.json();
      
      if (!result.success || !result.data) {
        throw new AsociadoServiceError(
          result.message || 'Error al crear el asociado',
          500
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error de conexión al crear el asociado',
        500
      );
    }
  }

  /**
   * Obtiene un asociado por ID
   */
  async obtenerPorId(id: number): Promise<AsociadoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AsociadoServiceError(
          errorData.message || 'Error al obtener el asociado',
          response.status
        );
      }

      const result: AsociadoResponseWithMessage = await response.json();
      
      if (!result.success || !result.data) {
        throw new AsociadoServiceError(
          result.message || 'Asociado no encontrado',
          404
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error de conexión al obtener el asociado',
        500
      );
    }
  }

  /**
   * Actualiza un asociado existente
   */
  async actualizar(id: number, data: ActualizarAsociadoRequest): Promise<AsociadoResponse> {
    try {
      // Sanitizar datos
      const sanitizedData = AsociadoValidator.sanitizarDatos(data);

      // Validar datos
      const validation = AsociadoValidator.validarActualizarAsociado(sanitizedData);
      if (!validation.valid) {
        throw new AsociadoServiceError(
          'Datos de asociado inválidos',
          400,
          validation.errors
        );
      }

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AsociadoServiceError(
          errorData.message || 'Error al actualizar el asociado',
          response.status,
          errorData.errors
        );
      }

      const result: AsociadoResponseWithMessage = await response.json();
      
      if (!result.success || !result.data) {
        throw new AsociadoServiceError(
          result.message || 'Error al actualizar el asociado',
          500
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error de conexión al actualizar el asociado',
        500
      );
    }
  }

  /**
   * Elimina un asociado (soft delete - cambia estado a inactivo)
   */
  async eliminar(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AsociadoServiceError(
          errorData.message || 'Error al eliminar el asociado',
          response.status
        );
      }

      const result: AsociadoResponseWithMessage = await response.json();
      
      if (!result.success) {
        throw new AsociadoServiceError(
          result.message || 'Error al eliminar el asociado',
          500
        );
      }
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error de conexión al eliminar el asociado',
        500
      );
    }
  }

  /**
   * Lista todos los asociados con filtros y paginación
   */
  async listar(filtros?: FiltrosAsociadoRequest): Promise<ListarAsociadosResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();
        
      if (filtros) {
        if (filtros.nombreCompleto) params.append('nombreCompleto', filtros.nombreCompleto);
        if (filtros.cedula) params.append('cedula', filtros.cedula);
        if (filtros.ministerio) params.append('ministerio', filtros.ministerio);
        if (filtros.estado !== undefined) params.append('estado', filtros.estado.toString());
        if (filtros.fechaIngresoDesde) params.append('fechaIngresoDesde', filtros.fechaIngresoDesde);
        if (filtros.fechaIngresoHasta) params.append('fechaIngresoHasta', filtros.fechaIngresoHasta);
        if (filtros.page) params.append('page', filtros.page.toString());
        if (filtros.limit) params.append('limit', filtros.limit.toString());
      }

      const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AsociadoServiceError(
          errorData.message || 'Error al listar los asociados',
          response.status
        );
      }

      const result: ListarAsociadosResponse = await response.json();
      
      if (!result.success) {
        throw new AsociadoServiceError(
          'Error al listar los asociados',
          500
        );
      }

      return result;
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error de conexión al listar los asociados',
        500
      );
    }
  }

  /**
   * Busca asociados por cédula
   */
  async buscarPorCedula(cedula: string): Promise<AsociadoResponse[]> {
    try {
      const result = await this.listar({ cedula, limit: 100 });
      return result.data;
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error al buscar asociado por cédula',
        500
      );
    }
  }

  /**
   * Busca asociados por nombre
   */
  async buscarPorNombre(nombreCompleto: string): Promise<AsociadoResponse[]> {
    try {
      const result = await this.listar({ nombreCompleto, limit: 100 });
      return result.data;
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error al buscar asociado por nombre',
        500
      );
    }
  }

  /**
   * Obtiene asociados activos
   */
  async obtenerActivos(page: number = 1, limit: number = 10): Promise<ListarAsociadosResponse> {
    try {
      return await this.listar({ estado: 1, page, limit });
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error al obtener asociados activos',
        500
      );
    }
  }

  /**
   * Obtiene asociados inactivos
   */
  async obtenerInactivos(page: number = 1, limit: number = 10): Promise<ListarAsociadosResponse> {
    try {
      return await this.listar({ estado: 0, page, limit });
    } catch (error) {
      if (error instanceof AsociadoServiceError) {
        throw error;
      }
      throw new AsociadoServiceError(
        'Error al obtener asociados inactivos',
        500
      );
    }
  }
}

// Exportar una instancia singleton del servicio
export const asociadoService = new AsociadoService();