import {
    CrearCongregadoRequest,
    ActualizarCongregadoRequest,
    CongregadoResponse,
    ListarCongregadosResponse,
    FiltrosCongregadoRequest,
    AllCongregadosResponse
} from '@/dto/congregado.dto';
import { CongregadoValidator } from '@/validators/congregado.validator';
import { CongregadoDAO, CongregadoDAOError } from '@/dao/congregado.dao';
import { Congregado, EstadoCongregado } from '@/models/Congregado';

export class CongregadoServiceError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public errors?: string[]
    ) {
        super(message);
        this.name = 'CongregadoServiceError';
    }
}

export class CongregadoService {
    private congregadoDAO: CongregadoDAO;

    constructor() {
        this.congregadoDAO = new CongregadoDAO();
    }

    /**
     * Convierte un modelo Congregado al DTO de respuesta
     */
    private toResponse(congregado: Congregado): CongregadoResponse {
        return {
            id: congregado.id,
            nombre: congregado.nombre,
            cedula: congregado.cedula,
            fechaIngreso: congregado.fechaIngreso instanceof Date
                ? congregado.fechaIngreso.toISOString()
                : congregado.fechaIngreso,
            telefono: congregado.telefono,
            segundoTelefono: congregado.segundoTelefono,
            estadoCivil: congregado.estadoCivil,
            ministerio: congregado.ministerio,
            segundoMinisterio: congregado.segundoMinisterio,
            urlFotoCedula: congregado.urlFotoCedula,
            estado: congregado.estado,
            observaciones: congregado.observaciones,
            fechaNacimiento: congregado.fechaNacimiento instanceof Date
                ? congregado.fechaNacimiento.toISOString()
                : congregado.fechaNacimiento,
            correo: congregado.correo,
            profesion: congregado.profesion,
            direccion: congregado.direccion,
            createdAt: congregado.createdAt instanceof Date
                ? congregado.createdAt.toISOString()
                : congregado.createdAt,
            updatedAt: congregado.updatedAt instanceof Date
                ? congregado.updatedAt.toISOString()
                : congregado.updatedAt,
        };
    }

    /**
     * Relanza errores del DAO como errores del service con código HTTP apropiado
     */
    private handleDAOError(error: unknown): never {
        if (error instanceof CongregadoDAOError) {
            switch (error.code) {
                case 'DUPLICATE_KEY':
                    throw new CongregadoServiceError('Ya existe un congregado con esta cédula', 409);
                case 'NOT_FOUND':
                    throw new CongregadoServiceError('Congregado no encontrado', 404);
                case 'UPDATE_FAILED':
                case 'CREATE_FAILED':
                    throw new CongregadoServiceError('La operación no se pudo completar', 400);
                default:
                    throw new CongregadoServiceError(error.message, 500);
            }
        }
        throw new CongregadoServiceError('Error interno del servidor', 500);
    }

    async crear(data: CrearCongregadoRequest): Promise<CongregadoResponse> {
        const sanitized = CongregadoValidator.sanitizarDatos(data);
        const validation = CongregadoValidator.validarCrear(sanitized);

        if (!validation.valid) {
            throw new CongregadoServiceError('Datos de congregado inválidos', 400, validation.errors);
        }

        // Verificación proactiva de duplicado por cédula
        const existente = await this.congregadoDAO.obtenerPorCedula(sanitized.cedula);
        if (existente) {
            throw new CongregadoServiceError('Ya existe un congregado con esta cédula', 409);
        }

        try {
            const congregado = await this.congregadoDAO.crear(sanitized);
            return this.toResponse(congregado);
        } catch (error) {
            return this.handleDAOError(error);
        }
    }

    async obtenerPorId(id: number): Promise<CongregadoResponse> {
        try {
            const congregado = await this.congregadoDAO.obtenerPorId(id);
            if (!congregado) {
                throw new CongregadoServiceError('Congregado no encontrado', 404);
            }
            return this.toResponse(congregado);
        } catch (error) {
            if (error instanceof CongregadoServiceError) throw error;
            return this.handleDAOError(error);
        }
    }

    async actualizar(id: number, data: ActualizarCongregadoRequest): Promise<CongregadoResponse> {
        const sanitized = CongregadoValidator.sanitizarDatos(data);
        const validation = CongregadoValidator.validarActualizar(sanitized);

        if (!validation.valid) {
            throw new CongregadoServiceError('Datos de actualización inválidos', 400, validation.errors);
        }

        // Si se está intentando cambiar la cédula, validar que la nueva no pertenezca a OTRO usuario
        if (sanitized.cedula) {
            const asociadaConCedula = await this.congregadoDAO.obtenerPorCedula(sanitized.cedula);
            if (asociadaConCedula && asociadaConCedula.id !== id) {
                throw new CongregadoServiceError('La cédula proporcionada ya está registrada con otro congregado', 409);
            }
        }

        try {
            const congregado = await this.congregadoDAO.actualizar(id, sanitized);
            return this.toResponse(congregado);
        } catch (error) {
            if (error instanceof CongregadoServiceError) throw error;
            return this.handleDAOError(error);
        }
    }

    async eliminar(id: number): Promise<void> {
        try {
            const ok = await this.congregadoDAO.eliminar(id);
            if (!ok) {
                throw new CongregadoServiceError('Congregado no encontrado', 404);
            }
        } catch (error) {
            if (error instanceof CongregadoServiceError) throw error;
            return this.handleDAOError(error);
        }
    }

    async eliminarPermanente(id: number): Promise<void> {
        try {
            const ok = await this.congregadoDAO.eliminarPermanente(id);
            if (!ok) {
                throw new CongregadoServiceError('Congregado no encontrado', 404);
            }
        } catch (error) {
            if (error instanceof CongregadoServiceError) throw error;
            return this.handleDAOError(error);
        }
    }

    async listar(filtros?: FiltrosCongregadoRequest): Promise<ListarCongregadosResponse> {
        try {
            const page = filtros?.page ?? 1;
            const limit = filtros?.limit ?? 10;
            const estado = filtros?.estado;

            const resultado = await this.congregadoDAO.obtenerTodos(page, limit, estado, {
                nombre: filtros?.nombre,
                cedula: filtros?.cedula,
                estadoCivil: filtros?.estadoCivil,
                ministerio: filtros?.ministerio,
                fechaIngresoDesde: filtros?.fechaIngresoDesde,
                fechaIngresoHasta: filtros?.fechaIngresoHasta,
            });

            return {
                success: true,
                data: resultado.data.map(c => this.toResponse(c)),
                pagination: {
                    page: resultado.page,
                    limit: resultado.limit,
                    total: resultado.total,
                    totalPages: resultado.totalPages,
                },
            };
        } catch (error) {
            if (error instanceof CongregadoServiceError) throw error;
            return this.handleDAOError(error);
        }
    }

    async obtenerTodos(): Promise<AllCongregadosResponse> {
        try {
            const congregados = await this.congregadoDAO.listarTodos();
            return {
                success: true,
                data: congregados.map(c => this.toResponse(c)),
                message: `Se encontraron ${congregados.length} congregados.`,
            };
        } catch (error) {
            if (error instanceof CongregadoServiceError) throw error;
            return this.handleDAOError(error);
        }
    }

    async buscarPorCedula(cedula: string): Promise<CongregadoResponse | null> {
        try {
            const congregado = await this.congregadoDAO.obtenerPorCedula(cedula);
            return congregado ? this.toResponse(congregado) : null;
        } catch (error) {
            return this.handleDAOError(error);
        }
    }

    async buscarPorNombre(nombre: string, limit: number = 10): Promise<CongregadoResponse[]> {
        try {
            const congregados = await this.congregadoDAO.buscarPorNombre(nombre, limit);
            return congregados.map(c => this.toResponse(c));
        } catch (error) {
            return this.handleDAOError(error);
        }
    }

    async obtenerActivos(page = 1, limit = 10): Promise<ListarCongregadosResponse> {
        return this.listar({ estado: EstadoCongregado.ACTIVO, page, limit });
    }

    async obtenerInactivos(page = 1, limit = 10): Promise<ListarCongregadosResponse> {
        return this.listar({ estado: EstadoCongregado.INACTIVO, page, limit });
    }
}
