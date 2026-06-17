import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const obtenerTodosMock = vi.fn();
const crearPeriodoMock = vi.fn();
const obtenerActivosMock = vi.fn();
const obtenerPorIdMock = vi.fn();
const cerrarPeriodoMock = vi.fn();

vi.mock("@/dao/empleado.dao", () => ({
  PlanillaDAO: vi.fn().mockImplementation(function () {
    return {
      obtenerTodos: obtenerTodosMock,
      crearPeriodo: crearPeriodoMock,
      obtenerPorId: obtenerPorIdMock,
      cerrarPeriodo: cerrarPeriodoMock,
    };
  }),
  EmpleadoDAO: vi.fn().mockImplementation(function () {
    return {
      obtenerActivos: obtenerActivosMock,
    };
  }),
}));

function createPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/planilla", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("Planilla API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener todas las planillas", async () => {
    obtenerTodosMock.mockResolvedValue([
      {
        id: 1,
        mes: 5,
        anio: 2026,
        estado: "borrador",
        totalAPagar: 300000,
      },
    ]);

    const { GET } = await import("@/app/api/planilla/route");

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it("debe crear una planilla correctamente", async () => {
    const body = {
      mes: 5,
      anio: 2026,
      lineas: [
        {
          empleadoId: 1,
          diasAusentes: 0,
          diasVacaciones: 0,
          diasIncapacidad: 0,
        },
      ],
    };

    const empleados = [
      {
        id: 1,
        nombre: "Juan Pérez",
        cedula: "123456789",
        puesto: "Administrador",
        salarioBase: 300000,
        estado: 1,
      },
    ];

    const planillaCreada = {
      id: 1,
      mes: 5,
      anio: 2026,
      estado: "borrador",
      totalAPagar: 300000,
    };

    obtenerActivosMock.mockResolvedValue(empleados);
    crearPeriodoMock.mockResolvedValue(planillaCreada);

    const { POST } = await import("@/app/api/planilla/route");

    const response = await POST(createPostRequest(body));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Planilla generada exitosamente.");
    expect(json.data).toEqual(planillaCreada);
  });

  it("debe retornar 400 si el mes es inválido", async () => {
    const body = {
      mes: 13,
      anio: 2026,
      lineas: [
        {
          empleadoId: 1,
          diasAusentes: 0,
          diasVacaciones: 0,
          diasIncapacidad: 0,
        },
      ],
    };

    const { POST } = await import("@/app/api/planilla/route");

    const response = await POST(createPostRequest(body));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("debe retornar 400 si un empleado no existe o está inactivo", async () => {
    const body = {
      mes: 5,
      anio: 2026,
      lineas: [
        {
          empleadoId: 99,
          diasAusentes: 0,
          diasVacaciones: 0,
          diasIncapacidad: 0,
        },
      ],
    };

    obtenerActivosMock.mockResolvedValue([
      {
        id: 1,
        nombre: "Juan Pérez",
        cedula: "123456789",
        puesto: "Administrador",
        salarioBase: 300000,
        estado: 1,
      },
    ]);

    const { POST } = await import("@/app/api/planilla/route");

    const response = await POST(createPostRequest(body));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toBe(
      "Uno o más empleados no existen o están inactivos."
    );
  });

  it("debe retornar 409 si ya existe una planilla para ese mes y año", async () => {
    const body = {
      mes: 5,
      anio: 2026,
      lineas: [
        {
          empleadoId: 1,
          diasAusentes: 0,
          diasVacaciones: 0,
          diasIncapacidad: 0,
        },
      ],
    };

    obtenerActivosMock.mockResolvedValue([
      {
        id: 1,
        nombre: "Juan Pérez",
        cedula: "123456789",
        puesto: "Administrador",
        salarioBase: 300000,
        estado: 1,
      },
    ]);

    crearPeriodoMock.mockRejectedValue({ code: "P2002" });

    const { POST } = await import("@/app/api/planilla/route");

    const response = await POST(createPostRequest(body));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Ya existe una planilla para ese mes y año.");
  });

  it("debe obtener una planilla por ID", async () => {
    const planilla = {
      id: 1,
      mes: 5,
      anio: 2026,
      estado: "borrador",
      totalAPagar: 300000,
    };

    obtenerPorIdMock.mockResolvedValue(planilla);

    const { GET } = await import("@/app/api/planilla/[id]/route");

    const response = await GET(
      new NextRequest("http://localhost/api/planilla/1"),
      { params: Promise.resolve({ id: "1" }) }
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(planilla);
  });

  it("debe retornar 404 si la planilla no existe", async () => {
    obtenerPorIdMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/planilla/[id]/route");

    const response = await GET(
      new NextRequest("http://localhost/api/planilla/999"),
      { params: Promise.resolve({ id: "999" }) }
    );

    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Planilla no encontrada.");
  });

  it("debe cerrar una planilla correctamente", async () => {
    cerrarPeriodoMock.mockResolvedValue(undefined);

    const { PATCH } = await import("@/app/api/planilla/[id]/route");

    const response = await PATCH(
      new NextRequest("http://localhost/api/planilla/1", {
        method: "PATCH",
      }),
      { params: Promise.resolve({ id: "1" }) }
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Planilla cerrada exitosamente.");
  });
});