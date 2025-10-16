
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
   * Valida los datos para actualizar un asociado
   */
  static validarActualizarAsociado(data: ActualizarAsociadoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar nombre completo (opcional)
    if (data.nombreCompleto !== undefined) {
      if (data.nombreCompleto.trim().length === 0) {
        errors.push('El nombre completo no puede estar vacío');
      } else if (data.nombreCompleto.length > 100) {
        errors.push('El nombre completo no puede exceder 100 caracteres');
      }
    }

    // Validar cédula (opcional)
    if (data.cedula !== undefined) {
      if (data.cedula.trim().length === 0) {
        errors.push('La cédula no puede estar vacía');
      } else if (data.cedula.length > 20) {
        errors.push('La cédula no puede exceder 20 caracteres');
      } else if (!/^[0-9-]+$/.test(data.cedula)) {
        errors.push('La cédula solo puede contener números y guiones');
      }
    }

    // Validar correo (opcional)
    if (data.correo !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (data.correo && !emailRegex.test(data.correo)) {
        errors.push('El formato del correo electrónico no es válido');
      } else if (data.correo && data.correo.length > 100) {
        errors.push('El correo no puede exceder 100 caracteres');
      }
    }

    // Validar teléfono (requerido)
    if (data.telefono !== undefined) {
      if (!data.telefono || data.telefono.trim().length === 0) {
        errors.push('El número de celular es requerido');
      } else if (data.telefono.length > 20) {
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
    if (data.ministerio !== undefined && data.ministerio && data.ministerio.length > 50) {
      errors.push('El ministerio no puede exceder 50 caracteres');
    }

    // Validar fecha de ingreso (opcional)
    if (data.fechaIngreso !== undefined) {
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
