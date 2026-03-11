import { describe, it, expect } from "vitest";
import {
  escaparCSV,
  construirFilasReporteCSV,
  construirContenidoReporteCSV,
  obtenerNombreArchivoReporte,
} from "@/utils/reporteAsistenciaCsv";

describe("Reporte de Asistencia - Exportación CSV", () => {
  const asociados = [
    {
      id: 1,
      nombreCompleto: "Christopher Lamberti",
      cedula: "208650623",
      ministerio: "Evangelismo",
    },
    {
      id: 2,
      nombreCompleto: "Prueba dos",
      cedula: "208080981",
      ministerio: "asdasdasd",
    },
  ];

  const registros = [
    {
      asociadoId: 1,
      estado: "presente" as const,
    },
    {
      asociadoId: 2,
      estado: "justificado" as const,
    },
  ];

  it("debe escapar correctamente valores simples para CSV", () => {
    expect(escaparCSV("Hola")).toBe('"Hola"');
  });

  it("debe escapar comillas internas correctamente", () => {
    expect(escaparCSV('Juan "Loco" Perez')).toBe('"Juan ""Loco"" Perez"');
  });

  it("debe construir las filas con nombre, cédula, ministerio y estado", () => {
    const filas = construirFilasReporteCSV(asociados, registros);

    expect(filas).toEqual([
      ["Christopher Lamberti", "208650623", "Evangelismo", "Presente"],
      ["Prueba dos", "208080981", "asdasdasd", "Justificado"],
    ]);
  });

  it('debe colocar "Sin registro" cuando un asociado no tiene asistencia registrada', () => {
    const filas = construirFilasReporteCSV(
      [
        ...asociados,
        {
          id: 3,
          nombreCompleto: "Nuevo Asociado",
          cedula: "999999999",
          ministerio: "Música",
        },
      ],
      registros
    );

    expect(filas[2]).toEqual([
      "Nuevo Asociado",
      "999999999",
      "Música",
      "Sin registro",
    ]);
  });

  it("debe construir el contenido CSV con encabezados y filas", () => {
    const csv = construirContenidoReporteCSV(asociados, registros);

    expect(csv).toContain('"Nombre","Cédula","Ministerio","Estado"');
    expect(csv).toContain('"Christopher Lamberti","208650623","Evangelismo","Presente"');
    expect(csv).toContain('"Prueba dos","208080981","asdasdasd","Justificado"');
  });

  it("debe generar el nombre correcto del archivo", () => {
    const nombre = obtenerNombreArchivoReporte({
      id: 1,
      nombre: "Culto Dominical",
      fecha: "2026-03-05",
    });

    expect(nombre).toBe("reporte_asistencia_Culto_Dominical_2026-03-05.csv");
  });
});