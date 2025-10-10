
export interface Asociado {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: Date;
  estado: number;
}

export class AsociadoModel implements Asociado {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: Date;
  estado: number;

  constructor(data: Partial<Asociado>) {
    this.id = data.id || 0;
    this.nombreCompleto = data.nombreCompleto || '';
    this.cedula = data.cedula || '';
    this.correo = data.correo;
    this.telefono = data.telefono;
    this.ministerio = data.ministerio;
    this.direccion = data.direccion;
    this.fechaIngreso = data.fechaIngreso || new Date();
    this.estado = data.estado ?? 0;
  }

  // Método para validar si el asociado está activo
  isActivo(): boolean {
    return this.estado === 1;
  }

  // Método para obtener el objeto como JSON
  toJSON(): Asociado {
    return {
      id: this.id,
      nombreCompleto: this.nombreCompleto,
      cedula: this.cedula,
      correo: this.correo,
      telefono: this.telefono,
      ministerio: this.ministerio,
      direccion: this.direccion,
      fechaIngreso: this.fechaIngreso,
      estado: this.estado
    };
  }
}

// Tipo para crear un nuevo asociado (sin id)
export type NuevoAsociado = Omit<Asociado, 'id'>;

// Tipo para actualizar un asociado (todos los campos opcionales excepto id)
export type ActualizarAsociado = Partial<Omit<Asociado, 'id'>> & { id: number };

// Enum para los estados del asociado
export enum EstadoAsociado {
  INACTIVO = 0,
  ACTIVO = 1
}
