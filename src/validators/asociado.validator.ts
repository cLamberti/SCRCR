
import { CrearAsociadoRequest, ActualizarAsociadoRequest } from '@/dto/asociado.dto';

/**
 * Validador para crear asociado
 */
export class AsociadoValidator {
  
  /**
   * Valida los datos para crear un nuevo asociado
   */
  static validarCrearAsociado(data: CrearAsociadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar nombre completo
    if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
      errors.push('El nombre completo es requerido');
    } else if (data.nombreCompleto.length > 100) {
      errors.push('El nombre completo no puede exceder 100 caracteres');
    }

    // Validar cédula
    if (!data.cedula || data.cedula.trim().length === 0) {
      errors.push('La cédula es requerida');
    } else if (data.cedula.length > 20) {
      errors.push('La cédula no puede exceder 20 caracteres');
    } else if (!/^[0-9-]+$/.test(data.cedula)) {
      errors.push('La cédula solo puede contener números y guiones');
    }

    // Validar correo (opcional)
    if (data.correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.correo)) {
        errors.push('El formato del correo electrónico no es válido');
      } else if (data.correo.length > 100) {
        errors.push('El correo no puede exceder 100 caracteres');
      }
    }

    // Validar teléfono (requerido)
    if (!data.telefono || data.telefono.trim().length === 0) {
      errors.push('El número de celular es requerido');
    } else {
      if (data.telefono.length > 20) {
        errors.push('El teléfono no puede exceder 20 caracteres');
      } else {
        // Limpiar el número para validación (solo dígitos)
        const cleanPhone = data.telefono.replace(/[\s\-+()]/g, '');
        
        // Validar que solo contenga números y algunos caracteres permitidos
        const phoneRegex = /^[\d\s\-+()]+$/;
        
        if (!phoneRegex.test(data.telefono)) {
          errors.push('El teléfono contiene caracteres no válidos');
        } else if (cleanPhone.length < 8) {
          errors.push('El número debe tener al menos 8 dígitos');
        }
      }
    }

    // Validar ministerio (opcional)
    if (data.ministerio && data.ministerio.length > 50) {
      errors.push('El ministerio no puede exceder 50 caracteres');
    }

    // Validar fecha de ingreso (opcional)
    if (data.fechaIngreso) {
      const fecha = new Date(data.fechaIngreso);
      if (isNaN(fecha.getTime())) {
        errors.push('La fecha de ingreso no es válida');
      }
    }

    // Validar estado (opcional)
    if (data.estado !== undefined && ![0, 1].includes(data.estado)) {
      errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

/**
 * Valida los datos para actualizar un asociado existente
 */
static validarActualizarAsociado(data: ActualizarAsociadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let hasData = false;

    // Helper para verificar si al menos un campo tiene datos
    const checkData = (value: any) => {
        if (value !== undefined) hasData = true;
    };

    // Validar nombre completo (si se proporciona)
    if (data.nombreCompleto !== undefined) {
        checkData(data.nombreCompleto);
        if (data.nombreCompleto.trim().length === 0) {
            errors.push('El nombre completo no puede estar vacío');
        } else if (data.nombreCompleto.length > 100) {
            errors.push('El nombre completo no puede exceder 100 caracteres');
        }
    }

    // Validar cédula (si se proporciona)
    if (data.cedula !== undefined) {
        checkData(data.cedula);
        if (data.cedula.trim().length === 0) {
            errors.push('La cédula no puede estar vacía');
        } else if (data.cedula.length > 20) {
            errors.push('La cédula no puede exceder 20 caracteres');
        } else if (!/^[0-9-]+$/.test(data.cedula)) {
            errors.push('La cédula solo puede contener números y guiones');
        }
    }

    // Validar correo (si se proporciona)
    if (data.correo !== undefined) {
        checkData(data.correo);
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (data.correo && !emailRegex.test(data.correo)) {
            errors.push('El formato del correo electrónico no es válido');
        }
    }

    // Validar teléfono (si se proporciona)
    if (data.telefono !== undefined) {
        checkData(data.telefono);
        if (data.telefono && !/^[0-9+\s()-]{8,20}$/.test(data.telefono)) {
            errors.push('El teléfono no es válido');
        }
    }

    // Validar dirección (si se proporciona)
    if (data.direccion !== undefined) {
        checkData(data.direccion);
        if (data.direccion && data.direccion.length > 255) {
            errors.push('La dirección no puede exceder 255 caracteres');
        }
    }

    // Validar ministerio (si se proporciona)
    if (data.ministerio !== undefined) {
        checkData(data.ministerio);
        if (data.ministerio && data.ministerio.length > 50) {
            errors.push('El ministerio no puede exceder 50 caracteres');
        }
    }
    
    // Validar fecha de ingreso (si se proporciona)
    if (data.fechaIngreso !== undefined) {
        checkData(data.fechaIngreso);
        if (data.fechaIngreso) {
            const fecha = new Date(data.fechaIngreso);
            if (isNaN(fecha.getTime())) {
                errors.push('La fecha de ingreso no es válida');
            }
        }
    }

    // Validar estado (si se proporciona)
    if (data.estado !== undefined) {
        checkData(data.estado);
        if (![0, 1].includes(data.estado)) {
            errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
        }
    }

    // Si no hay errores, pero tampoco se proporcionó ningún campo para actualizar.
    if (!hasData && errors.length === 0) {
        errors.push('No se proporcionó ningún campo para actualizar');
    }


    return {
        valid: errors.length === 0,
        errors
    };
}

  /**
   * Sanitiza los datos de entrada
   */
  static sanitizarDatos<T extends CrearAsociadoRequest | ActualizarAsociadoRequest>(data: T): T {
    const sanitized = { ...data };

    if (sanitized.nombreCompleto) {
      sanitized.nombreCompleto = sanitized.nombreCompleto.trim();
    }
    if (sanitized.cedula) {
      sanitized.cedula = sanitized.cedula.trim();
    }
    if (sanitized.correo) {
      sanitized.correo = sanitized.correo.trim().toLowerCase();
    }
    if (sanitized.telefono) {
      sanitized.telefono = sanitized.telefono.trim();
    }
    if (sanitized.ministerio) {
      sanitized.ministerio = sanitized.ministerio.trim();
    }
    if (sanitized.direccion) {
      sanitized.direccion = sanitized.direccion.trim();
    }

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

    // nombreCompleto (opcional)
    if (input.nombreCompleto !== undefined) {
      const n = String(input.nombreCompleto).trim();
      if (n.length > 0 && n.length < 2) {
        errors.push('El nombre completo debe tener al menos 2 caracteres');
      } else if (n.length > 0) {
        filtros.nombreCompleto = n;
      }
    }

    // cedula (opcional)
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

    // estado (opcional: 0 | 1)
    if (input.estado !== undefined && String(input.estado).length > 0) {
      const e = Number(input.estado);
      if (![0, 1].includes(e)) {
        errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
      } else {
        filtros.estado = e;
      }
    }

    // paginación (opcionales con defaults)
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

    // ID: requerido, numérico y > 0
    const rawId = input.id;
    const idNum = Number(rawId);
    if (!rawId || Number.isNaN(idNum) || idNum <= 0) {
      errors.push('El ID debe ser un número');
    }

    // permanente: opcional; aceptamos 'true' | true como verdadero
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