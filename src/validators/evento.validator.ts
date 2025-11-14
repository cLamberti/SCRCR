import { CrearEventoRequest, ActualizarEventoRequest } from '@/dto/evento.dto';

/**
 * Validador para eventos (solo valida fechas inválidas o pasadas)
 */
export class EventoValidator {

  // ----- Utils -----
  private static readonly DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  private static readonly TIME_RE_HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
  private static readonly TIME_RE_HHMMSS = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

  /** Acepta HH:mm o HH:mm:ss; devuelve HH:mm:ss o null si vacío */
  private static normalizeTimeToHHMMSS(hora?: string | null): string | null {
    if (!hora) return null;
    const h = hora.trim();
    if (this.TIME_RE_HHMMSS.test(h)) return h;
    if (this.TIME_RE_HHMM.test(h)) return `${h}:00`;
    return null; // formato inválido
  }

  /** true si fecha (y hora si viene) es en el pasado */
  private static isPast(fecha: string, hora?: string | null): boolean {
    // validar formato básico
    if (!this.DATE_RE.test(fecha)) return true;

    // construir Date en local
    if (hora) {
      const hhmmss = this.normalizeTimeToHHMMSS(hora);
      if (!hhmmss) return true;
      const dt = new Date(`${fecha}T${hhmmss}`);
      if (Number.isNaN(dt.getTime())) return true;
      return dt.getTime() < Date.now();
    } else {
      // comparar solo por día: fecha >= hoy
      const [y, m, d] = fecha.split('-').map(Number);
      const candidate = new Date(y, m - 1, d, 0, 0, 0, 0);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      if (Number.isNaN(candidate.getTime())) return true;
      return candidate.getTime() < today.getTime();
    }
  }

  // ----- Sanitizar -----
  static sanitizarDatos<T extends CrearEventoRequest | ActualizarEventoRequest>(data: T): T {
    const sanitized: any = { ...data };

    if (sanitized.nombre !== undefined && sanitized.nombre !== null) {
      sanitized.nombre = String(sanitized.nombre).trim();
    }
    if (sanitized.descripcion !== undefined) {
      sanitized.descripcion = sanitized.descripcion === null ? null : String(sanitized.descripcion).trim();
      if (sanitized.descripcion === '') sanitized.descripcion = null;
    }
    if (sanitized.fecha !== undefined && sanitized.fecha !== null) {
      sanitized.fecha = String(sanitized.fecha).trim();
    }
    if (sanitized.hora !== undefined) {
      const norm = this.normalizeTimeToHHMMSS(sanitized.hora);
      // si venía string vacío lo normalizamos a null; si formato inválido preservamos original para que el validador lo marque
      sanitized.hora = sanitized.hora ? (norm ?? sanitized.hora) : null;
    }
    if (sanitized.activo !== undefined) {
      sanitized.activo = Boolean(sanitized.activo);
    }

    return sanitized;
  }

  // ----- Crear -----
  static validarCrearEvento(data: CrearEventoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // nombre (puedes conservar tus reglas de longitud si quieres)
    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre del evento es requerido');
    } else if (data.nombre.length > 100) {
      errors.push('El nombre del evento no puede exceder 100 caracteres');
    }

    // descripción opcional
    if (data.descripcion && data.descripcion.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    // fecha obligatoria con formato YYYY-MM-DD
    if (!data.fecha || data.fecha.trim().length === 0) {
      errors.push('La fecha del evento es requerida');
    } else if (!this.DATE_RE.test(data.fecha)) {
      errors.push('La fecha debe estar en formato YYYY-MM-DD');
    }

    // hora OPCIONAL (acepta HH:mm o HH:mm:ss)
    if (data.hora) {
      const norm = this.normalizeTimeToHHMMSS(data.hora);
      if (!norm) errors.push('La hora debe estar en formato HH:MM o HH:MM:SS (24 horas)');
    }

    // regla de negocio: no permitir pasado
    if (data.fecha && this.isPast(data.fecha, data.hora ?? null)) {
      errors.push('La fecha (y hora si aplica) no puede estar en el pasado');
    }

    return { valid: errors.length === 0, errors };
  }

  // ----- Actualizar -----
  static validarActualizarEvento(data: ActualizarEventoRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.nombre !== undefined) {
      if (data.nombre.trim().length === 0) {
        errors.push('El nombre del evento no puede estar vacío');
      } else if (data.nombre.length > 100) {
        errors.push('El nombre del evento no puede exceder 100 caracteres');
      }
    }

    if (data.descripcion !== undefined && data.descripcion && data.descripcion.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    if (data.fecha !== undefined) {
      if (!this.DATE_RE.test(String(data.fecha))) {
        errors.push('La fecha debe estar en formato YYYY-MM-DD');
      }
    }

    if (data.hora !== undefined && data.hora !== null) {
      const norm = this.normalizeTimeToHHMMSS(String(data.hora));
      if (!norm) errors.push('La hora debe estar en formato HH:MM o HH:MM:SS (24 horas)');
    }

    // si en el update viene fecha (y/o hora), validar no pasado
    const fechaToCheck = data.fecha;
    const horaToCheck = data.hora ?? null;
    if (fechaToCheck !== undefined) {
      if (this.isPast(String(fechaToCheck), horaToCheck as string | null)) {
        errors.push('La fecha (y hora si aplica) no puede estar en el pasado');
      }
    }

    // activo opcional booleano
    if (data.activo !== undefined && typeof data.activo !== 'boolean') {
      errors.push('El campo activo debe ser verdadero o falso');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Compatibilidad: helper usado en algunos endpoints
   * - si hay hora: compara fecha+hora con ahora
   * - si no hay hora: compara solo por fecha (>= hoy)
   */
  static validarFechaFutura(fecha: string, hora?: string | null): boolean {
    return !this.isPast(fecha, hora ?? null);
  }
}
