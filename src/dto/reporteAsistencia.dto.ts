import { z } from 'zod';
import { EstadoAsistencia } from '@/models/ReporteAsistencia';

/**
 * DTO para la solicitud de creación de un reporte de asistencia.
 */
export interface CrearReporteAsistenciaRequest {
  asociado_id: number;
  evento_id: number;
  fecha: string; // Formato YYYY-MM-DD
  estado: 'presente' | 'ausente' | 'justificado';
  justificacion?: string;
}

export interface ActualizarReporteAsistenciaRequest {
  estado: 'presente' | 'ausente' | 'justificado';
  justificacion?: string;
}

export interface ActualizarReporteAsistenciaResponse {
  success: boolean;
  data?: ReporteAsistenciaResponse;
  message: string;
}
/**
 * Esquema de validación con Zod para la creación de un reporte de asistencia.
 */

export const crearReporteAsistenciaSchema = z.object({
  asociado_id: z.number().int().positive({ message: 'El ID del asociado debe ser un número positivo.' }),
  evento_id: z.number().int().positive({ message: 'El ID del evento debe ser un número positivo.' }),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'El formato de fecha debe ser YYYY-MM-DD.' }),
  estado: z.nativeEnum(EstadoAsistencia, { message: 'El estado de asistencia no es válido. Debe ser Presente, Ausente o Justificado.' }),
  justificacion: z.string().max(255, { message: 'La justificación no puede exceder los 255 caracteres.' }).optional(),
});

/**
 * DTO para la respuesta de un reporte de asistencia.
 */
export interface ReporteAsistenciaResponse {
  id: number;
  asociado_id: number;
  evento_id: number;
  fecha: string; // Formato YYYY-MM-DD
  estado: EstadoAsistencia;
  hora_registro: string; // Formato HH:MM:SS
  justificacion?: string | null;
}

/**
 * DTO para la respuesta general del servicio con un mensaje.
 */
export interface ReporteAsistenciaResponseWithMessage {
  success: boolean;
  message: string;
  data?: ReporteAsistenciaResponse | ReporteAsistenciaResponse[];
}
