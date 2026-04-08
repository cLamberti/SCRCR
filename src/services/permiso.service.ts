import { PermisoDAO, PaginacionResultado } from '@/dao/permiso.dao';
import { Permiso } from '@/models/Permiso';
import { CrearPermisoRequest, AprobarRechazarPermisoRequest, PermisoExtendidoDto } from '@/dto/permiso.dto';

export class PermisoServiceError extends Error {
  constructor(message: string, public code?: string, public originalError?: unknown) {
    super(message);
    this.name = 'PermisoServiceError';
  }
}

export class PermisoService {
  private permisoDAO: PermisoDAO;

  constructor() {
    this.permisoDAO = new PermisoDAO();
  }

  async crearPermiso(usuarioId: number, data: CrearPermisoRequest): Promise<Permiso> {
    try {
      // 1. Verificar traslapes de fechas
      const hayTraslape = await this.permisoDAO.verificarTraslape(usuarioId, data.fechaInicio, data.fechaFin);
      if (hayTraslape) {
        throw new PermisoServiceError('Ya existe un permiso pendiente o aprobado en estas fechas', 'OVERLAP_ERROR');
      }

      // 2. Crear el registro
      return await this.permisoDAO.crear(usuarioId, data);
    } catch (error: any) {
      if (error instanceof PermisoServiceError) {
        throw error;
      }
      throw new PermisoServiceError('Error al crear permiso en el servicio', 'SERVICE_ERROR', error);
    }
  }

  async obtenerPermisos(page: number, limit: number, usuarioId?: number): Promise<PaginacionResultado<PermisoExtendidoDto>> {
    try {
      return await this.permisoDAO.obtenerTodos(page, limit, usuarioId);
    } catch (error: any) {
      throw new PermisoServiceError('Error al obtener lista de permisos', 'SERVICE_ERROR', error);
    }
  }

  async aprobarRechazarPermiso(id: number, data: AprobarRechazarPermisoRequest): Promise<Permiso> {
    try {
      const permisoActual = await this.permisoDAO.obtenerPorId(id);
      if (!permisoActual) {
        throw new PermisoServiceError('Permiso no encontrado', 'NOT_FOUND');
      }

      if (permisoActual.estado !== 'PENDIENTE') {
        throw new PermisoServiceError('No se puede cambiar el estado de un permiso que no está PENDIENTE', 'INVALID_STATUS');
      }

      return await this.permisoDAO.actualizarEstado(id, data.estado, data.observacionesResolucion);
    } catch (error: any) {
      if (error instanceof PermisoServiceError) {
        throw error;
      }
      throw new PermisoServiceError('Error al actualizar estado del permiso', 'SERVICE_ERROR', error);
    }
  }
}
