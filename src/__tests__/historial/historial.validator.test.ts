import { describe, expect, it } from "vitest";
import {
  isValidDateYYYYMMDD,
  validateConsultaHistorialInput,
} from "@/validators/historial.validator";

describe("Historial - Validator", () => {
  it("debe aceptar una consulta válida", () => {
    const result = validateConsultaHistorialInput({
      personaId: "1",
      tipoPersona: "asociado",
      fechaDesde: "2026-05-01",
      fechaHasta: "2026-05-31",
      tipoRegistro: "asistencia",
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("debe rechazar personaId inválido", () => {
    const result = validateConsultaHistorialInput({
      personaId: "abc",
      tipoPersona: "asociado",
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      field: "personaId",
      message: "personaId debe ser un número entero positivo.",
    });
  });

  it("debe rechazar tipoPersona inválido", () => {
    const result = validateConsultaHistorialInput({
      personaId: "1",
      tipoPersona: "cliente",
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      field: "tipoPersona",
      message: "tipoPersona debe ser usuario, asociado o congregado.",
    });
  });

  it("debe rechazar fechaDesde inválida", () => {
    const result = validateConsultaHistorialInput({
      personaId: "1",
      tipoPersona: "asociado",
      fechaDesde: "2026-02-31",
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      field: "fechaDesde",
      message: "fechaDesde debe tener formato YYYY-MM-DD y ser válida.",
    });
  });

  it("debe rechazar fechaHasta inválida", () => {
    const result = validateConsultaHistorialInput({
      personaId: "1",
      tipoPersona: "asociado",
      fechaHasta: "05/31/2026",
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      field: "fechaHasta",
      message: "fechaHasta debe tener formato YYYY-MM-DD y ser válida.",
    });
  });

  it("debe rechazar cuando fechaDesde es mayor que fechaHasta", () => {
    const result = validateConsultaHistorialInput({
      personaId: "1",
      tipoPersona: "asociado",
      fechaDesde: "2026-06-01",
      fechaHasta: "2026-05-01",
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      field: "fechaDesde",
      message: "fechaDesde no puede ser mayor que fechaHasta.",
    });
  });

  it("debe rechazar tipoRegistro inválido", () => {
    const result = validateConsultaHistorialInput({
      personaId: "1",
      tipoPersona: "asociado",
      tipoRegistro: "otro",
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      field: "tipoRegistro",
      message: "tipoRegistro es inválido.",
    });
  });

  it("debe validar correctamente fechas en formato YYYY-MM-DD", () => {
    expect(isValidDateYYYYMMDD("2026-05-08")).toBe(true);
    expect(isValidDateYYYYMMDD("2026-02-31")).toBe(false);
    expect(isValidDateYYYYMMDD("08-05-2026")).toBe(false);
  });
});