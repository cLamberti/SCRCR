import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actaAsociacionFindMany: vi.fn(),
  actaAsociacionFindUnique: vi.fn(),
  actaAsociacionCreate: vi.fn(),
  actaAsociacionUpdate: vi.fn(),
  actaAsociacionDelete: vi.fn(),
  asistenciaActaAsociacionFindMany: vi.fn(),
  asistenciaActaAsociacionCreateMany: vi.fn(),
  asistenciaActaAsociacionUpsert: vi.fn(),
  actaJuntaDirectivaFindMany: vi.fn(),
  actaJuntaDirectivaFindUnique: vi.fn(),
  actaJuntaDirectivaCreate: vi.fn(),
  actaJuntaDirectivaUpdate: vi.fn(),
  actaJuntaDirectivaDelete: vi.fn(),
  asistenciaActaJDFindMany: vi.fn(),
  asistenciaActaJDCreateMany: vi.fn(),
  asistenciaActaJDUpsert: vi.fn(),
  asociadoFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    actaAsociacion: {
      findMany: mocks.actaAsociacionFindMany,
      findUnique: mocks.actaAsociacionFindUnique,
      create: mocks.actaAsociacionCreate,
      update: mocks.actaAsociacionUpdate,
      delete: mocks.actaAsociacionDelete,
    },
    asistenciaActaAsociacion: {
      findMany: mocks.asistenciaActaAsociacionFindMany,
      createMany: mocks.asistenciaActaAsociacionCreateMany,
      upsert: mocks.asistenciaActaAsociacionUpsert,
    },
    actaJuntaDirectiva: {
      findMany: mocks.actaJuntaDirectivaFindMany,
      findUnique: mocks.actaJuntaDirectivaFindUnique,
      create: mocks.actaJuntaDirectivaCreate,
      update: mocks.actaJuntaDirectivaUpdate,
      delete: mocks.actaJuntaDirectivaDelete,
    },
    asistenciaActaJD: {
      findMany: mocks.asistenciaActaJDFindMany,
      createMany: mocks.asistenciaActaJDCreateMany,
      upsert: mocks.asistenciaActaJDUpsert,
    },
    asociado: {
      findMany: mocks.asociadoFindMany,
    },
  },
}));

describe("Acta — DAO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Asociación", () => {
    it("listarActasAsociacion ordena y calcula presentes/ausentes (ignora justificado)", async () => {
      const fecha = new Date("2026-05-01T12:00:00.000Z");
      const createdAt = new Date("2026-05-01T08:00:00.000Z");
      const updatedAt = new Date("2026-05-02T08:00:00.000Z");

      mocks.actaAsociacionFindMany.mockResolvedValue([
        {
          id: 1,
          fecha,
          tipoSesion: "ordinaria",
          urlActa: null,
          nombreArchivo: null,
          createdAt,
          updatedAt,
          asistencias: [
            { estado: "presente" },
            { estado: "presente" },
            { estado: "ausente" },
            { estado: "justificado" },
          ],
        },
      ]);

      const dao = await import("@/dao/acta.dao");
      const rows = await dao.listarActasAsociacion();

      expect(rows).toHaveLength(1);
      expect(rows[0].totalAsistentes).toBe(2);
      expect(rows[0].totalAusentes).toBe(1);
      expect(rows[0].fecha).toBe("2026-05-01");
      expect(rows[0].tipoSesion).toBe("ordinaria");
    });

    it("obtenerActaAsociacion devuelve null si no existe", async () => {
      mocks.actaAsociacionFindUnique.mockResolvedValue(null);
      const dao = await import("@/dao/acta.dao");
      expect(await dao.obtenerActaAsociacion(999)).toBeNull();
    });

    it("obtenerActaAsociacion mapea acta con totales", async () => {
      const fecha = new Date("2026-03-15");
      const createdAt = new Date("2026-03-15T10:00:00.000Z");
      const updatedAt = new Date("2026-03-15T10:00:00.000Z");
      mocks.actaAsociacionFindUnique.mockResolvedValue({
        id: 5,
        fecha,
        tipoSesion: "extraordinaria",
        urlActa: "https://x/blob",
        nombreArchivo: "a.pdf",
        createdAt,
        updatedAt,
        asistencias: [{ estado: "presente" }],
      });

      const dao = await import("@/dao/acta.dao");
      const row = await dao.obtenerActaAsociacion(5);

      expect(row).not.toBeNull();
      expect(row!.id).toBe(5);
      expect(row!.totalAsistentes).toBe(1);
      expect(row!.totalAusentes).toBe(0);
      expect(row!.nombreArchivo).toBe("a.pdf");
    });

    it("crearActaAsociacion crea filas de asistencia por asociado activo", async () => {
      const fecha = new Date("2026-06-01");
      const createdAt = new Date("2026-06-01T10:00:00.000Z");
      const updatedAt = createdAt;

      mocks.actaAsociacionCreate.mockResolvedValue({
        id: 10,
        fecha,
        tipoSesion: "ordinaria",
        urlActa: null,
        nombreArchivo: null,
        createdAt,
        updatedAt,
      });
      mocks.asociadoFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mocks.asistenciaActaAsociacionCreateMany.mockResolvedValue({ count: 2 });

      const dao = await import("@/dao/acta.dao");
      const result = await dao.crearActaAsociacion({
        fecha: "2026-06-01",
        tipoSesion: "ordinaria",
      });

      expect(mocks.asistenciaActaAsociacionCreateMany).toHaveBeenCalledWith({
        data: [
          { actaId: 10, asociadoId: 1, estado: "ausente" },
          { actaId: 10, asociadoId: 2, estado: "ausente" },
        ],
        skipDuplicates: true,
      });
      expect(result.totalAsistentes).toBe(0);
      expect(result.totalAusentes).toBe(2);
      expect(result.id).toBe(10);
    });

    it("crearActaAsociacion no llama createMany si no hay asociados activos", async () => {
      const fecha = new Date("2026-06-02");
      const createdAt = new Date("2026-06-02T10:00:00.000Z");
      mocks.actaAsociacionCreate.mockResolvedValue({
        id: 11,
        fecha,
        tipoSesion: "ordinaria",
        urlActa: null,
        nombreArchivo: null,
        createdAt,
        updatedAt: createdAt,
      });
      mocks.asociadoFindMany.mockResolvedValue([]);

      const dao = await import("@/dao/acta.dao");
      const result = await dao.crearActaAsociacion({
        fecha: "2026-06-02",
        tipoSesion: "ordinaria",
      });

      expect(mocks.asistenciaActaAsociacionCreateMany).not.toHaveBeenCalled();
      expect(result.totalAusentes).toBe(0);
    });

    it("actualizarActaAsociacion devuelve null si el id no existe", async () => {
      mocks.actaAsociacionFindUnique.mockResolvedValue(null);
      const dao = await import("@/dao/acta.dao");
      const out = await dao.actualizarActaAsociacion(1, { tipoSesion: "ordinaria" });
      expect(out).toBeNull();
      expect(mocks.actaAsociacionUpdate).not.toHaveBeenCalled();
    });

    it("actualizarActaAsociacion aplica solo campos definidos", async () => {
      const fecha = new Date("2026-01-01");
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      const updatedAt = new Date("2026-01-02T00:00:00.000Z");

      mocks.actaAsociacionFindUnique.mockResolvedValue({ id: 3 });
      mocks.actaAsociacionUpdate.mockResolvedValue({
        id: 3,
        fecha,
        tipoSesion: "extraordinaria",
        urlActa: null,
        nombreArchivo: "n.pdf",
        createdAt,
        updatedAt,
        asistencias: [{ estado: "ausente" }],
      });

      const dao = await import("@/dao/acta.dao");
      const out = await dao.actualizarActaAsociacion(3, {
        tipoSesion: "extraordinaria",
        nombreArchivo: "n.pdf",
      });

      expect(mocks.actaAsociacionUpdate).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { tipoSesion: "extraordinaria", nombreArchivo: "n.pdf" },
        include: { asistencias: { select: { estado: true } } },
      });
      expect(out!.totalAusentes).toBe(1);
      expect(out!.totalAsistentes).toBe(0);
    });

    it("eliminarActaAsociacion devuelve false si no existe", async () => {
      mocks.actaAsociacionFindUnique.mockResolvedValue(null);
      const dao = await import("@/dao/acta.dao");
      expect(await dao.eliminarActaAsociacion(0)).toBe(false);
      expect(mocks.actaAsociacionDelete).not.toHaveBeenCalled();
    });

    it("eliminarActaAsociacion borra y devuelve true", async () => {
      mocks.actaAsociacionFindUnique.mockResolvedValue({ id: 1 });
      mocks.actaAsociacionDelete.mockResolvedValue({});
      const dao = await import("@/dao/acta.dao");
      expect(await dao.eliminarActaAsociacion(1)).toBe(true);
      expect(mocks.actaAsociacionDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("obtenerAsistenciasAsociacion mapea nombre del asociado", async () => {
      mocks.asistenciaActaAsociacionFindMany.mockResolvedValue([
        {
          id: 1,
          actaId: 2,
          asociadoId: 9,
          estado: "justificado",
          justificacion: "enfermedad",
          asociado: { nombreCompleto: "María López" },
        },
      ]);

      const dao = await import("@/dao/acta.dao");
      const list = await dao.obtenerAsistenciasAsociacion(2);

      expect(list).toHaveLength(1);
      expect(list[0].nombreAsociado).toBe("María López");
      expect(list[0].estado).toBe("justificado");
      expect(list[0].justificacion).toBe("enfermedad");
    });

    it("registrarAsistenciaAsociacion hace upsert y devuelve DTO", async () => {
      mocks.asistenciaActaAsociacionUpsert.mockResolvedValue({
        id: 7,
        actaId: 2,
        asociadoId: 9,
        estado: "presente",
        justificacion: null,
        asociado: { nombreCompleto: "Pedro" },
      });

      const dao = await import("@/dao/acta.dao");
      const row = await dao.registrarAsistenciaAsociacion(2, {
        asociadoId: 9,
        estado: "presente",
      });

      expect(mocks.asistenciaActaAsociacionUpsert).toHaveBeenCalled();
      expect(row.nombreAsociado).toBe("Pedro");
      expect(row.actaId).toBe(2);
    });
  });

  describe("Junta Directiva", () => {
    it("listarActasJD calcula totales igual que asociación", async () => {
      const fecha = new Date("2026-04-01");
      const createdAt = new Date("2026-04-01T00:00:00.000Z");
      const updatedAt = createdAt;
      mocks.actaJuntaDirectivaFindMany.mockResolvedValue([
        {
          id: 1,
          fecha,
          tipoSesion: "ordinaria",
          urlActa: null,
          nombreArchivo: null,
          createdAt,
          updatedAt,
          asistencias: [{ estado: "ausente" }],
        },
      ]);

      const dao = await import("@/dao/acta.dao");
      const rows = await dao.listarActasJD();
      expect(rows[0].totalAusentes).toBe(1);
      expect(rows[0].totalAsistentes).toBe(0);
    });

    it("crearActaJD prepuebla solo miembros de JD activos", async () => {
      const fecha = new Date("2026-07-01");
      const createdAt = new Date("2026-07-01T00:00:00.000Z");
      mocks.actaJuntaDirectivaCreate.mockResolvedValue({
        id: 20,
        fecha,
        tipoSesion: "ordinaria",
        urlActa: null,
        nombreArchivo: null,
        createdAt,
        updatedAt: createdAt,
      });
      mocks.asociadoFindMany.mockResolvedValue([{ id: 5 }]);

      const dao = await import("@/dao/acta.dao");
      await dao.crearActaJD({ fecha: "2026-07-01", tipoSesion: "ordinaria" });

      expect(mocks.asociadoFindMany).toHaveBeenCalledWith({
        where: { perteneceJuntaDirectiva: true, estado: 1 },
        select: { id: true },
      });
      expect(mocks.asistenciaActaJDCreateMany).toHaveBeenCalledWith({
        data: [{ actaId: 20, asociadoId: 5, estado: "ausente" }],
        skipDuplicates: true,
      });
    });

    it("obtenerActaJD devuelve null si no hay registro", async () => {
      mocks.actaJuntaDirectivaFindUnique.mockResolvedValue(null);
      const dao = await import("@/dao/acta.dao");
      expect(await dao.obtenerActaJD(0)).toBeNull();
    });

    it("actualizarActaJD devuelve null si no existe", async () => {
      mocks.actaJuntaDirectivaFindUnique.mockResolvedValue(null);
      const dao = await import("@/dao/acta.dao");
      expect(await dao.actualizarActaJD(1, { fecha: "2026-01-01" })).toBeNull();
    });

    it("eliminarActaJD devuelve false sin fila", async () => {
      mocks.actaJuntaDirectivaFindUnique.mockResolvedValue(null);
      const dao = await import("@/dao/acta.dao");
      expect(await dao.eliminarActaJD(99)).toBe(false);
    });

    it("obtenerAsistenciasJD delega en findMany", async () => {
      mocks.asistenciaActaJDFindMany.mockResolvedValue([]);
      const dao = await import("@/dao/acta.dao");
      const r = await dao.obtenerAsistenciasJD(3);
      expect(r).toEqual([]);
      expect(mocks.asistenciaActaJDFindMany).toHaveBeenCalledWith({
        where: { actaId: 3 },
        include: { asociado: { select: { nombreCompleto: true } } },
        orderBy: { asociado: { nombreCompleto: "asc" } },
      });
    });

    it("registrarAsistenciaJD hace upsert", async () => {
      mocks.asistenciaActaJDUpsert.mockResolvedValue({
        id: 1,
        actaId: 1,
        asociadoId: 2,
        estado: "ausente",
        justificacion: "x",
        asociado: { nombreCompleto: "JD Miembro" },
      });

      const dao = await import("@/dao/acta.dao");
      const row = await dao.registrarAsistenciaJD(1, {
        asociadoId: 2,
        estado: "ausente",
        justificacion: "x",
      });

      expect(row.nombreAsociado).toBe("JD Miembro");
      expect(mocks.asistenciaActaJDUpsert).toHaveBeenCalled();
    });
  });
});
