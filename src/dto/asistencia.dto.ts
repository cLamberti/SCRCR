export interface RegistrarAsistenciaDto {
  asociado_id: number;
  evento_id: number;
  presente: boolean;
}

export interface AsistenciaDto {
  asociado_id: number;
  evento_id: number;
  presente: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AsistenciaConAsociadoDto {
  asociado_id: number;
  evento_id: number;
  presente: boolean;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EstadisticasAsistenciaDto {
  evento_id: number;
  nombre_evento: string;
  total_asociados: number;
  presentes: number;
  ausentes: number;
  porcentaje_asistencia: number;
}

export interface AsistenciaPorEventoDto {
  evento_id: number;
  nombre_evento: string;
  fecha_evento: string;
  hora_evento: string;
  asistencias: AsistenciaConAsociadoDto[];
  estadisticas: {
    total: number;
    presentes: number;
    ausentes: number;
    porcentaje: number;
  };
}

// Validaciones
export const validarRegistrarAsistencia = (datos: any): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];

  if (!datos.asociado_id || typeof datos.asociado_id !== 'number' || datos.asociado_id <= 0) {
    errores.push('El ID del asociado es requerido y debe ser un número positivo');
  }

  if (!datos.evento_id || typeof datos.evento_id !== 'number' || datos.evento_id <= 0) {
    errores.push('El ID del evento es requerido y debe ser un número positivo');
  }

  if (datos.presente === undefined || typeof datos.presente !== 'boolean') {
    errores.push('El estado de presencia es requerido y debe ser verdadero o falso');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

export const validarEliminarAsistencia = (asociadoId: any, eventoId: any): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];

  const asociadoIdNum = parseInt(asociadoId);
  const eventoIdNum = parseInt(eventoId);

  if (isNaN(asociadoIdNum) || asociadoIdNum <= 0) {
    errores.push('El ID del asociado debe ser un número positivo');
  }

  if (isNaN(eventoIdNum) || eventoIdNum <= 0) {
    errores.push('El ID del evento debe ser un número positivo');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};