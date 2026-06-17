import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerHistorialCompletoMock = vi.fn();

vi.mock("@/dao/historial.dao", () => ({
  HistorialDAO: vi.fn().mockImplementation(function () {
    return {
      obtenerHistorialCompleto: obtenerHistorialCompletoMock,
    };
  }),
}));

describe("Historial - Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener el historial correctamente", async () => {
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

    obtenerHistorialCompletoMock.mockResolvedValue(historialMock);

    const { HistorialService } = await import("@/services/historial.service");

    const service = new HistorialService();

    const result = await service.obtenerHistorial({
      personaId: 1,
      tipoPersona: "asociado",
      filtros: {
        tipoRegistro: "asistencia",
      },
    });

    expect(result).toEqual(historialMock);
    expect(obtenerHistorialCompletoMock).toHaveBeenCalledWith({
      personaId: 1,
      tipoPersona: "asociado",
      filtros: {
        tipoRegistro: "asistencia",
      },
    });
  });

  it("debe lanzar error si el DAO falla", async () => {
    obtenerHistorialCompletoMock.mockRejectedValue(
      new Error("Error al obtener historial")
    );

    const { HistorialService } = await import("@/services/historial.service");

    const service = new HistorialService();

    await expect(
      service.obtenerHistorial({
        personaId: 1,
        tipoPersona: "asociado",
      })
    ).rejects.toThrow("Error en HistorialService: Error al obtener historial");
  });
});