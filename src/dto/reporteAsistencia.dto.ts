
import { EstadoAsistencia } from '@/models/ReporteAsistencia';

/**
 * DTO para crear un nuevo reporte de asistencia
 */
export interface CrearReporteAsistenciaDTO {
  asociadoId: number;
  eventoId: number;
  fecha: string; // formato: YYYY-MM-DD
  estado: string; // 'presente' | 'ausente' | 'justificado' | 'tardanza'
  horaRegistro?: string; // formato: HH:MM:SS
  observaciones?: string;
  justificacion?: string;
}

/**
 * DTO para actualizar un reporte de asistencia
 */
export interface ActualizarReporteAsistenciaDTO {
  estado?: string;
  horaRegistro?: string;
  observaciones?: string;
  justificacion?: string;
}

/**
 * DTO de respuesta básica de un reporte de asistencia
 */
export interface ReporteAsistenciaResponseDTO {
  id: number;
  asociadoId: number;
  eventoId: number;
  fecha: string;
  estado: string;
  horaRegistro: string;
  observaciones?: string;
  justificacion?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO de respuesta detallada con información de asociado y evento
 */
export interface ReporteAsistenciaDetalladoDTO {
  id: number;
  asociadoId: number;
  asociadoNombre: string;
  asociadoCedula: string;
  asociadoMinisterio?: string;
  eventoId: number;
  eventoNombre: string;
  eventoTipo: string;
  fecha: string;
  estado: string;
  horaRegistro: string;
  observaciones?: string;
  justificacion?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para estadísticas de asistencia
 */
export interface EstadisticasAsistenciaDTO {
  totalEventos: number;
  totalPresentes: number;
  totalAusentes: number;
  totalJustificados: number;
  totalTardanzas: number;
  porcentajeAsistencia: number;
}

/**
 * DTO para filtros de búsqueda
 */
export interface FiltrosReporteDTO {
  asociadoId?: number;
  eventoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  ministerio?: string;
}

/**
 * DTO para respuesta paginada
 */
export interface ReporteAsistenciaPaginadoDTO {
  reportes: ReporteAsistenciaDetalladoDTO[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/**
 * DTO para registro masivo de asistencia
 */
export interface RegistroMasivoAsistenciaDTO {
  eventoId: number;
  asistencias: Array<{
    asociadoId: number;
    estado: string;
    horaRegistro?: string;
    observaciones?: string;
  }>;
}

/**
 * DTO para respuesta de registro masivo
 */
export interface ResultadoRegistroMasivoDTO {
  exitosos: number;
  fallidos: number;
  errores: string[];
}

/**
 * DTO para crear un reporte de asistencia
 */
export interface CrearReporteAsistenciaRequest {
  asociadoId: number;
  eventoId: number;
  fecha?: string; // ISO string format
  estado: EstadoAsistencia;
  horaRegistro?: string; // HH:MM:SS format
  observaciones?: string;
  justificacion?: string;
}

/**
 * DTO para actualizar un reporte de asistencia
 */
export interface ActualizarReporteAsistenciaRequest {
  estado?: EstadoAsistencia;
  horaRegistro?: string;
  observaciones?: string;
  justificacion?: string;
}

/**
 * DTO para filtros de búsqueda
 */
export interface FiltrosReporteAsistenciaRequest {
  asociadoId?: number;
  eventoId?: number;
  fechaInicio?: string; // ISO string format
  fechaFin?: string; // ISO string format
  estado?: EstadoAsistencia;
  ministerio?: string;
  nombreAsociado?: string;
  cedulaAsociado?: string;
}

/**
 * DTO para respuesta de reporte
 */
export interface ReporteAsistenciaResponse {
  id: number;
  asociadoId: number;
  asociadoNombre: string;
  asociadoCedula: string;
  asociadoTelefono?: string;
  asociadoMinisterio?: string;
  eventoId: number;
  eventoNombre: string;
  eventoDescripcion?: string;
  eventoFecha: string;
  eventoHora: string;
  fecha: string;
  estado: EstadoAsistencia;
  horaRegistro: string;
  observaciones?: string;
  justificacion?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para respuesta de estadísticas
 */
export interface EstadisticasAsistenciaResponse {
  totalEventos: number;
  totalPresentes: number;
  totalAusentes: number;
  totalJustificados: number;
  totalTardanzas: number;
  porcentajeAsistencia: number;
}
