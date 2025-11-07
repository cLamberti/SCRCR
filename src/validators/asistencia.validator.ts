export type ValidationIssue = {
  field: "id_asociado" | "id_actividad" | "fecha_asistencia";
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

export function validateRegistroAsistenciaInput(
  input: {
    id_asociado: number;
    id_actividad: number;
    fecha_asistencia: string;
  },
  opts?: { forbidFuture?: boolean }
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(input.id_asociado) || input.id_asociado <= 0) {
    issues.push({ field: "id_asociado", message: "id_asociado debe ser un número positivo." });
  }

  if (!Number.isFinite(input.id_actividad) || input.id_actividad <= 0) {
    issues.push({ field: "id_actividad", message: "id_actividad debe ser un número positivo." });
  }

  if (!input.fecha_asistencia || typeof input.fecha_asistencia !== "string") {
    issues.push({ field: "fecha_asistencia", message: "fecha_asistencia es requerida." });
  } else if (!isValidDateYYYYMMDD(input.fecha_asistencia)) {
    issues.push({ field: "fecha_asistencia", message: "fecha_asistencia debe tener formato YYYY-MM-DD y ser válida." });
  } else if (opts?.forbidFuture) {
    const today = new Date(); today.setHours(0,0,0,0);
    const [y, m, d] = input.fecha_asistencia.split("-").map(Number);
    const candidate = new Date(y, m - 1, d); candidate.setHours(0,0,0,0);
    if (candidate > today) {
      issues.push({ field: "fecha_asistencia", message: "fecha_asistencia no puede ser futura." });
    }
  }

  return { ok: issues.length === 0, issues };
}
