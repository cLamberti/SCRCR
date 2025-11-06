
/**
 * Enum para los estados de asistencia
 */
export enum EstadoAsistencia {
  PRESENTE = 'presente',
  AUSENTE = 'ausente',
  JUSTIFICADO = 'justificado',
  TARDANZA = 'tardanza'
}

/**
 * Interfaz base para Reporte de Asistencia
 */
export interface ReporteAsistencia {
  id: number;
  asociadoId: number;
  eventoId: number;
  fecha: string;
  estado: EstadoAsistencia;
  horaRegistro: string;
  observaciones?: string;
  justificacion?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz extendida con información del asociado
 */
export interface ReporteAsistenciaConAsociado extends ReporteAsistencia {
  nombreAsociado: string;
  cedulaAsociado: string;
  ministerioAsociado?: string;
}

/**
 * Interfaz extendida con información del evento
 */
export interface ReporteAsistenciaConEvento extends ReporteAsistencia {
  nombreEvento: string;
  tipoEvento: string;
  descripcionEvento?: string;
}

/**
 * Interfaz completa con asociado y evento
 */
export interface ReporteAsistenciaCompleto extends ReporteAsistencia {
  nombreAsociado: string;
  cedulaAsociado: string;
  ministerioAsociado?: string;
  nombreEvento: string;
  tipoEvento: string;
  descripcionEvento?: string;
}
