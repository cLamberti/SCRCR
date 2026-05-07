import { describe, expect, it } from "vitest";
import type {
  ActaAsociacionDTO,
  ActaJDDTO,
  ActualizarActaAsociacionRequest,
  ActualizarActaJDRequest,
  AsistenciaActaDTO,
  CrearActaAsociacionRequest,
  CrearActaJDRequest,
  EstadoAsistenciaActa,
  RegistrarAsistenciaBulkRequest,
  RegistrarAsistenciaRequest,
  TipoSesion,
} from "@/dto/acta.dto";

describe("Acta — DTO (contratos de forma)", () => {
  it("TipoSesion y EstadoAsistenciaActa aceptan los literales esperados", () => {
    const tipos: TipoSesion[] = ["ordinaria", "extraordinaria"];
    const estados: EstadoAsistenciaActa[] = [
      "presente",
      "ausente",
      "justificado",
    ];
    expect(tipos).toHaveLength(2);
    expect(estados).toHaveLength(3);
  });

  it("ActaAsociacionDTO incluye campos de auditoría y totales opcionales", () => {
    const dto: ActaAsociacionDTO = {
      id: 1,
      fecha: "2026-05-01",
      tipoSesion: "ordinaria",
      urlActa: "https://blob/x",
      nombreArchivo: "acta.pdf",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
      totalAsistentes: 3,
      totalAusentes: 1,
    };
    expect(dto.id).toBe(1);
    expect(dto.urlActa).toContain("https");
    expect(dto.totalAsistentes).toBe(3);
  });

  it("CrearActaAsociacionRequest admite url y archivo opcionales", () => {
    const min: CrearActaAsociacionRequest = {
      fecha: "2026-05-01",
      tipoSesion: "extraordinaria",
    };
    const full: CrearActaAsociacionRequest = {
      ...min,
      urlActa: "u",
      nombreArchivo: "f.pdf",
    };
    expect(min.urlActa).toBeUndefined();
    expect(full.nombreArchivo).toBe("f.pdf");
  });

  it("ActualizarActaAsociacionRequest permite parcial y null en archivo", () => {
    const patch: ActualizarActaAsociacionRequest = {
      fecha: "2026-06-01",
      urlActa: null,
      nombreArchivo: null,
    };
    expect(patch.urlActa).toBeNull();
  });

  it("ActaJDDTO es análogo a ActaAsociacionDTO", () => {
    const jd: ActaJDDTO = {
      id: 2,
      fecha: "2026-05-02",
      tipoSesion: "ordinaria",
      urlActa: null,
      nombreArchivo: null,
      createdAt: "2026-05-02T00:00:00.000Z",
      updatedAt: "2026-05-02T00:00:00.000Z",
    };
    expect(jd.tipoSesion).toBe("ordinaria");
  });

  it("CrearActaJDRequest y ActualizarActaJDRequest siguen el mismo patrón", () => {
    const crear: CrearActaJDRequest = {
      fecha: "2026-01-01",
      tipoSesion: "ordinaria",
    };
    const act: ActualizarActaJDRequest = { tipoSesion: "extraordinaria" };
    expect(crear.fecha).toBe("2026-01-01");
    expect(act.fecha).toBeUndefined();
  });

  it("AsistenciaActaDTO y RegistrarAsistenciaRequest enlazan acta y asociado", () => {
    const fila: AsistenciaActaDTO = {
      id: 10,
      actaId: 4,
      asociadoId: 8,
      nombreAsociado: "Uno",
      estado: "presente",
      justificacion: null,
    };
    const req: RegistrarAsistenciaRequest = {
      asociadoId: 8,
      estado: "justificado",
      justificacion: "viaje",
    };
    const bulk: RegistrarAsistenciaBulkRequest = { asistencias: [req] };
    expect(fila.actaId).toBe(4);
    expect(bulk.asistencias).toHaveLength(1);
    expect(bulk.asistencias[0].estado).toBe("justificado");
  });
});
