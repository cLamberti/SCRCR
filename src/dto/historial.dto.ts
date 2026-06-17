export type TipoRegistroHistorial = 'asistencia' | 'permiso' | 'modificacion';

export interface HistorialItemDTO {
  id_registro: number | string;
  tipo: TipoRegistroHistorial;
  fecha: Date | string;
  descripcion: string;
  estado?: string;
  detalles?: any;
}

export interface HistorialFiltrosRequest {
  fechaDesde?: string;
  fechaHasta?: string;
  tipoRegistro?: TipoRegistroHistorial | 'todos';
}

export interface ConsultaHistorialRequest {
  personaId: number;
  tipoPersona: 'usuario' | 'asociado' | 'congregado';
  filtros?: HistorialFiltrosRequest;
}

export interface HistorialResponseDTO {
  persona: {
    id: number;
    nombre: string;
    tipo: string;
    identificacion?: string;
  };
  historial: HistorialItemDTO[];
}
