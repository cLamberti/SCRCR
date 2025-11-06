
import { z } from 'zod';
import { EstadoAsistencia } from '@/models/ReporteAsistencia';

/**
 * Validador para estados de asistencia
 */
const estadoAsistenciaSchema = z.nativeEnum(EstadoAsistencia, {
  message: 'Estado de asistencia inválido. Debe ser: presente, ausente, justificado o tardanza'
});
/**
 * Validador para formato de hora HH:MM:SS
 */
const horaSchema = z.string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Formato de hora inválido. Debe ser HH:MM:SS (ejemplo: 14:30:00)'
  });

/**
 * Validador para formato de fecha YYYY-MM-DD
 */
const fechaSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD (ejemplo: 2024-01-15)'
  })
  .refine((fecha) => {
    const date = new Date(fecha);
    return !isNaN(date.getTime());
  }, {
    message: 'Fecha inválida'
  });

/**
 * Schema para crear un reporte de asistencia
 */
export const crearReporteAsistenciaSchema = z.object({
  asociadoId: z.number({
    message: 'El ID del asociado es requerido y debe ser un número'
  })
    .int('El ID del asociado debe ser un número entero')
    .positive('El ID del asociado debe ser positivo'),

  eventoId: z.number({
    message: 'El ID del evento es requerido y debe ser un número'
  })
    .int('El ID del evento debe ser un número entero')
    .positive('El ID del evento debe ser positivo'),

  fecha: fechaSchema.optional()
    .default(() => new Date().toISOString().split('T')[0]),

  estado: estadoAsistenciaSchema,

  horaRegistro: horaSchema.optional()
    .default(() => new Date().toTimeString().split(' ')[0]),

  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),

  justificacion: z.string()
    .max(500, 'La justificación no puede exceder 500 caracteres')
    .optional()
}).refine((data) => {
  // Si el estado es justificado, debe haber una justificación
  if (data.estado === EstadoAsistencia.JUSTIFICADO && !data.justificacion) {
    return false;
  }
  return true;
}, {
  message: 'Se requiere una justificación cuando el estado es "justificado"',
  path: ['justificacion']
});

/**
 * Schema para actualizar un reporte de asistencia
 */
export const actualizarReporteAsistenciaSchema = z.object({
  estado: estadoAsistenciaSchema.optional(),

  horaRegistro: horaSchema.optional(),

  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),

  justificacion: z.string()
    .max(500, 'La justificación no puede exceder 500 caracteres')
    .optional()
}).refine((data) => {
  // Si el estado es justificado, debe haber una justificación
  if (data.estado === EstadoAsistencia.JUSTIFICADO && !data.justificacion) {
    return false;
  }
  return true;
}, {
  message: 'Se requiere una justificación cuando el estado es "justificado"',
  path: ['justificacion']
}).refine((data) => {
  // Debe haber al menos un campo para actualizar
  return Object.keys(data).length > 0;
}, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

/**
 * Schema para filtros de búsqueda
 */
export const filtrosReporteAsistenciaSchema = z.object({
  asociadoId: z.number()
    .int('El ID del asociado debe ser un número entero')
    .positive('El ID del asociado debe ser positivo')
    .optional(),

  eventoId: z.number()
    .int('El ID del evento debe ser un número entero')
    .positive('El ID del evento debe ser positivo')
    .optional(),

  fechaInicio: fechaSchema.optional(),

  fechaFin: fechaSchema.optional(),

  estado: estadoAsistenciaSchema.optional(),

  ministerio: z.string()
    .min(1, 'El ministerio no puede estar vacío')
    .max(100, 'El ministerio no puede exceder 100 caracteres')
    .optional(),

  nombreAsociado: z.string()
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),

  cedulaAsociado: z.string()
    .min(1, 'La cédula no puede estar vacía')
    .max(20, 'La cédula no puede exceder 20 caracteres')
    .optional(),

  pagina: z.number()
    .int('La página debe ser un número entero')
    .positive('La página debe ser positiva')
    .optional()
    .default(1),

  porPagina: z.number()
    .int('El tamaño de página debe ser un número entero')
    .positive('El tamaño de página debe ser positivo')
    .max(100, 'El tamaño de página no puede exceder 100')
    .optional()
    .default(50)
}).refine((data) => {
  // Si hay fechaInicio y fechaFin, fechaInicio debe ser menor o igual a fechaFin
  if (data.fechaInicio && data.fechaFin) {
    return new Date(data.fechaInicio) <= new Date(data.fechaFin);
  }
  return true;
}, {
  message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
  path: ['fechaInicio']
});

/**
 * Schema para registro masivo de asistencia
 */
export const registroMasivoAsistenciaSchema = z.object({
  eventoId: z.number({
    message: 'El ID del evento es requerido y debe ser un número'
  })
    .int('El ID del evento debe ser un número entero')
    .positive('El ID del evento debe ser positivo'),

  asistencias: z.array(
    z.object({
      asociadoId: z.number({
        message: 'El ID del asociado es requerido y debe ser un número'
      })
        .int('El ID del asociado debe ser un número entero')
        .positive('El ID del asociado debe ser positivo'),

      estado: estadoAsistenciaSchema,

      horaRegistro: horaSchema.optional(),

      observaciones: z.string()
        .max(500, 'Las observaciones no pueden exceder 500 caracteres')
        .optional()
    })
  )
    .min(1, 'Debe proporcionar al menos una asistencia')
    .max(500, 'No se pueden registrar más de 500 asistencias a la vez')
});

/**
 * Schema para parámetros de ID
 */
export const idParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'El ID debe ser un número')
    .transform(Number)
    .refine((n) => n > 0, 'El ID debe ser positivo')
});

/**
 * Tipos inferidos de los schemas
 */
export type CrearReporteAsistenciaInput = z.infer<typeof crearReporteAsistenciaSchema>;
export type ActualizarReporteAsistenciaInput = z.infer<typeof actualizarReporteAsistenciaSchema>;
export type FiltrosReporteAsistenciaInput = z.infer<typeof filtrosReporteAsistenciaSchema>;
export type RegistroMasivoAsistenciaInput = z.infer<typeof registroMasivoAsistenciaSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;

/**
 * Función helper para validar datos
 */
export function validarCrearReporte(data: unknown) {
  return crearReporteAsistenciaSchema.parse(data);
}

export function validarActualizarReporte(data: unknown) {
  return actualizarReporteAsistenciaSchema.parse(data);
}

export function validarFiltrosReporte(data: unknown) {
  return filtrosReporteAsistenciaSchema.parse(data);
}

export function validarRegistroMasivo(data: unknown) {
  return registroMasivoAsistenciaSchema.parse(data);
}

export function validarIdParam(data: unknown) {
  return idParamSchema.parse(data);
}
