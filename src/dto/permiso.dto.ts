export interface CrearPermisoRequest {
  fechaInicio: string; // yyyy-mm-dd
  fechaFin: string;    // yyyy-mm-dd
  motivo: string;
  documentoUrl?: string; 
  estado?: string;     // PENDIENTE por defecto
}

export interface AprobarRechazarPermisoRequest {
  estado: 'APROBADO' | 'RECHAZADO';
  observacionesResolucion?: string;
}

export interface PermisoExtendidoDto {
  id: number;
  usuarioId: number;
  nombreCompleto: string; // From usuarios table (JOIN)
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  documentoUrl: string | null;
  estado: string;
  observacionesResolucion: string | null;
  createdAt: string;
  updatedAt: string;
}
