export interface CrearEmpleadoRequest {
  nombre: string;
  cedula: string;
  puesto: string;
  salarioBase: number;
  cuentaBancaria?: string;
}

export interface ActualizarEmpleadoRequest {
  nombre?: string;
  cedula?: string;
  puesto?: string;
  salarioBase?: number;
  cuentaBancaria?: string;
  estado?: number;
}

export interface EmpleadoResponse {
  id: number;
  nombre: string;
  cedula: string;
  puesto: string;
  salarioBase: number;
  cuentaBancaria?: string;
  estado: number;
}

export interface CrearPlanillaRequest {
  mes: number;
  anio: number;
  lineas: {
    empleadoId: number;
    diasAusentes: number;
    diasVacaciones: number;
    diasIncapacidad: number;
  }[];
}

export interface LineaPlanillaResponse {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoCedula: string;
  empleadoPuesto: string;
  empleadoCuentaBancaria?: string;
  salarioBase: number;
  diasTrabajados: number;
  diasAusentes: number;
  diasVacaciones: number;
  diasIncapacidad: number;
  montoAPagar: number;
}

export interface PlanillaResponse {
  id: number;
  mes: number;
  anio: number;
  estado: string;
  fechaGeneracion: string;
  lineas: LineaPlanillaResponse[];
  totalAPagar: number;
}
