import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const listarActasAsociacionMock = vi.fn();
const crearActaAsociacionMock = vi.fn();
const obtenerActaAsociacionMock = vi.fn();
const actualizarActaAsociacionMock = vi.fn();
const eliminarActaAsociacionMock = vi.fn();
const obtenerAsistenciasAsociacionMock = vi.fn();
const registrarAsistenciaAsociacionMock = vi.fn();

const listarActasJDMock = vi.fn();
const crearActaJDMock = vi.fn();
const obtenerActaJDMock = vi.fn();
const actualizarActaJDMock = vi.fn();
const eliminarActaJDMock = vi.fn();
const obtenerAsistenciasJDMock = vi.fn();
const registrarAsistenciaJDMock = vi.fn();

vi.mock("@/dao/acta.dao", () => ({
  listarActasAsociacion: listarActasAsociacionMock,
  crearActaAsociacion: crearActaAsociacionMock,
  obtenerActaAsociacion: obtenerActaAsociacionMock,
  actualizarActaAsociacion: actualizarActaAsociacionMock,
  eliminarActaAsociacion: eliminarActaAsociacionMock,
  obtenerAsistenciasAsociacion: obtenerAsistenciasAsociacionMock,
  registrarAsistenciaAsociacion: registrarAsistenciaAsociacionMock,
  listarActasJD: listarActasJDMock,
  crearActaJD: crearActaJDMock,
  obtenerActaJD: obtenerActaJDMock,
  actualizarActaJD: actualizarActaJDMock,
  eliminarActaJD: eliminarActaJDMock,
  obtenerAsistenciasJD: obtenerAsistenciasJDMock,
  registrarAsistenciaJD: registrarAsistenciaJDMock,
}));

function createPostRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function createPutRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

describe("API Actas — Asociación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/actas/asociacion debe listar actas", async () => {
    const actas = [
      {
        id: 1,
        fecha: "2026-05-01T00:00:00.000Z",
        tipoSesion: "ordinaria" as const,
        urlActa: null,
        nombreArchivo: null,
        createdAt: "2026-05-01T00:00:00.000Z",
      },
    ];
    listarActasAsociacionMock.mockResolvedValue(actas);

    const { GET } = await import("@/app/api/actas/asociacion/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(actas);
  });

  it("GET /api/actas/asociacion retorna 500 si el DAO falla", async () => {
    listarActasAsociacionMock.mockRejectedValue(new Error("db"));

    const { GET } = await import("@/app/api/actas/asociacion/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Error al obtener actas.");
  });

  it("POST /api/actas/asociacion crea acta con 201", async () => {
    const creada = {
      id: 1,
      fecha: "2026-05-01",
      tipoSesion: "ordinaria" as const,
      urlActa: "https://blob/x.pdf",
      nombreArchivo: "acta.pdf",
      createdAt: "2026-05-01T00:00:00.000Z",
    };
    crearActaAsociacionMock.mockResolvedValue(creada);

    const { POST } = await import("@/app/api/actas/asociacion/route");
    const response = await POST(
      createPostRequest("http://localhost/api/actas/asociacion", {
        fecha: "2026-05-01",
        tipoSesion: "ordinaria",
        urlActa: "https://blob/x.pdf",
        nombreArchivo: "acta.pdf",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(creada);
    expect(crearActaAsociacionMock).toHaveBeenCalledWith({
      fecha: "2026-05-01",
      tipoSesion: "ordinaria",
      urlActa: "https://blob/x.pdf",
      nombreArchivo: "acta.pdf",
    });
  });

  it("POST /api/actas/asociacion retorna 400 sin fecha o tipoSesion", async () => {
    const { POST } = await import("@/app/api/actas/asociacion/route");
    const response = await POST(
      createPostRequest("http://localhost/api/actas/asociacion", {
        fecha: "",
        tipoSesion: "ordinaria",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Fecha y tipo de sesión son requeridos.");
    expect(crearActaAsociacionMock).not.toHaveBeenCalled();
  });

  it("GET /api/actas/asociacion/[id] retorna acta", async () => {
    const acta = {
      id: 1,
      fecha: "2026-05-01T00:00:00.000Z",
      tipoSesion: "ordinaria" as const,
      urlActa: null,
      nombreArchivo: null,
      createdAt: "2026-05-01T00:00:00.000Z",
    };
    obtenerActaAsociacionMock.mockResolvedValue(acta);

    const { GET } = await import("@/app/api/actas/asociacion/[id]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/actas/asociacion/1"),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(acta);
  });

  it("GET /api/actas/asociacion/[id] retorna 404 si no existe", async () => {
    obtenerActaAsociacionMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/actas/asociacion/[id]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/actas/asociacion/99"),
      { params: Promise.resolve({ id: "99" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe("Acta no encontrada.");
  });

  it("PUT /api/actas/asociacion/[id] actualiza acta", async () => {
    const actualizada = {
      id: 1,
      fecha: "2026-05-02T00:00:00.000Z",
      tipoSesion: "extraordinaria" as const,
      urlActa: null,
      nombreArchivo: null,
      createdAt: "2026-05-01T00:00:00.000Z",
    };
    actualizarActaAsociacionMock.mockResolvedValue(actualizada);

    const { PUT } = await import("@/app/api/actas/asociacion/[id]/route");
    const response = await PUT(
      createPutRequest("http://localhost/api/actas/asociacion/1", {
        tipoSesion: "extraordinaria",
      }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(actualizada);
  });

  it("DELETE /api/actas/asociacion/[id] elimina acta", async () => {
    eliminarActaAsociacionMock.mockResolvedValue(true);

    const { DELETE } = await import("@/app/api/actas/asociacion/[id]/route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/actas/asociacion/1"),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Acta eliminada.");
  });

  it("DELETE /api/actas/asociacion/[id] retorna 404 si no existe", async () => {
    eliminarActaAsociacionMock.mockResolvedValue(false);

    const { DELETE } = await import("@/app/api/actas/asociacion/[id]/route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/actas/asociacion/99"),
      { params: Promise.resolve({ id: "99" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe("Acta no encontrada.");
  });

  it("GET /api/actas/asociacion/[id]/asistencia lista asistencias", async () => {
    const rows = [
      {
        id: 1,
        actaId: 1,
        asociadoId: 10,
        nombreAsociado: "Ana",
        estado: "presente" as const,
        justificacion: null,
      },
    ];
    obtenerAsistenciasAsociacionMock.mockResolvedValue(rows);

    const { GET } = await import(
      "@/app/api/actas/asociacion/[id]/asistencia/route"
    );
    const response = await GET(
      new NextRequest("http://localhost/api/actas/asociacion/1/asistencia"),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(rows);
  });

  it("POST /api/actas/asociacion/[id]/asistencia registra fila", async () => {
    const row = {
      id: 2,
      actaId: 1,
      asociadoId: 10,
      nombreAsociado: "Ana",
      estado: "ausente" as const,
      justificacion: "viaje",
    };
    registrarAsistenciaAsociacionMock.mockResolvedValue(row);

    const { POST } = await import(
      "@/app/api/actas/asociacion/[id]/asistencia/route"
    );
    const response = await POST(
      createPostRequest(
        "http://localhost/api/actas/asociacion/1/asistencia",
        { asociadoId: 10, estado: "ausente", justificacion: "viaje" }
      ),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(row);
  });

  it("POST /api/actas/asociacion/[id]/asistencia retorna 400 sin asociadoId o estado", async () => {
    const { POST } = await import(
      "@/app/api/actas/asociacion/[id]/asistencia/route"
    );
    const response = await POST(
      createPostRequest(
        "http://localhost/api/actas/asociacion/1/asistencia",
        { asociadoId: 10 }
      ),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("asociadoId y estado son requeridos.");
  });
});

describe("API Actas — Junta Directiva", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/actas/jd debe listar actas", async () => {
    const actas = [
      {
        id: 2,
        fecha: "2026-05-03T00:00:00.000Z",
        tipoSesion: "extraordinaria" as const,
        urlActa: null,
        nombreArchivo: null,
        createdAt: "2026-05-03T00:00:00.000Z",
      },
    ];
    listarActasJDMock.mockResolvedValue(actas);

    const { GET } = await import("@/app/api/actas/jd/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(actas);
  });

  it("POST /api/actas/jd crea acta", async () => {
    const creada = {
      id: 3,
      fecha: "2026-05-04",
      tipoSesion: "ordinaria" as const,
      urlActa: null,
      nombreArchivo: null,
      createdAt: "2026-05-04T00:00:00.000Z",
    };
    crearActaJDMock.mockResolvedValue(creada);

    const { POST } = await import("@/app/api/actas/jd/route");
    const response = await POST(
      createPostRequest("http://localhost/api/actas/jd", {
        fecha: "2026-05-04",
        tipoSesion: "ordinaria",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(creada);
  });

  it("GET /api/actas/jd/[id] retorna 404 si no existe", async () => {
    obtenerActaJDMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/actas/jd/[id]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/actas/jd/0"),
      { params: Promise.resolve({ id: "0" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe("Acta no encontrada.");
  });

  it("PUT /api/actas/jd/[id] retorna 404 si no existe", async () => {
    actualizarActaJDMock.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/actas/jd/[id]/route");
    const response = await PUT(
      createPutRequest("http://localhost/api/actas/jd/1", { fecha: "2026-01-01" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe("Acta no encontrada.");
  });

  it("GET /api/actas/jd/[id]/asistencia lista asistencias", async () => {
    obtenerAsistenciasJDMock.mockResolvedValue([]);

    const { GET } = await import("@/app/api/actas/jd/[id]/asistencia/route");
    const response = await GET(
      new NextRequest("http://localhost/api/actas/jd/5/asistencia"),
      { params: Promise.resolve({ id: "5" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it("POST /api/actas/jd/[id]/asistencia registra asistencia", async () => {
    const row = {
      id: 9,
      actaId: 5,
      asociadoId: 3,
      nombreAsociado: "Luis",
      estado: "presente" as const,
      justificacion: null,
    };
    registrarAsistenciaJDMock.mockResolvedValue(row);

    const { POST } = await import("@/app/api/actas/jd/[id]/asistencia/route");
    const response = await POST(
      createPostRequest("http://localhost/api/actas/jd/5/asistencia", {
        asociadoId: 3,
        estado: "presente",
      }),
      { params: Promise.resolve({ id: "5" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(row);
  });
});
