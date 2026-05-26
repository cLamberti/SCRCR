
export interface Asociado {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  telefonoContacto?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: Date;
  fechaNacimiento?: Date;
  estadoCivil?: string;
  profesion?: string;
  anosCongregarse?: number;
  fechaAceptacion?: Date;
  perteneceJuntaDirectiva: boolean;
  puestoJuntaDirectiva?: string;
  estado: number;
  observaciones?: string;
  fechaInactivo?: Date;
  urlCedula?: string;
  urlCartaSolicitud?: string;
  urlCartaRenuncia?: string;
  urlCartaDesafiliacion?: string;
  urlOtros?: string;
}

export class AsociadoModel implements Asociado {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  telefonoContacto?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: Date;
  fechaNacimiento?: Date;
  estadoCivil?: string;
  profesion?: string;
  anosCongregarse?: number;
  fechaAceptacion?: Date;
  perteneceJuntaDirectiva: boolean;
  puestoJuntaDirectiva?: string;
  estado: number;
  observaciones?: string;
  fechaInactivo?: Date;
  urlCedula?: string;
  urlCartaSolicitud?: string;
  urlCartaRenuncia?: string;
  urlCartaDesafiliacion?: string;
  urlOtros?: string;

  constructor(data: Partial<Asociado>) {
    this.id = data.id || 0;
    this.nombreCompleto = data.nombreCompleto || '';
    this.cedula = data.cedula || '';
    this.correo = data.correo;
    this.telefono = data.telefono;
    this.telefonoContacto = data.telefonoContacto;
    this.ministerio = data.ministerio;
    this.direccion = data.direccion;
    this.fechaIngreso = data.fechaIngreso || new Date();
    this.fechaNacimiento = data.fechaNacimiento;
    this.estadoCivil = data.estadoCivil;
    this.profesion = data.profesion;
    this.anosCongregarse = data.anosCongregarse;
    this.fechaAceptacion = data.fechaAceptacion;
    this.perteneceJuntaDirectiva = data.perteneceJuntaDirectiva ?? false;
    this.puestoJuntaDirectiva = data.puestoJuntaDirectiva;
    this.estado = data.estado ?? 0;
    this.observaciones = data.observaciones;
    this.fechaInactivo = data.fechaInactivo;
    this.urlCedula = data.urlCedula;
    this.urlCartaSolicitud = data.urlCartaSolicitud;
    this.urlCartaRenuncia = data.urlCartaRenuncia;
    this.urlCartaDesafiliacion = data.urlCartaDesafiliacion;
    this.urlOtros = data.urlOtros;
  }

  isActivo(): boolean {
    return this.estado === 1;
  }

  toJSON(): Asociado {
    return {
      id: this.id,
      nombreCompleto: this.nombreCompleto,
      cedula: this.cedula,
      correo: this.correo,
      telefono: this.telefono,
      telefonoContacto: this.telefonoContacto,
      ministerio: this.ministerio,
      direccion: this.direccion,
      fechaIngreso: this.fechaIngreso,
      fechaNacimiento: this.fechaNacimiento,
      estadoCivil: this.estadoCivil,
      profesion: this.profesion,
      anosCongregarse: this.anosCongregarse,
      fechaAceptacion: this.fechaAceptacion,
      perteneceJuntaDirectiva: this.perteneceJuntaDirectiva,
      puestoJuntaDirectiva: this.puestoJuntaDirectiva,
      estado: this.estado,
      observaciones: this.observaciones,
      fechaInactivo: this.fechaInactivo,
      urlCedula: this.urlCedula,
      urlCartaSolicitud: this.urlCartaSolicitud,
      urlCartaRenuncia: this.urlCartaRenuncia,
      urlCartaDesafiliacion: this.urlCartaDesafiliacion,
      urlOtros: this.urlOtros,
    };
  }
}

export type NuevoAsociado = Omit<Asociado, 'id'>;
export type ActualizarAsociado = Partial<Omit<Asociado, 'id'>> & { id: number };

export enum EstadoAsociado {
  INACTIVO = 0,
  ACTIVO = 1
}
