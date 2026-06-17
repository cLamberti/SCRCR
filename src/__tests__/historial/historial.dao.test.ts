import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usuarioFindUnique: vi.fn(),
  asociadoFindUnique: vi.fn(),
  congregadoFindUnique: vi.fn(),
  reporteAsistenciaFindMany: vi.fn(),
  auditoriaFindMany: vi.fn(),
  permisoFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usuario: {
      findUnique: mocks.usuarioFindUnique,
    },
    asociado: {
      findUnique: mocks.asociadoFindUnique,
    },
    congregado: {
      findUnique: mocks.congregadoFindUnique,
    },
    reporteAsistencia: {
      findMany: mocks.reporteAsistenciaFindMany,
    },
    auditoria: {
      findMany: mocks.auditoriaFindMany,
    },
    permiso: {
      findMany: mocks.permisoFindMany,
    },
  },
}));

describe("Historial - DAO", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.usuarioFindUnique.mockResolvedValue(null);
    mocks.asociadoFindUnique.mockResolvedValue(null);
    mocks.congregadoFindUnique.mockResolvedValue(null);
    mocks.reporteAsistenciaFindMany.mockResolvedValue([]);
    mocks.auditoriaFindMany.mockResolvedValue([]);
    mocks.permisoFindMany.mockResolvedValue([]);
  });

  it("debe obtener historial completo de un asociado", async () => {
    mocks.asociadoFindUnique.mockResolvedValue({
      id: 1,
      nombreCompleto: "Juan Pérez",
      cedula: "123456789",
    });

    mocks.reporteAsistenciaFindMany.mockResolvedValue([
      {
        id: 1,
        fecha: new Date("2026-05-08"),
        estado: "presente",
        justificacion: null,
        observaciones: null,
        evento: {
          nombre: "Culto",
        },
      },
    ]);

    const { HistorialDAO } = await import("@/dao/historial.dao");

    const dao = new HistorialDAO();

    const result = await dao.obtenerHistorialCompleto({
      personaId: 1,
      tipoPersona: "asociado",
      filtros: {
        tipoRegistro: "asistencia",
      },
    });

    expect(result.persona.id).toBe(1);
    expect(result.persona.nombre).toBe("Juan Pérez");
    expect(result.persona.tipo).toBe("asociado");
    expect(result.historial).toHaveLength(1);
    expect(result.historial[0].tipo).toBe("asistencia");
    expect(result.historial[0].descripcion).toBe("Presente — Culto");
  });

  it("debe devolver persona eliminada si la persona no existe", async () => {
    mocks.asociadoFindUnique.mockResolvedValue(null);
    mocks.reporteAsistenciaFindMany.mockResolvedValue([]);

    const { HistorialDAO } = await import("@/dao/historial.dao");

    const dao = new HistorialDAO();

    const result = await dao.obtenerHistorialCompleto({
      personaId: 999,
      tipoPersona: "asociado",
      filtros: {
        tipoRegistro: "asistencia",
      },
    });

    expect(result.persona.id).toBe(999);
    expect(result.persona.nombre).toBe("Persona Eliminada (ID: 999)");
    expect(result.persona.identificacion).toBe("N/D");
    expect(result.historial).toHaveLength(0);
  });

  it("debe filtrar historial por fechas", async () => {
    mocks.asociadoFindUnique.mockResolvedValue({
      id: 1,
      nombreCompleto: "Juan Pérez",
      cedula: "123456789",
    });

    mocks.reporteAsistenciaFindMany.mockResolvedValue([
      {
        id: 1,
        fecha: new Date("2026-05-08"),
        estado: "presente",
        justificacion: null,
        observaciones: null,
        evento: {
          nombre: "Culto Mayo",
        },
      },
      {
        id: 2,
        fecha: new Date("2026-06-08"),
        estado: "ausente",
        justificacion: null,
        observaciones: null,
        evento: {
          nombre: "Culto Junio",
        },
      },
    ]);

    const { HistorialDAO } = await import("@/dao/historial.dao");

    const dao = new HistorialDAO();

    const result = await dao.obtenerHistorialCompleto({
      personaId: 1,
      tipoPersona: "asociado",
      filtros: {
        tipoRegistro: "asistencia",
        fechaDesde: "2026-05-01",
        fechaHasta: "2026-05-31",
      },
    });

    expect(result.historial).toHaveLength(1);
    expect(result.historial[0].descripcion).toBe("Presente — Culto Mayo");
  });

  it("debe obtener historial de modificaciones desde auditoría", async () => {
    mocks.asociadoFindUnique.mockResolvedValue({
      id: 1,
      nombreCompleto: "Juan Pérez",
      cedula: "123456789",
    });

    mocks.auditoriaFindMany.mockResolvedValue([
      {
        id: 1,
        tabla: "asociados",
        registroId: 1,
        accion: "actualizacion",
        detalles: "Se actualizó el nombre del asociado",
        fecha: new Date("2026-05-08"),
      },
    ]);

    const { HistorialDAO } = await import("@/dao/historial.dao");

    const dao = new HistorialDAO();

    const result = await dao.obtenerHistorialCompleto({
      personaId: 1,
      tipoPersona: "asociado",
      filtros: {
        tipoRegistro: "modificacion",
      },
    });

    expect(result.persona.id).toBe(1);
    expect(result.historial).toHaveLength(1);
    expect(result.historial[0].tipo).toBe("modificacion");
    expect(result.historial[0].descripcion).toBe(
      "Se actualizó el nombre del asociado"
    );
    expect(result.historial[0].estado).toBe("ACTUALIZACION");
  });

  it("debe lanzar error si Prisma falla al obtener la persona", async () => {
    mocks.asociadoFindUnique.mockRejectedValue(
      new Error("Error de base de datos")
    );

    const { HistorialDAO } = await import("@/dao/historial.dao");

    const dao = new HistorialDAO();

    await expect(
      dao.obtenerHistorialCompleto({
        personaId: 1,
        tipoPersona: "asociado",
        filtros: {
          tipoRegistro: "asistencia",
        },
      })
    ).rejects.toThrow("Error al obtener la persona");
  });
});