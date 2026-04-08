import { describe, expect, it } from 'vitest';
import {
  validateAprobarRechazarInput,
  validateCrearPermisoInput,
} from '@/validators/permiso.validator';

describe('PermisoValidator - Pruebas Automatizadas Backend', () => {
  it('1. Debe validar correctamente una solicitud de permiso válida', () => {
    const result = validateCrearPermisoInput({
      fechaInicio: '2026-04-10',
      fechaFin: '2026-04-12',
      motivo: 'Consulta médica',
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('2. Debe rechazar una solicitud con rango de fechas inválido', () => {
    const result = validateCrearPermisoInput({
      fechaInicio: '2026-04-12',
      fechaFin: '2026-04-10',
      motivo: 'Viaje',
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'fechaFin')).toBe(true);
  });

  it('3. Debe rechazar estado inválido en aprobación o rechazo', () => {
    const result = validateAprobarRechazarInput({ estado: 'PENDIENTE' });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'estado')).toBe(true);
  });
});
