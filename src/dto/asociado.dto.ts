import { EstadoAsociado } from '@/models/Asociado';

/**
 * DTO para crear un nuevo asociado
 */
export interface CrearAsociadoRequest {
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso?: string; // ISO string format
  estado?: EstadoAsociado;
}

/**
 * DTO para actualizar un asociado existente
 */
export interface ActualizarAsociadoRequest {
  nombreCompleto?: string;
  cedula?: string;
  correo?: string;
  telefono?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso?: string; // ISO string format
  estado?: EstadoAsociado;
}

/**
 * DTO para la respuesta del servidor
 */
export interface AsociadoResponse {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: string; // ISO string format
  estado: number;
}

/**
 * DTO para respuesta con mensaje
 */
export interface AsociadoResponseWithMessage {
  success: boolean;
  message: string;
  data?: AsociadoResponse;
}

/**
 * DTO para listado de asociados con paginación
 */
export interface ListarAsociadosResponse {
  success: boolean;
  data: AsociadoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * DTO para la respuesta de un listado SIN paginación de asociados
 */
export interface AllAsociadosResponse {
  success: boolean;
  data: AsociadoResponse[];
  message?: string;
}

/**
 * DTO para filtros de búsqueda
 */
export interface FiltrosAsociadoRequest {
  nombreCompleto?: string;
  cedula?: string;
  ministerio?: string;
  estado?: EstadoAsociado;
  fechaIngresoDesde?: string;
  fechaIngresoHasta?: string;
  page?: number;
  limit?: number;
}

/**
 * DTO para eliminar (delete) un asociado
 */
export interface DeleteAsociadoRequest {
  id: number; // ID del asociado a eliminar
  permanente?: boolean; // Si es true, se elimina definitivamente (hard delete)
}

/**
 * DTO para respuesta de eliminación de asociado
 */
export interface DeleteAsociadoResponse {
  success: boolean;
  message: string;
  id?: number; // ID eliminado (opcional)
  permanente?: boolean; // Indica si fue hard delete
}