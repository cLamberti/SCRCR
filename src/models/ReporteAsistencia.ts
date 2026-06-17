
export enum EstadoAsistencia {
  Presente = 'presente',
  Ausente = 'ausente',
  Justificado = 'justificado',
}
export interface ReporteAsistencia {
  id: number;
  asociado_id?: number | null;
  congregado_id?: number | null;
  evento_id: number;
  fecha: string;
  estado: EstadoAsistencia;
  hora_registro: string | null;
  justificacion?: string | null;
  created_at: string;
  updated_at: string;
}
