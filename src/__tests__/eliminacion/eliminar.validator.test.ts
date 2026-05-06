import { describe, expect, it } from 'vitest';
import { DeleteAsociadoValidator } from '@/validators/asociado.validator';

describe('Validator Eliminación de Asociados', () => {
  it('debe aceptar un ID válido', () => {
    const result = DeleteAsociadoValidator.validar({
      id: '1',
    });

    expect(result.valid).toBe(true);
    expect(result.id).toBe(1);
    expect(result.permanente).toBe(false);
  });

  it('debe rechazar un ID vacío', () => {
    const result = DeleteAsociadoValidator.validar({
      id: '',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('El ID debe ser un número');
  });

  it('debe rechazar un ID que no sea número', () => {
    const result = DeleteAsociadoValidator.validar({
      id: 'abc',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('El ID debe ser un número');
  });

  it('debe rechazar un ID menor o igual a cero', () => {
    const result = DeleteAsociadoValidator.validar({
      id: '0',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('El ID debe ser un número');
  });

  it('debe detectar eliminación permanente cuando permanente=true', () => {
    const result = DeleteAsociadoValidator.validar({
      id: '1',
      permanente: 'true',
    });

    expect(result.valid).toBe(true);
    expect(result.id).toBe(1);
    expect(result.permanente).toBe(true);
  });
});