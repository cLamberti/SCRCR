export interface Empleado {
  id: number;
  nombre: string;
  cedula: string;
  puesto: string;
  salarioBase: number;
  cuentaBancaria?: string;
  estado: number;
}

export interface LineaPlanilla {
  id: number;
  empleadoId: number;
  periodoPlanillaId: number;
  diasTrabajados: number;
  diasAusentes: number;
  diasVacaciones: number;
  diasIncapacidad: number;
  montoAPagar: number;
  empleado?: Empleado;
}

export interface PeriodoPlanilla {
  id: number;
  mes: number;
  anio: number;
  estado: 'borrador' | 'cerrado';
  fechaGeneracion: Date;
  lineas?: LineaPlanilla[];
}
