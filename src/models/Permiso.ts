export interface Permiso {
  id: number;
  usuarioId: number;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  motivo: string;
  documentoUrl?: string | null;
  estado: string; // 'PENDIENTE', 'APROBADO', 'RECHAZADO'
  observacionesResolucion?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export class PermisoModel implements Permiso {
  id: number;
  usuarioId: number;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  motivo: string;
  documentoUrl?: string | null;
  estado: string;
  observacionesResolucion?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  constructor(data: Permiso) {
    this.id = data.id;
    this.usuarioId = data.usuarioId;
    this.fechaInicio = data.fechaInicio;
    this.fechaFin = data.fechaFin;
    this.motivo = data.motivo;
    this.documentoUrl = data.documentoUrl;
    this.estado = data.estado;
    this.observacionesResolucion = data.observacionesResolucion;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
