/**
 * DTO para crear un nuevo evento
 */
export interface CrearEventoRequest {
  nombre: string;
  descripcion?: string;
  fecha: string; // Formato YYYY-MM-DD
  hora: string; // Formato HH:MM:SS
  activo?: boolean;
}

/**
 * DTO para actualizar un evento existente
 */
export interface ActualizarEventoRequest {
  nombre?: string;
  descripcion?: string;
  fecha?: string; // Formato YYYY-MM-DD
  hora?: string; // Formato HH:MM:SS
  activo?: boolean;
}

/**
 * DTO para la respuesta del servidor
 */
export interface EventoResponse {
  id: number;
  nombre: string;
  descripcion?: string | null;
  fecha: string;
  hora: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para respuesta con mensaje
 */
export interface EventoResponseWithMessage {
  success: boolean;
  message: string;
  data?: EventoResponse;
}

/**
 * DTO para listado de eventos con paginación
 */
export interface ListarEventosResponse {
  success: boolean;
  data: EventoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * DTO para filtros de búsqueda
 */
export interface FiltrosEventoRequest {
  nombre?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}