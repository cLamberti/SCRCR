

/**
 * DTO para la solicitud de registro de asistencia
 */
export interface RegistroAsistenciaRequest {
  id_asociado: number;
  id_actividad: number; // Suponiendo una tabla de actividades
  fecha_asistencia: string; // Formato ISO string (YYYY-MM-DD)
}

/**
 * DTO para la respuesta de un registro de asistencia
 */
export interface AsistenciaResponse {
  id: number;
  id_asociado: number;
  id_actividad: number;
  fecha_asistencia: string; // Formato ISO string (YYYY-MM-DD)
  fecha_registro: string; // Timestamp de cuando se registró
}

/**
 * DTO para la respuesta general del servicio
 */
export interface AsistenciaResponseWithMessage {
  success: boolean;
  message: string;
  data?: AsistenciaResponse;
}