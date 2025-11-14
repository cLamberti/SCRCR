import { CrearEventoRequest, ActualizarEventoRequest } from '@/dto/evento.dto';

/**
 * Validador para eventos
 */
export class EventoValidator {
  
  /**
   * Valida los datos para crear un nuevo evento
   */
  static validarCrearEvento(data: CrearEventoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar nombre
    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre del evento es requerido');
    } else if (data.nombre.length > 100) {
      errors.push('El nombre del evento no puede exceder 100 caracteres');
    }

    // Validar descripción (opcional)
    if (data.descripcion && data.descripcion.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    // Validar fecha
    if (!data.fecha || data.fecha.trim().length === 0) {
      errors.push('La fecha del evento es requerida');
    } else {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(data.fecha)) {
        errors.push('La fecha debe estar en formato YYYY-MM-DD');
      } else {
        const fecha = new Date(data.fecha);
        if (isNaN(fecha.getTime())) {
          errors.push('La fecha proporcionada no es válida');
        }
      }
    }

    // Validar hora
    if (!data.hora || data.hora.trim().length === 0) {
      errors.push('La hora del evento es requerida');
    } else {
      const horaRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!horaRegex.test(data.hora)) {
        errors.push('La hora debe estar en formato HH:MM:SS (24 horas)');
      }
    }

    // Validar activo (opcional, pero si se proporciona debe ser booleano)
    if (data.activo !== undefined && typeof data.activo !== 'boolean') {
      errors.push('El campo activo debe ser verdadero o falso');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida los datos para actualizar un evento
   */
  static validarActualizarEvento(data: ActualizarEventoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar nombre (opcional)
    if (data.nombre !== undefined) {
      if (data.nombre.trim().length === 0) {
        errors.push('El nombre del evento no puede estar vacío');
      } else if (data.nombre.length > 100) {
        errors.push('El nombre del evento no puede exceder 100 caracteres');
      }
    }

    // Validar descripción (opcional)
    if (data.descripcion !== undefined && data.descripcion && data.descripcion.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    // Validar fecha (opcional)
    if (data.fecha !== undefined) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(data.fecha)) {
        errors.push('La fecha debe estar en formato YYYY-MM-DD');
      } else {
        const fecha = new Date(data.fecha);
        if (isNaN(fecha.getTime())) {
          errors.push('La fecha proporcionada no es válida');
        }
      }
    }

    // Validar hora (opcional)
    if (data.hora !== undefined) {
      const horaRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!horaRegex.test(data.hora)) {
        errors.push('La hora debe estar en formato HH:MM:SS (24 horas)');
      }
    }

    // Validar activo (opcional)
    if (data.activo !== undefined && typeof data.activo !== 'boolean') {
      errors.push('El campo activo debe ser verdadero o falso');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitiza los datos de entrada
   */
  static sanitizarDatos<T extends CrearEventoRequest | ActualizarEventoRequest>(data: T): T {
    const sanitized = { ...data };

    if (sanitized.nombre) {
      sanitized.nombre = sanitized.nombre.trim();
    }
    if (sanitized.descripcion) {
      sanitized.descripcion = sanitized.descripcion.trim();
    }
    if (sanitized.fecha) {
      sanitized.fecha = sanitized.fecha.trim();
    }
    if (sanitized.hora) {
      sanitized.hora = sanitized.hora.trim();
    }

    return sanitized;
  }

  /**
   * Valida que la fecha del evento no sea en el pasado
   */
  static validarFechaFutura(fecha: string, hora: string): boolean {
    const fechaHoraEvento = new Date(`${fecha}T${hora}`);
    const ahora = new Date();
    return fechaHoraEvento >= ahora;
  }
}