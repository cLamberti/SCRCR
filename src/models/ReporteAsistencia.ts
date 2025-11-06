
export enum EstadoAsistencia {
  Presente = 'presente',
  Ausente = 'ausente',
  Justificado = 'justificado',
}
export interface ReporteAsistencia {
  id: number;
  asociado_id: number;
  evento_id: number;
  fecha: string; // Formato YYYY-MM-DD
  estado: EstadoAsistencia;
  hora_registro: string; // Formato HH:MM:SS
  justificacion?: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
