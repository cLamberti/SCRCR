import { CrearEmpleadoRequest, ActualizarEmpleadoRequest, CrearPlanillaRequest } from '@/dto/empleado.dto';

export class EmpleadoValidator {
  static validarCrear(data: CrearEmpleadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.nombre?.trim()) errors.push('El nombre es requerido.');
    else if (data.nombre.length > 100) errors.push('El nombre no puede exceder 100 caracteres.');

    if (!data.cedula?.trim()) errors.push('La cédula es requerida.');
    else if (!/^[0-9-]+$/.test(data.cedula)) errors.push('La cédula solo puede contener números y guiones.');
    else if (data.cedula.length < 9) errors.push('La cédula debe tener al menos 9 caracteres.');

    if (!data.puesto?.trim()) errors.push('El puesto es requerido.');
    else if (data.puesto.length > 100) errors.push('El puesto no puede exceder 100 caracteres.');

    if (data.salarioBase === undefined || data.salarioBase === null) errors.push('El salario base es requerido.');
    else if (isNaN(data.salarioBase) || data.salarioBase <= 0) errors.push('El salario base debe ser un número mayor a 0.');

    if (data.cuentaBancaria && data.cuentaBancaria.length > 50) errors.push('La cuenta bancaria no puede exceder 50 caracteres.');

    return { valid: errors.length === 0, errors };
  }

  static validarActualizar(data: ActualizarEmpleadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.nombre !== undefined && data.nombre.trim().length === 0) errors.push('El nombre no puede estar vacío.');
    if (data.cedula !== undefined) {
      if (!/^[0-9-]+$/.test(data.cedula)) errors.push('La cédula solo puede contener números y guiones.');
      else if (data.cedula.length < 9) errors.push('La cédula debe tener al menos 9 caracteres.');
    }
    if (data.salarioBase !== undefined && (isNaN(data.salarioBase) || data.salarioBase <= 0)) {
      errors.push('El salario base debe ser un número mayor a 0.');
    }
    if (data.estado !== undefined && ![0, 1].includes(data.estado)) errors.push('El estado debe ser 0 o 1.');

    return { valid: errors.length === 0, errors };
  }

  static validarCrearPlanilla(data: CrearPlanillaRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.mes || data.mes < 1 || data.mes > 12) errors.push('El mes debe estar entre 1 y 12.');
    if (!data.anio || data.anio < 2000 || data.anio > 2100) errors.push('El año no es válido.');
    if (!Array.isArray(data.lineas) || data.lineas.length === 0) errors.push('Debe incluir al menos un empleado en la planilla.');

    data.lineas?.forEach((l, i) => {
      const prefix = `Línea ${i + 1}:`;
      if (!l.empleadoId) errors.push(`${prefix} empleadoId es requerido.`);
      if (l.diasAusentes < 0 || l.diasAusentes > 30) errors.push(`${prefix} días ausentes debe estar entre 0 y 30.`);
      if (l.diasVacaciones < 0 || l.diasVacaciones > 30) errors.push(`${prefix} días de vacaciones debe estar entre 0 y 30.`);
      if (l.diasIncapacidad < 0 || l.diasIncapacidad > 30) errors.push(`${prefix} días de incapacidad debe estar entre 0 y 30.`);
      const total = (l.diasAusentes || 0) + (l.diasVacaciones || 0) + (l.diasIncapacidad || 0);
      if (total > 30) errors.push(`${prefix} la suma de días (ausentes + vacaciones + incapacidad) no puede superar 30.`);
    });

    return { valid: errors.length === 0, errors };
  }
}
