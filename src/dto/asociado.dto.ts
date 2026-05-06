import { EstadoAsociado } from '@/models/Asociado';

export interface CrearAsociadoRequest {
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  telefonoContacto?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  profesion?: string;
  anosCongregarse?: number;
  fechaAceptacion?: string;
  perteneceJuntaDirectiva?: boolean;
  puestoJuntaDirectiva?: string;
  estado?: EstadoAsociado;
  observaciones?: string;
  fechaInactivo?: string;
}

export interface ActualizarAsociadoRequest {
  nombreCompleto?: string;
  cedula?: string;
  correo?: string;
  telefono?: string;
  telefonoContacto?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  profesion?: string;
  anosCongregarse?: number;
  fechaAceptacion?: string;
  perteneceJuntaDirectiva?: boolean;
  puestoJuntaDirectiva?: string;
  estado?: EstadoAsociado;
  observaciones?: string;
  fechaInactivo?: string;
}

export interface AsociadoResponse {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  telefonoContacto?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  profesion?: string;
  anosCongregarse?: number;
  fechaAceptacion?: string;
  perteneceJuntaDirectiva: boolean;
  puestoJuntaDirectiva?: string;
  estado: number;
  observaciones?: string;
  fechaInactivo?: string;
}

export interface AsociadoResponseWithMessage {
  success: boolean;
  message: string;
  data?: AsociadoResponse;
}

export interface ListarAsociadosResponse {
  success: boolean;
  data: AsociadoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AllAsociadosResponse {
  success: boolean;
  data: AsociadoResponse[];
  message?: string;
}

export interface FiltrosAsociadoRequest {
  nombreCompleto?: string;
  cedula?: string;
  ministerio?: string;
  estado?: EstadoAsociado;
  fechaIngresoDesde?: string;
  fechaIngresoHasta?: string;
  page?: number;
  limit?: number;
}

export interface DeleteAsociadoRequest {
  id: number;
  permanente?: boolean;
}

export interface DeleteAsociadoResponse {
  success: boolean;
  message: string;
  id?: number;
  permanente?: boolean;
}
