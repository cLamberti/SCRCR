import { EstadoCivil, EstadoCongregado } from '@/models/Congregado';

/**
 * DTO para registrar un nuevo congregado
 */
export interface CrearCongregadoRequest {
    nombre: string;
    cedula: string;                 // Requerido, UNIQUE en DB
    fechaIngreso: string;           // ISO string format (YYYY-MM-DD)
    telefono: string;
    segundoTelefono?: string;       // Opcional
    estadoCivil: EstadoCivil;
    ministerio: string;             // String libre, max 50 chars
    segundoMinisterio?: string;     // Opcional, string libre
    urlFotoCedula: string;
    estado?: EstadoCongregado;      // Default: ACTIVO (1)
}

/**
 * DTO para actualizar un congregado existente
 */
export interface ActualizarCongregadoRequest {
    nombre?: string;
    cedula?: string;
    fechaIngreso?: string;          // ISO string format (YYYY-MM-DD)
    telefono?: string;
    segundoTelefono?: string | null;  // null = borrar el segundo teléfono
    estadoCivil?: EstadoCivil;
    ministerio?: string;
    segundoMinisterio?: string | null; // null = borrar el segundo ministerio
    urlFotoCedula?: string;
    estado?: EstadoCongregado;
}

/**
 * DTO para la respuesta del servidor (un solo congregado)
 */
export interface CongregadoResponse {
    id: number;
    nombre: string;
    cedula: string;
    fechaIngreso: string;           // ISO string format
    telefono: string;
    segundoTelefono?: string;
    estadoCivil: EstadoCivil;
    ministerio: string;
    segundoMinisterio?: string;
    urlFotoCedula: string;
    estado: number;
    createdAt: string;              // ISO timestamp
    updatedAt: string;              // ISO timestamp
}

/**
 * DTO para respuesta con mensaje
 */
export interface CongregadoResponseWithMessage {
    success: boolean;
    message: string;
    data?: CongregadoResponse;
}

/**
 * DTO para listado paginado de congregados
 */
export interface ListarCongregadosResponse {
    success: boolean;
    data: CongregadoResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * DTO para listado SIN paginación de congregados
 */
export interface AllCongregadosResponse {
    success: boolean;
    data: CongregadoResponse[];
    message?: string;
}

/**
 * DTO para filtros de búsqueda de congregados
 */
export interface FiltrosCongregadoRequest {
    nombre?: string;
    cedula?: string;
    estadoCivil?: EstadoCivil;
    ministerio?: string;
    estado?: EstadoCongregado;
    fechaIngresoDesde?: string;
    fechaIngresoHasta?: string;
    page?: number;
    limit?: number;
}

/**
 * DTO para eliminar un congregado
 */
export interface DeleteCongregadoRequest {
    id: number;
    permanente?: boolean; // Si es true, hard delete
}

/**
 * DTO para la respuesta de eliminación de un congregado
 */
export interface DeleteCongregadoResponse {
    success: boolean;
    message: string;
    id?: number;
    permanente?: boolean;
}
