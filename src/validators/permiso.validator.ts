export type ValidationIssue = {
  field: string;
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

export function validateCrearPermisoInput(input: any): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.fechaInicio || typeof input.fechaInicio !== "string") {
    issues.push({ field: "fechaInicio", message: "La fecha de inicio es requerida." });
  } else if (!isValidDateYYYYMMDD(input.fechaInicio)) {
    issues.push({ field: "fechaInicio", message: "Formato de fecha de inicio inválido (YYYY-MM-DD)." });
  }

  if (!input.fechaFin || typeof input.fechaFin !== "string") {
    issues.push({ field: "fechaFin", message: "La fecha de fin es requerida." });
  } else if (!isValidDateYYYYMMDD(input.fechaFin)) {
    issues.push({ field: "fechaFin", message: "Formato de fecha de fin inválido (YYYY-MM-DD)." });
  }

  if (isValidDateYYYYMMDD(input.fechaInicio) && isValidDateYYYYMMDD(input.fechaFin)) {
    const inicio = new Date(input.fechaInicio);
    const fin = new Date(input.fechaFin);
    if (inicio > fin) {
      issues.push({ field: "fechaFin", message: "La fecha de fin no puede ser anterior a la fecha de inicio." });
    }
  }

  if (!input.motivo || typeof input.motivo !== "string" || input.motivo.trim().length === 0) {
    issues.push({ field: "motivo", message: "El motivo es requerido." });
  }

  return { ok: issues.length === 0, issues };
}

export function validateAprobarRechazarInput(input: any): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.estado || (input.estado !== "APROBADO" && input.estado !== "RECHAZADO")) {
    issues.push({ field: "estado", message: "El estado debe ser APROBADO o RECHAZADO." });
  }

  return { ok: issues.length === 0, issues };
}
