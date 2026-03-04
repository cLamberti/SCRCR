import {
  CrearAsociadoRequest,
  ActualizarAsociadoRequest,
  AsociadoResponse,
  AsociadoResponseWithMessage,
  ListarAsociadosResponse,
  FiltrosAsociadoRequest,
  AllAsociadosResponse
} from '@/dto/asociado.dto';
import { AsociadoValidator } from '@/validators/asociado.validator';
import { AsociadoDAO, AsociadoDAOError } from '@/dao/asociado.dao';
import { Asociado } from '@/models/Asociado';

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

export class AsociadoService {
  private asociadoDAO: AsociadoDAO;

  constructor() {
    this.asociadoDAO = new AsociadoDAO();
  }

  /* Convierte un modelo Asociado al DTO de respuesta */
  private toResponse(asociado: Asociado): AsociadoResponse {
    return {
      id:             asociado.id,
      nombreCompleto: asociado.nombreCompleto,
      cedula:         asociado.cedula,
      correo:         asociado.correo,
      telefono:       asociado.telefono,
      ministerio:     asociado.ministerio,
      direccion:      asociado.direccion,
      fechaIngreso:   asociado.fechaIngreso instanceof Date
                        ? asociado.fechaIngreso.toISOString()
                        : asociado.fechaIngreso,
      estado:         asociado.estado,
    };
  }

  /* Relanza errores del DAO como errores del service con código HTTP apropiado */
  private handleDAOError(error: unknown): never {
    if (error instanceof AsociadoDAOError) {
      switch (error.code) {
        case 'DUPLICATE_KEY':
          throw new AsociadoServiceError('Ya existe un asociado con esta cédula', 409);
        case 'NOT_FOUND':
          throw new AsociadoServiceError('Asociado no encontrado', 404);
        case 'NO_UPDATES':
          throw new AsociadoServiceError('No hay campos para actualizar', 400);
        default:
          throw new AsociadoServiceError(error.message, 500);
      }
    }
    throw new AsociadoServiceError('Error interno del servidor', 500);
  }

  async crear(data: CrearAsociadoRequest): Promise<AsociadoResponse> {
    const sanitized  = AsociadoValidator.sanitizarDatos(data);
    const validation = AsociadoValidator.validarCrearAsociado(sanitized);

    if (!validation.valid) {
      throw new AsociadoServiceError('Datos de asociado inválidos', 400, validation.errors);
    }

    try {
      const asociado = await this.asociadoDAO.crear(sanitized);
      return this.toResponse(asociado);
    } catch (error) {
      this.handleDAOError(error);
    }
  }

  async obtenerPorId(id: number): Promise<AsociadoResponse> {
    try {
      const asociado = await this.asociadoDAO.obtenerPorId(id);
      if (!asociado) {
        throw new AsociadoServiceError('Asociado no encontrado', 404);
      }
      return this.toResponse(asociado);
    } catch (error) {
      if (error instanceof AsociadoServiceError) throw error;
      this.handleDAOError(error);
    }
  }

  async actualizar(id: number, data: ActualizarAsociadoRequest): Promise<AsociadoResponse> {
    const sanitized  = AsociadoValidator.sanitizarDatos(data);
    const validation = AsociadoValidator.validarActualizarAsociado(sanitized);

    if (!validation.valid) {
      throw new AsociadoServiceError('Datos de asociado inválidos', 400, validation.errors);
    }

    try {
      const asociado = await this.asociadoDAO.actualizar(id, sanitized);
      return this.toResponse(asociado);
    } catch (error) {
      if (error instanceof AsociadoServiceError) throw error;
      this.handleDAOError(error);
    }
  }

  async eliminar(id: number): Promise<void> {
    try {
      const ok = await this.asociadoDAO.eliminar(id);
      if (!ok) {
        throw new AsociadoServiceError('Asociado no encontrado', 404);
      }
    } catch (error) {
      if (error instanceof AsociadoServiceError) throw error;
      this.handleDAOError(error);
    }
  }

  async eliminarPermanente(id: number): Promise<void> {
    try {
      const ok = await this.asociadoDAO.eliminarPermanente(id);
      if (!ok) {
        throw new AsociadoServiceError('Asociado no encontrado', 404);
      }
    } catch (error) {
      if (error instanceof AsociadoServiceError) throw error;
      this.handleDAOError(error);
    }
  }

  async listar(filtros?: FiltrosAsociadoRequest): Promise<ListarAsociadosResponse> {
    try {
      const page   = filtros?.page  ?? 1;
      const limit  = filtros?.limit ?? 10;
      const estado = filtros?.estado;

      const resultado = await this.asociadoDAO.obtenerTodos(page, limit, estado, {
        nombreCompleto:    filtros?.nombreCompleto,
        cedula:            filtros?.cedula,
        ministerio:        filtros?.ministerio,
        fechaIngresoDesde: filtros?.fechaIngresoDesde,
        fechaIngresoHasta: filtros?.fechaIngresoHasta,
      });

      return {
        success: true,
        data:    resultado.data.map(a => this.toResponse(a)),
        pagination: {
          page:       resultado.page,
          limit:      resultado.limit,
          total:      resultado.total,
          totalPages: resultado.totalPages,
        },
      };
    } catch (error) {
      if (error instanceof AsociadoServiceError) throw error;
      this.handleDAOError(error);
    }
  }

  async obtenerTodos(): Promise<AllAsociadosResponse> {
    try {
      const asociados = await this.asociadoDAO.listarTodos();
      return {
        success: true,
        data:    asociados.map(a => this.toResponse(a)),
        message: `Se encontraron ${asociados.length} asociados.`,
      };
    } catch (error) {
      if (error instanceof AsociadoServiceError) throw error;
      this.handleDAOError(error);
    }
  }

  async buscarPorCedula(cedula: string): Promise<AsociadoResponse[]> {
    const resultado = await this.listar({ cedula, limit: 100 });
    return resultado.data;
  }

  async buscarPorNombre(nombreCompleto: string): Promise<AsociadoResponse[]> {
    const resultado = await this.listar({ nombreCompleto, limit: 100 });
    return resultado.data;
  }

  async obtenerActivos(page = 1, limit = 10): Promise<ListarAsociadosResponse> {
    return this.listar({ estado: 1, page, limit });
  }

  async obtenerInactivos(page = 1, limit = 10): Promise<ListarAsociadosResponse> {
    return this.listar({ estado: 0, page, limit });
  }
}

export const asociadoService = new AsociadoService();