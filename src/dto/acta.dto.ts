export type TipoSesion = 'ordinaria' | 'extraordinaria';
export type EstadoAsistenciaActa = 'presente' | 'ausente' | 'justificado';

// ── Acta Asociación ──────────────────────────────────────────────────────────

export interface ActaAsociacionDTO {
  id: number;
  fecha: string;           // ISO date string
  tipoSesion: TipoSesion;
  urlActa: string | null;
  nombreArchivo: string | null;
  createdAt: string;
  updatedAt: string;
  totalAsistentes?: number;
  totalAusentes?: number;
}

export interface CrearActaAsociacionRequest {
  fecha: string;
  tipoSesion: TipoSesion;
  urlActa?: string;
  nombreArchivo?: string;
}

export interface ActualizarActaAsociacionRequest {
  fecha?: string;
  tipoSesion?: TipoSesion;
  urlActa?: string | null;
  nombreArchivo?: string | null;
}

// ── Acta Junta Directiva ─────────────────────────────────────────────────────

export interface ActaJDDTO {
  id: number;
  fecha: string;
  tipoSesion: TipoSesion;
  urlActa: string | null;
  nombreArchivo: string | null;
  createdAt: string;
  updatedAt: string;
  totalAsistentes?: number;
  totalAusentes?: number;
}

export interface CrearActaJDRequest {
  fecha: string;
  tipoSesion: TipoSesion;
  urlActa?: string;
  nombreArchivo?: string;
}

export interface ActualizarActaJDRequest {
  fecha?: string;
  tipoSesion?: TipoSesion;
  urlActa?: string | null;
  nombreArchivo?: string | null;
}

// ── Asistencia ───────────────────────────────────────────────────────────────

export interface AsistenciaActaDTO {
  id: number;
  actaId: number;
  asociadoId: number;
  nombreAsociado: string;
  estado: EstadoAsistenciaActa;
  justificacion: string | null;
}

export interface RegistrarAsistenciaRequest {
  asociadoId: number;
  estado: EstadoAsistenciaActa;
  justificacion?: string | null;
}

export interface RegistrarAsistenciaBulkRequest {
  asistencias: RegistrarAsistenciaRequest[];
}
