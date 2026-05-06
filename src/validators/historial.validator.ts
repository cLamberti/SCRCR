import { ConsultaHistorialRequest, TipoRegistroHistorial } from '@/dto/historial.dto';

export type ValidationIssue = {
  field: "personaId" | "tipoPersona" | "fechaDesde" | "fechaHasta" | "tipoRegistro";
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateYYYYMMDD(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function validateConsultaHistorialInput(
  input: any
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const personaId = Number(input.personaId);
  if (!Number.isFinite(personaId) || personaId <= 0) {
    issues.push({ field: "personaId", message: "personaId debe ser un número entero positivo." });
  }

  const tiposValidos = ['usuario', 'asociado', 'congregado'];
  if (!input.tipoPersona || !tiposValidos.includes(input.tipoPersona)) {
    issues.push({ field: "tipoPersona", message: "tipoPersona debe ser usuario, asociado o congregado." });
  }

  if (input.fechaDesde) {
    if (!isValidDateYYYYMMDD(input.fechaDesde)) {
      issues.push({ field: "fechaDesde", message: "fechaDesde debe tener formato YYYY-MM-DD y ser válida." });
    }
  }

  if (input.fechaHasta) {
    if (!isValidDateYYYYMMDD(input.fechaHasta)) {
      issues.push({ field: "fechaHasta", message: "fechaHasta debe tener formato YYYY-MM-DD y ser válida." });
    }
  }

  if (input.fechaDesde && input.fechaHasta && isValidDateYYYYMMDD(input.fechaDesde) && isValidDateYYYYMMDD(input.fechaHasta)) {
    if (new Date(input.fechaDesde) > new Date(input.fechaHasta)) {
      issues.push({ field: "fechaDesde", message: "fechaDesde no puede ser mayor que fechaHasta." });
    }
  }

  const tiposRegistroValidos = ['todos', 'asistencia', 'permiso', 'modificacion'];
  if (input.tipoRegistro && !tiposRegistroValidos.includes(input.tipoRegistro)) {
    issues.push({ field: "tipoRegistro", message: "tipoRegistro es inválido." });
  }

  return { ok: issues.length === 0, issues };
}
