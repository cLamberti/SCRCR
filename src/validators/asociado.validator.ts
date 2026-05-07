
import { CrearAsociadoRequest, ActualizarAsociadoRequest } from '@/dto/asociado.dto';

const PUESTOS_JUNTA = ['Presidente', 'Vicepresidente', 'Secretario', 'Tesorero', 'Vocal', 'Fiscal'];
const ESTADOS_CIVILES = ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unión libre'];

export class AsociadoValidator {

  static validarCrearAsociado(data: CrearAsociadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
      errors.push('El nombre completo es requerido');
    } else if (data.nombreCompleto.length > 100) {
      errors.push('El nombre completo no puede exceder 100 caracteres');
    }

    if (!data.cedula || data.cedula.trim().length === 0) {
      errors.push('La cédula es requerida');
    } else if (data.cedula.length > 20) {
      errors.push('La cédula no puede exceder 20 caracteres');
    } else if (!/^[0-9-]+$/.test(data.cedula)) {
      errors.push('La cédula solo puede contener números y guiones');
    }

    if (data.correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.correo)) {
        errors.push('El formato del correo electrónico no es válido');
      } else if (data.correo.length > 100) {
        errors.push('El correo no puede exceder 100 caracteres');
      }
    }

    if (!data.telefono || data.telefono.trim().length === 0) {
      errors.push('El número de celular es requerido');
    } else {
      if (data.telefono.length > 20) {
        errors.push('El teléfono no puede exceder 20 caracteres');
      } else {
        const cleanPhone = data.telefono.replace(/[\s\-+()]/g, '');
        if (!/^[\d\s\-+()]+$/.test(data.telefono)) {
          errors.push('El teléfono contiene caracteres no válidos');
        } else if (cleanPhone.length < 8) {
          errors.push('El número debe tener al menos 8 dígitos');
        }
      }
    }

    if (data.telefonoContacto) {
      const clean = data.telefonoContacto.replace(/[\s\-+()]/g, '');
      if (!/^[\d\s\-+()]+$/.test(data.telefonoContacto)) {
        errors.push('El teléfono de contacto contiene caracteres no válidos');
      } else if (clean.length < 8) {
        errors.push('El teléfono de contacto debe tener al menos 8 dígitos');
      }
    }

    if (data.ministerio && data.ministerio.length > 50) {
      errors.push('El ministerio no puede exceder 50 caracteres');
    }

    if (data.fechaIngreso) {
      const fecha = new Date(data.fechaIngreso);
      if (isNaN(fecha.getTime())) errors.push('La fecha de ingreso no es válida');
    }

    if (data.fechaNacimiento) {
      const fecha = new Date(data.fechaNacimiento);
      if (isNaN(fecha.getTime())) errors.push('La fecha de nacimiento no es válida');
    }

    if (data.estadoCivil && !ESTADOS_CIVILES.includes(data.estadoCivil)) {
      errors.push(`El estado civil debe ser uno de: ${ESTADOS_CIVILES.join(', ')}`);
    }

    if (data.profesion && data.profesion.length > 100) {
      errors.push('La profesión no puede exceder 100 caracteres');
    }

    if (data.anosCongregarse !== undefined) {
      if (!Number.isInteger(data.anosCongregarse) || data.anosCongregarse < 0) {
        errors.push('Los años de congregarse deben ser un número entero positivo');
      }
    }

    if (data.fechaAceptacion) {
      const fecha = new Date(data.fechaAceptacion);
      if (isNaN(fecha.getTime())) errors.push('La fecha de aceptación no es válida');
    }

    if (data.perteneceJuntaDirectiva) {
      if (!data.puestoJuntaDirectiva) {
        errors.push('El puesto en la Junta Directiva es requerido cuando pertenece a ella');
      } else if (!PUESTOS_JUNTA.includes(data.puestoJuntaDirectiva)) {
        errors.push(`El puesto debe ser uno de: ${PUESTOS_JUNTA.join(', ')}`);
      }
    }

    if (data.estado !== undefined && ![0, 1].includes(data.estado)) {
      errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
    }

    return { valid: errors.length === 0, errors };
  }

  static validarActualizarAsociado(data: ActualizarAsociadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let hasData = false;
    const checkData = (value: any) => { if (value !== undefined) hasData = true; };

    if (data.nombreCompleto !== undefined) {
      checkData(data.nombreCompleto);
      if (data.nombreCompleto.trim().length === 0) errors.push('El nombre completo no puede estar vacío');
      else if (data.nombreCompleto.length > 100) errors.push('El nombre completo no puede exceder 100 caracteres');
    }

    if (data.cedula !== undefined) {
      checkData(data.cedula);
      if (data.cedula.trim().length === 0) errors.push('La cédula no puede estar vacía');
      else if (data.cedula.length > 20) errors.push('La cédula no puede exceder 20 caracteres');
      else if (!/^[0-9-]+$/.test(data.cedula)) errors.push('La cédula solo puede contener números y guiones');
    }

    if (data.correo !== undefined) {
      checkData(data.correo);
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (data.correo && !emailRegex.test(data.correo)) errors.push('El formato del correo electrónico no es válido');
    }

    if (data.telefono !== undefined) {
      checkData(data.telefono);
      if (data.telefono && !/^[0-9+\s()-]{8,20}$/.test(data.telefono)) errors.push('El teléfono no es válido');
    }

    if (data.telefonoContacto !== undefined) {
      checkData(data.telefonoContacto);
      if (data.telefonoContacto && !/^[0-9+\s()-]{8,20}$/.test(data.telefonoContacto)) {
        errors.push('El teléfono de contacto no es válido');
      }
    }

    if (data.direccion !== undefined) {
      checkData(data.direccion);
      if (data.direccion && data.direccion.length > 255) errors.push('La dirección no puede exceder 255 caracteres');
    }

    if (data.ministerio !== undefined) {
      checkData(data.ministerio);
      if (data.ministerio && data.ministerio.length > 50) errors.push('El ministerio no puede exceder 50 caracteres');
    }

    if (data.fechaIngreso !== undefined) {
      checkData(data.fechaIngreso);
      if (data.fechaIngreso && isNaN(new Date(data.fechaIngreso).getTime())) {
        errors.push('La fecha de ingreso no es válida');
      }
    }

    if (data.fechaNacimiento !== undefined) {
      checkData(data.fechaNacimiento);
      if (data.fechaNacimiento && isNaN(new Date(data.fechaNacimiento).getTime())) {
        errors.push('La fecha de nacimiento no es válida');
      }
    }

    if (data.estadoCivil !== undefined) {
      checkData(data.estadoCivil);
      if (data.estadoCivil && !ESTADOS_CIVILES.includes(data.estadoCivil)) {
        errors.push(`El estado civil debe ser uno de: ${ESTADOS_CIVILES.join(', ')}`);
      }
    }

    if (data.profesion !== undefined) {
      checkData(data.profesion);
      if (data.profesion && data.profesion.length > 100) errors.push('La profesión no puede exceder 100 caracteres');
    }

    if (data.anosCongregarse !== undefined && data.anosCongregarse !== null) {
      checkData(data.anosCongregarse);
      const anosNum = Number(data.anosCongregarse);
      if (!Number.isInteger(anosNum) || anosNum < 0) {
        errors.push('Los años de congregarse deben ser un número entero positivo');
      }
    }

    if (data.fechaAceptacion !== undefined) {
      checkData(data.fechaAceptacion);
      if (data.fechaAceptacion && isNaN(new Date(data.fechaAceptacion).getTime())) {
        errors.push('La fecha de aceptación no es válida');
      }
    }

    if (data.perteneceJuntaDirectiva !== undefined) {
      checkData(data.perteneceJuntaDirectiva);
      if (data.perteneceJuntaDirectiva && !data.puestoJuntaDirectiva) {
        errors.push('El puesto en la Junta Directiva es requerido cuando pertenece a ella');
      }
    }

    if (data.puestoJuntaDirectiva !== undefined) {
      checkData(data.puestoJuntaDirectiva);
      if (data.puestoJuntaDirectiva && !PUESTOS_JUNTA.includes(data.puestoJuntaDirectiva)) {
        errors.push(`El puesto debe ser uno de: ${PUESTOS_JUNTA.join(', ')}`);
      }
    }

    if (data.estado !== undefined) {
      checkData(data.estado);
      if (![0, 1].includes(data.estado)) errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
    }

    if (!hasData && errors.length === 0) {
      errors.push('No se proporcionó ningún campo para actualizar');
    }

    return { valid: errors.length === 0, errors };
  }

  static sanitizarDatos<T extends CrearAsociadoRequest | ActualizarAsociadoRequest>(data: T): T {
    const sanitized = { ...data };
    if (sanitized.nombreCompleto) sanitized.nombreCompleto = sanitized.nombreCompleto.trim();
    if (sanitized.cedula) sanitized.cedula = sanitized.cedula.trim();
    if (sanitized.correo) sanitized.correo = sanitized.correo.trim().toLowerCase();
    if (sanitized.telefono) sanitized.telefono = sanitized.telefono.trim();
    if (sanitized.telefonoContacto) sanitized.telefonoContacto = sanitized.telefonoContacto.trim();
    if (sanitized.ministerio) sanitized.ministerio = sanitized.ministerio.trim();
    if (sanitized.direccion) sanitized.direccion = sanitized.direccion.trim();
    if (sanitized.profesion) sanitized.profesion = sanitized.profesion.trim();
    return sanitized;
  }
}

export class ConsultaAsociadoValidator {
  static validarFiltros(input: {
    nombreCompleto?: string;
    cedula?: string;
    estado?: string | number;
    page?: string | number;
    limit?: string | number;
  }): { valid: boolean; errors: string[]; filtros: {
    nombreCompleto?: string;
    cedula?: string;
    estado?: number;
    page: number;
    limit: number;
  } } {
    const errors: string[] = [];
    const filtros: any = {};

    if (input.nombreCompleto !== undefined) {
      const n = String(input.nombreCompleto).trim();
      if (n.length > 0 && n.length < 2) {
        errors.push('El nombre completo debe tener al menos 2 caracteres');
      } else if (n.length > 0) {
        filtros.nombreCompleto = n;
      }
    }

    if (input.cedula !== undefined) {
      const c = String(input.cedula).trim();
      if (c.length > 0) {
        if (!/^[0-9-]+$/.test(c)) {
          errors.push('La cédula solo puede contener números y guiones');
        } else {
          filtros.cedula = c;
        }
      }
    }

    if (input.estado !== undefined && String(input.estado).length > 0) {
      const e = Number(input.estado);
      if (![0, 1].includes(e)) {
        errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
      } else {
        filtros.estado = e;
      }
    }

    const p = Number(input.page ?? 1);
    const l = Number(input.limit ?? 10);
    if (!Number.isFinite(p) || p < 1) errors.push('El page debe ser un número mayor o igual a 1');
    if (!Number.isFinite(l) || l < 1 || l > 100) errors.push('El limit debe estar entre 1 y 100');

    filtros.page = Number.isFinite(p) && p >= 1 ? p : 1;
    filtros.limit = Number.isFinite(l) && l >= 1 && l <= 100 ? l : 10;

    return { valid: errors.length === 0, errors, filtros };
  }
}

export class DeleteAsociadoValidator {
  static validar(input: { id?: string | number; permanente?: string | boolean }): {
    valid: boolean;
    errors: string[];
    id?: number;
    permanente: boolean;
  } {
    const errors: string[] = [];

    const rawId = input.id;
    const idNum = Number(rawId);
    if (!rawId || Number.isNaN(idNum) || idNum <= 0) {
      errors.push('El ID debe ser un número');
    }

    const permanente =
      input.permanente === true ||
      String(input.permanente).toLowerCase() === 'true';

    return {
      valid: errors.length === 0,
      errors,
      id: errors.length === 0 ? idNum : undefined,
      permanente,
    };
  }
}
