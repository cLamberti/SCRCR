export type EstadoAsistenciaCSV = "presente" | "ausente" | "justificado";

export interface AsociadoCSV {
  id: number;
  nombreCompleto: string;
  cedula: string;
  ministerio?: string;
}

export interface EventoCSV {
  id: number;
  nombre: string;
  fecha: string;
}

export interface RegistroAsistenciaCSV {
  asociadoId: number;
  estado: EstadoAsistenciaCSV;
}

const ESTADO_LABELS: Record<EstadoAsistenciaCSV, string> = {
  presente: "Presente",
  ausente: "Ausente",
  justificado: "Justificado",
};

export function escaparCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return '""';
  const texto = String(valor).replace(/"/g, '""');
  return `"${texto}"`;
}

export function obtenerNombreArchivoReporte(evento?: EventoCSV): string {
  const nombreEvento = (evento?.nombre || "evento")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");

  const fechaEvento = evento?.fecha
    ? evento.fecha.slice(0, 10)
    : new Date().toISOString().split("T")[0];

  return `reporte_asistencia_${nombreEvento}_${fechaEvento}.csv`;
}

export function construirFilasReporteCSV(
  asociados: AsociadoCSV[],
  registros: RegistroAsistenciaCSV[]
): string[][] {
  return asociados.map((a) => {
    const registro = registros.find((r) => r.asociadoId === a.id);
    const estado = registro ? ESTADO_LABELS[registro.estado] : "Sin registro";

    return [
      a.nombreCompleto,
      a.cedula,
      a.ministerio || "",
      estado,
    ];
  });
}

export function construirContenidoReporteCSV(
  asociados: AsociadoCSV[],
  registros: RegistroAsistenciaCSV[]
): string {
  const encabezados = ["Nombre", "Cédula", "Ministerio", "Estado"];
  const filas = construirFilasReporteCSV(asociados, registros);

  return [encabezados, ...filas]
    .map((fila) => fila.map(escaparCSV).join(","))
    .join("\n");
}

export function descargarCSV(contenido: string, nombreArchivo: string): void {
  const blob = new Blob(["\uFEFF" + contenido], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}