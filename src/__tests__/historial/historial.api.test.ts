import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const obtenerHistorialMock = vi.fn();

vi.mock("@/services/historial.service", () => ({
  HistorialService: vi.fn().mockImplementation(function () {
    return {
      obtenerHistorial: obtenerHistorialMock,
    };
  }),
}));

function createGetRequest(url: string) {
  return new NextRequest(url, {
    method: "GET",
  });
}

describe("API Historial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener historial correctamente", async () => {
    const historialMock = {
      persona: {
        id: 1,
        nombre: "Juan Pérez",
        tipo: "asociado",
        identificacion: "123456789",
      },
      historial: [
        {
          id_registro: 1,
          tipo: "asistencia",
          fecha: "2026-05-08",
          descripcion: "Presente — Culto",
          estado: "Presente",
        },
      ],
    };

    obtenerHistorialMock.mockResolvedValue(historialMock);

    const { GET } = await import("@/app/api/historial/route");

    const response = await GET(
      createGetRequest(
        "http://localhost/api/historial?personaId=1&tipoPersona=asociado&tipoRegistro=asistencia"
      )
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(historialMock);
  });

  it("debe retornar 400 si personaId es inválido", async () => {
    const { GET } = await import("@/app/api/historial/route");

    const response = await GET(
      createGetRequest(
        "http://localhost/api/historial?personaId=abc&tipoPersona=asociado"
      )
    );

    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Errores de validación");
  });

  it("debe retornar 400 si tipoPersona es inválido", async () => {
    const { GET } = await import("@/app/api/historial/route");

    const response = await GET(
      createGetRequest(
        "http://localhost/api/historial?personaId=1&tipoPersona=cliente"
      )
    );

    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Errores de validación");
  });

  it("debe retornar 400 si fechaDesde es mayor que fechaHasta", async () => {
    const { GET } = await import("@/app/api/historial/route");

    const response = await GET(
      createGetRequest(
        "http://localhost/api/historial?personaId=1&tipoPersona=asociado&fechaDesde=2026-06-01&fechaHasta=2026-05-01"
      )
    );

    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Errores de validación");
  });

  it("debe retornar 500 si ocurre un error interno", async () => {
    obtenerHistorialMock.mockRejectedValue(new Error("Error inesperado"));

    const { GET } = await import("@/app/api/historial/route");

    const response = await GET(
      createGetRequest(
        "http://localhost/api/historial?personaId=1&tipoPersona=asociado"
      )
    );

    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Error interno del servidor al obtener historial");
  });
});