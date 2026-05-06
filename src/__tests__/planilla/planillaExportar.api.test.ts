import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const obtenerPorIdMock = vi.fn();

vi.mock("@/dao/empleado.dao", () => ({
  PlanillaDAO: vi.fn().mockImplementation(function () {
    return {
      obtenerPorId: obtenerPorIdMock,
    };
  }),
}));

describe("Planilla Exportar API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe exportar una planilla correctamente en formato Excel", async () => {
    const planilla = {
      id: 1,
      mes: 5,
      anio: 2026,
      estado: "borrador",
      fechaGeneracion: "2026-05-08T00:00:00.000Z",
      totalAPagar: 300000,
      lineas: [
        {
          empleadoNombre: "Juan Pérez",
          empleadoCedula: "123456789",
          empleadoPuesto: "Administrador",
          empleadoCuentaBancaria: "CR123",
          salarioBase: 300000,
          diasTrabajados: 30,
          diasAusentes: 0,
          diasVacaciones: 0,
          diasIncapacidad: 0,
          montoAPagar: 300000,
        },
      ],
    };

    obtenerPorIdMock.mockResolvedValue(planilla);

    const { GET } = await import("@/app/api/planilla/[id]/exportar/route");

    const response = await GET(
      new NextRequest("http://localhost/api/planilla/1/exportar"),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const buffer = await response.arrayBuffer();

    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("debe retornar 404 si la planilla no existe", async () => {
    obtenerPorIdMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/planilla/[id]/exportar/route");

    const response = await GET(
      new NextRequest("http://localhost/api/planilla/999/exportar"),
      { params: Promise.resolve({ id: "999" }) }
    );

    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Planilla no encontrada.");
  });

  it("debe retornar 500 si ocurre un error al exportar", async () => {
    obtenerPorIdMock.mockRejectedValue(new Error("Error de base de datos"));

    const { GET } = await import("@/app/api/planilla/[id]/exportar/route");

    const response = await GET(
      new NextRequest("http://localhost/api/planilla/1/exportar"),
      { params: Promise.resolve({ id: "1" }) }
    );

    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Error al exportar la planilla.");
  });
});