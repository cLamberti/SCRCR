"use client";

import { useEffect, useState } from "react";
import { FaHistory, FaUser, FaFilter, FaFilePdf, FaFileExcel, FaCalendarAlt } from "react-icons/fa";
import { HistorialResponseDTO, TipoRegistroHistorial } from "@/dto/historial.dto";
import Sidebar from "@/components/SideBar";

type PersonaSimple = {
  id: number;
  nombre: string;
};

const inputClass =
  'shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 text-sm leading-tight ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] border-gray-300 transition-colors';

export default function HistorialPage() {
  const [tipoPersona, setTipoPersona] = useState<"usuario" | "asociado" | "congregado" | "todos">("asociado");
  const [personas, setPersonas] = useState<PersonaSimple[]>([]);
  const [personaId, setPersonaId] = useState<number>(0);
  const [cargandoPersonas, setCargandoPersonas] = useState(false);

  const [historialData, setHistorialData] = useState<HistorialResponseDTO | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistroHistorial | "todos">("todos");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20);

  useEffect(() => {
    // En modo "todos" absoluto no cargamos lista de personas
    if (tipoPersona === "todos") {
      setPersonas([]);
      setPersonaId(0);
      setHistorialData(null);
      return;
    }

    const fetchPersonas = async () => {
      setCargandoPersonas(true);
      try {
        let endpoint = "";
        if (tipoPersona === "usuario") endpoint = "/api/usuarios";
        else if (tipoPersona === "asociado") endpoint = "/api/asociados";
        else if (tipoPersona === "congregado") endpoint = "/api/congregados";

        const res = await fetch(endpoint);
        const data = await res.json();

        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          list = data.data;
        }

        const listMapped = list.map(p => ({
          id: p.id,
          nombre: p.nombreCompleto || p.nombre_completo || p.nombre || p.username || "Sin nombre"
        }));

        // Añadimos la opción "Todos los [Tipo]s"
        let labelAgregada = "";
        if (tipoPersona === "asociado") labelAgregada = "Todos los Asociados";
        if (tipoPersona === "usuario")  labelAgregada = "Todos los Usuarios Staff";
        if (tipoPersona === "congregado") labelAgregada = "Todos los Congregados";

        setPersonas([
          { id: -1, nombre: labelAgregada },
          ...listMapped
        ]);
        setPersonaId(0);
        setHistorialData(null);
      } catch (err) {
        console.error("Error al cargar personas", err);
        setPersonas([]);
      } finally {
        setCargandoPersonas(false);
      }
    };
    fetchPersonas();
  }, [tipoPersona]);

  const fetchHistorial = async () => {
    // Si es "todos" absoluto o si se seleccionó "Todos los [Tipo]s" (id -1)
    if (tipoPersona === "todos" || personaId === -1) {
      await fetchHistorialGeneral();
      return;
    }
    if (!personaId) return;
    setCargandoHistorial(true);
    setErrorMsg(null);
    setHistorialData(null);
    setPaginaActual(1); // reset al nueva búsqueda

    try {
      const params = new URLSearchParams({
        personaId: personaId.toString(),
        tipoPersona
      });

      if (fechaDesde) params.append("fechaDesde", fechaDesde);
      if (fechaHasta) params.append("fechaHasta", fechaHasta);
      if (tipoRegistro && tipoRegistro !== "todos") params.append("tipoRegistro", tipoRegistro);

      const res = await fetch(`/api/historial?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener historial");
      }

      setHistorialData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Historial general: une los historiales de todas las personas de todos los tipos
  const fetchHistorialGeneral = async () => {
    setCargandoHistorial(true);
    setErrorMsg(null);
    setHistorialData(null);
    try {
      // Obtenemos solo lo necesario según la selección
      const esFiltradoPorTipo = personaId === -1;
      
      const fetchAsociados   = (tipoPersona === "todos" || (esFiltradoPorTipo && tipoPersona === "asociado")) ? fetch("/api/asociados").then(r => r.json()) : Promise.resolve([]);
      const fetchUsuarios    = (tipoPersona === "todos" || (esFiltradoPorTipo && tipoPersona === "usuario"))  ? fetch("/api/usuarios").then(r => r.json())  : Promise.resolve([]);
      const fetchCongregados = (tipoPersona === "todos" || (esFiltradoPorTipo && tipoPersona === "congregado")) ? fetch("/api/congregados").then(r => r.json()) : Promise.resolve([]);
      const fetchSistema     = (tipoPersona === "todos") ? fetch("/api/historial/sistema").then(r => r.json()) : Promise.resolve({ historial: [] });

      const [resAso, resUsr, resCon, resSys] = await Promise.all([fetchAsociados, fetchUsuarios, fetchCongregados, fetchSistema]);

      const extraerLista = (d: any): any[] =>
        Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];

      const asociados   = extraerLista(resAso).map((p: any) => ({ id: p.id, tipo: 'asociado' }));
      const usuarios    = extraerLista(resUsr).map((p: any) => ({ id: p.id, tipo: 'usuario' }));
      const congregados = extraerLista(resCon).map((p: any) => ({ id: p.id, tipo: 'congregado' }));

      const todas = [...asociados, ...usuarios, ...congregados];

      // Consultamos el historial de cada persona en paralelo (máx 10 a la vez)
      const resultados: HistorialResponseDTO[] = [];
      const chunkSize = 10;
      for (let i = 0; i < todas.length; i += chunkSize) {
        const chunk = todas.slice(i, i + chunkSize);
        const parciales = await Promise.allSettled(
          chunk.map(p =>
            fetch(`/api/historial?personaId=${p.id}&tipoPersona=${p.tipo}`).then(r => r.json())
          )
        );
        parciales.forEach(r => {
          if (r.status === 'fulfilled' && r.value?.historial) resultados.push(r.value);
        });
      }

      // Consolidamos en un único "HistorialResponseDTO" genérico
      const todosItems = resultados.flatMap(r =>
        r.historial.map(item => ({ ...item, _persona: r.persona.nombre }))
      );

      // Añadimos hitos del sistema
      if (resSys && resSys.historial) {
        todosItems.push(...resSys.historial);
      }

      // Deduplicamos por id_registro
      const unicos = new Map();
      todosItems.forEach(item => {
        if (!unicos.has(item.id_registro)) {
          unicos.set(item.id_registro, item);
        }
      });
      const todosUnicos = Array.from(unicos.values());

      // Aplicamos filtros de fecha si los hay
      const filtrados = todosUnicos.filter(item => {
        const t = new Date(item.fecha).getTime();
        if (fechaDesde && t < new Date(fechaDesde).getTime()) return false;
        if (fechaHasta && t > new Date(fechaHasta).getTime()) return false;
        if (tipoRegistro !== 'todos' && item.tipo !== tipoRegistro) return false;
        return true;
      });

      // Ordenar por fecha descendente
      filtrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      let labelPersona = "Todos los registros";
      if (personaId === -1) {
        if (tipoPersona === "asociado") labelPersona = "Todos los Asociados";
        if (tipoPersona === "usuario")  labelPersona = "Todos los Usuarios Staff";
        if (tipoPersona === "congregado") labelPersona = "Todos los Congregados";
      }

      setHistorialData({
        persona: { id: 0, nombre: labelPersona, tipo: tipoPersona },
        historial: filtrados,
      } as any);
      setPaginaActual(1); // reset al obtener datos nuevos
    } catch (err: any) {
      setErrorMsg(err.message || "Error al obtener historial general");
    } finally {
      setCargandoHistorial(false);
    }
  };

  const formatearFecha = (fechaStr: string | Date) => {
    const fecha = new Date(fechaStr);
    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(fecha);
  };

  // ── Paginación calculada ──────────────────────────────────────────────────
  const totalRegistros = historialData?.historial.length ?? 0;
  const totalPaginas   = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
  const inicio         = (paginaActual - 1) * registrosPorPagina;
  const fin            = inicio + registrosPorPagina;
  const registrosPagina = historialData?.historial.slice(inicio, fin) ?? [];

  const irAPagina = (n: number) => setPaginaActual(Math.max(1, Math.min(n, totalPaginas)));

  // ── Exportar PDF: plantilla A4 con badge fijo centrado ────────────────────

  const exportarPDF = async () => {
    if (!historialData) return;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ── Encabezado ──
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("SCRCR — Iglesia Bíblica Emanuel", 14, 11);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Historial de Personas", 14, 18);
    const hoy = new Intl.DateTimeFormat("es-CR", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date());
    doc.setFontSize(8);
    doc.text(`Generado: ${hoy}`, 14, 24);

    // ── Sujeto ──
    doc.setTextColor(0, 51, 102); doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(historialData.persona.nombre, 14, 38);
    doc.setTextColor(100, 100, 100); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const tipoLabel = historialData.persona.tipo.charAt(0).toUpperCase() + historialData.persona.tipo.slice(1);
    const idLabel = historialData.persona.identificacion ? ` · ${historialData.persona.identificacion}` : "";
    doc.text(`${tipoLabel}${idLabel}`, 14, 44);
    doc.setDrawColor(0, 51, 102); doc.setLineWidth(0.5); doc.line(14, 47, 196, 47);

    // ── Tabla ──
    // La columna Tipo renderizamos solo el texto blanco; el badge lo dibujamos después
    // con willDrawCell para que no se pise con el autoTable text
    const BADGE_W = 20;  // ancho fijo del badge en mm
    const BADGE_H = 6;   // alto fijo del badge en mm
    const tipoColors: Record<string, [number, number, number]> = {
      asistencia:   [22, 163, 74],
      permiso:      [37,  99, 235],
      modificacion: [147, 51, 234],
    };

    autoTable(doc, {
      startY: 51,
      head: [["Fecha y Hora", "Tipo", "Descripción", "Estado"]],
      body: historialData.historial.map(item => [
        formatearFecha(item.fecha),
        item.tipo.toUpperCase(),
        item.descripcion + (item.detalles?.observaciones ? `\nNota: ${item.detalles.observaciones}` : ""),
        item.estado || "—",
      ]),
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: BADGE_W + 8, halign: "center" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 26, halign: "center" },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [50, 50, 50],
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
        minCellHeight: 10,
      },
      // 1) Vaciar el texto de la celda "Tipo" para que autoTable no lo renderice
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1) {
          data.cell.text = [];
        }
      },
      // 2) Dibujar el badge una vez terminado el dibujo de la celda
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1) {
          const raw = (data.cell.raw as string).toLowerCase();
          const [r, g, b] = tipoColors[raw] ?? [100, 100, 100];

          const bx = data.cell.x + (data.cell.width - BADGE_W) / 2;
          const by = data.cell.y + (data.cell.height - BADGE_H) / 2;

          data.doc.setFillColor(r, g, b);
          data.doc.roundedRect(bx, by, BADGE_W, BADGE_H, 1.5, 1.5, "F");

          data.doc.setTextColor(255, 255, 255);
          data.doc.setFontSize(6.5);
          data.doc.setFont("helvetica", "bold");
          data.doc.text(
            data.cell.raw as string,
            bx + BADGE_W / 2,
            by + BADGE_H / 2 + 0.5,
            { align: "center", baseline: "middle" }
          );
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── Pie de página ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(160, 160, 160);
      doc.text(`Página ${i} de ${pageCount} · SCRCR — Documento confidencial`, 105, 291, { align: "center" });
    }

    doc.save(`Historial_${historialData.persona.nombre.replace(/\s+/g, "_")}.pdf`);
  };

  // ── Exportar Excel profesional con ExcelJS ────────────────────────────────
  const exportarExcel = async () => {
    if (!historialData || historialData.historial.length === 0) return;

    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "SCRCR";
    wb.created = new Date();

    const ws = wb.addWorksheet("Historial", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // ── Ancho de columnas ──
    ws.columns = [
      { key: "fecha",  width: 24 },
      { key: "tipo",   width: 16 },
      { key: "desc",   width: 55 },
      { key: "obs",    width: 35 },
      { key: "estado", width: 16 },
    ];

    // ── Fila 1: título grande ──
    ws.mergeCells("A1:E1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "SCRCR — Iglesia Bíblica Emanuel";
    titleCell.font = { name: "Calibri", bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(1).height = 28;

    // ── Fila 2: subtítulo ──
    ws.mergeCells("A2:E2");
    const subCell = ws.getCell("A2");
    subCell.value = "Historial de Personas";
    subCell.font = { name: "Calibri", italic: true, size: 11, color: { argb: "FFFFFFFF" } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
    subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(2).height = 18;

    // ── Fila 3: espacio ──
    ws.getRow(3).height = 6;

    // ── Filas de metadatos (4-7) ──
    const metaStyle = {
      font: { name: "Calibri", size: 10 },
      alignment: { vertical: "middle" as const },
    };
    const metaLabelStyle = {
      font: { name: "Calibri", bold: true, size: 10, color: { argb: "FF003366" } },
      alignment: { vertical: "middle" as const },
    };

    const metaRows: [string, string][] = [
      ["Nombre:", historialData.persona.nombre],
      ["Tipo:", historialData.persona.tipo.charAt(0).toUpperCase() + historialData.persona.tipo.slice(1)],
      ...(historialData.persona.identificacion ? [["Identificación:", historialData.persona.identificacion] as [string, string]] : []),
      ["Generado:", new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeStyle: "short" }).format(new Date())],
    ];
    metaRows.forEach(([label, val]) => {
      const row = ws.addRow([label, val]);
      row.height = 16;
      row.getCell(1).font = metaLabelStyle.font;
      row.getCell(1).alignment = metaLabelStyle.alignment;
      row.getCell(2).font = metaStyle.font;
      row.getCell(2).alignment = metaStyle.alignment;
    });

    // Espacio antes de la tabla
    ws.addRow([]);

    // ── Fila de encabezados de la tabla ──
    const headerRow = ws.addRow(["Fecha y Hora", "Tipo", "Descripción", "Observaciones", "Estado"]);
    headerRow.height = 20;
    headerRow.eachCell((cell: any) => {
      cell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
      cell.border = {
        top:    { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
        left:   { style: "thin", color: { argb: "FFFFFFFF" } },
        right:  { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    });

    // ── Colores de badge por tipo ──
    const tipoBg: Record<string, string> = {
      permiso:      "FFdbeafe", // azul suave
      asistencia:   "FFdcfce7", // verde suave
      modificacion: "FFf3e8ff", // morado suave
    };
    const tipoFg: Record<string, string> = {
      permiso:      "FF1e40af",
      asistencia:   "FF15803d",
      modificacion: "FF6b21a8",
    };

    // ── Filas de datos ──
    historialData.historial.forEach((item, i) => {
      const dataRow = ws.addRow([
        formatearFecha(item.fecha),
        item.tipo.toUpperCase(),
        item.descripcion,
        item.detalles?.observaciones ?? "",
        item.estado ?? "",
      ]);
      dataRow.height = 18;
      const isAlt = i % 2 === 1;

      dataRow.eachCell((cell: any, colNum: number) => {
        cell.font = { name: "Calibri", size: 9.5 };
        cell.alignment = { vertical: "middle", wrapText: colNum === 3 };
        cell.border = {
          top:    { style: "hair", color: { argb: "FFe2e8f0" } },
          bottom: { style: "hair", color: { argb: "FFe2e8f0" } },
          left:   { style: "hair", color: { argb: "FFe2e8f0" } },
          right:  { style: "hair", color: { argb: "FFe2e8f0" } },
        };
        // Fondo alternado o blanco
        if (colNum === 2) {
          // Columna Tipo → color semántico
          const tipo = item.tipo.toLowerCase();
          cell.fill = { type: "pattern", pattern: "solid",
            fgColor: { argb: tipoBg[tipo] ?? "FFF1F5F9" } };
          cell.font = { name: "Calibri", bold: true, size: 9.5,
            color: { argb: tipoFg[tipo] ?? "FF334155" } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.fill = { type: "pattern", pattern: "solid",
            fgColor: { argb: isAlt ? "FFF8FAFC" : "FFFFFFFF" } };
        }
      });
    });

    // ── Descargar ──
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Historial_${historialData.persona.nombre.replace(/\s+/g, "_")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const BadgeEstado = ({ tipo }: { tipo: string }) => {
    let colorClass = 'bg-gray-100 text-gray-700';
    if (tipo === 'asistencia') colorClass = 'bg-green-100 text-green-700';
    if (tipo === 'permiso') colorClass = 'bg-blue-100 text-blue-700';
    if (tipo === 'modificacion') colorClass = 'bg-purple-100 text-purple-700';
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${colorClass}`}>
        {tipo}
      </span>
    );
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="historial" pageTitle="Consulta de Historial" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 my-4 sm:my-6">

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#003366]">Historial de Personas</h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-lg text-sm border bg-red-50 text-red-700 border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

              {/* ── Panel Lateral: Selección y Filtros ── */}
              <div className="lg:col-span-1 space-y-6">

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold border-b border-gray-300 pb-2 mb-4 flex items-center gap-2 text-[#003366]">
                    <FaUser /> Selección
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-600 text-xs font-semibold mb-1">Tipo de Persona</label>
                      <select
                        className={inputClass}
                        value={tipoPersona}
                        onChange={(e) => setTipoPersona(e.target.value as any)}
                      >
                        <option value="todos">Todos los registros</option>
                        <option value="asociado">Asociado</option>
                        <option value="usuario">Usuario Staff</option>
                        <option value="congregado">Congregado</option>
                      </select>
                    </div>
                    {/* Ocultar selector de persona solo en modo "todos" absoluto */}
                    {tipoPersona !== "todos" && (
                    <div>
                      <label className="block text-gray-600 text-xs font-semibold mb-1">Persona</label>
                      <select
                        className={inputClass}
                        value={personaId}
                        onChange={(e) => setPersonaId(Number(e.target.value))}
                        disabled={cargandoPersonas}
                      >
                        <option value={0}>
                          {cargandoPersonas ? "Cargando..." : "-- Seleccione una persona --"}
                        </option>
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold border-b border-gray-300 pb-2 mb-4 flex items-center gap-2 text-[#003366]">
                    <FaFilter /> Filtros
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-600 text-xs font-semibold mb-1">Desde</label>
                      <input type="date" className={inputClass} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-semibold mb-1">Hasta</label>
                      <input type="date" className={inputClass} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-semibold mb-1">Tipo de Registro</label>
                      <select className={inputClass} value={tipoRegistro} onChange={(e) => setTipoRegistro(e.target.value as any)}>
                        <option value="todos">Todos los eventos</option>
                        <option value="asistencia">Solo Asistencias</option>
                        <option value="permiso">Solo Permisos</option>
                        <option value="modificacion">Solo Modificaciones</option>
                      </select>
                    </div>
                    <button
                      onClick={fetchHistorial}
                      disabled={(tipoPersona !== "todos" && !personaId) || cargandoHistorial}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors
                        ${((tipoPersona !== "todos" && !personaId) || cargandoHistorial)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#003366] hover:bg-[#002244] text-white'
                        }`}
                    >
                      {cargandoHistorial ? "Buscando..." : "Consultar Historial"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Panel Principal: Resultados ── */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl border border-gray-200 min-h-[400px] flex flex-col overflow-hidden">
                  {!historialData && !cargandoHistorial ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
                      <FaHistory className="text-4xl mb-4 text-gray-300" />
                      <p className="text-sm">
                        {(tipoPersona === "todos" || personaId === -1)
                          ? "Presione \"Consultar Historial\" para ver los registros agrupados."
                          : "Seleccione una persona y presione consultar."}
                      </p>
                    </div>
                  ) : cargandoHistorial ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#003366]">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#003366] mb-4"></div>
                      <p className="text-sm font-semibold">Cargando...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#003366]">
                            {historialData?.persona.nombre}
                          </h3>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            {historialData?.persona.tipo}
                            {historialData?.persona.identificacion ? ` · ${historialData.persona.identificacion}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={exportarPDF}
                            title="Exportar como PDF profesional"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                          >
                            <FaFilePdf /> PDF
                          </button>
                          <button
                            onClick={exportarExcel}
                            title="Exportar como Excel (.xlsx)"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors"
                          >
                            <FaFileExcel /> Excel
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto flex-1 max-h-[600px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {historialData?.historial.length === 0 ? (
                          <div className="p-12 text-center text-gray-400">
                            <FaCalendarAlt className="mx-auto text-3xl mb-3 opacity-30" />
                            <p className="text-sm">No se encontraron registros para los criterios seleccionados.</p>
                          </div>
                        ) : (
                          <table className="min-w-full text-sm text-left">
                            <thead className="bg-[#003366] text-white sticky top-0 z-10 shadow-sm">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Fecha y Hora</th>
                                {(tipoPersona === "todos" || personaId === -1) && <th className="px-4 py-3 font-semibold">Persona</th>}
                                <th className="px-4 py-3 font-semibold">Tipo</th>
                                <th className="px-4 py-3 font-semibold">Descripción</th>
                                <th className="px-4 py-3 font-semibold">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {registrosPagina.map((item: any, idx: number) => (
                                <tr key={`${item.tipo}-${item.id_registro}-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                                  <td className="px-4 py-3 text-gray-600 font-medium whitespace-nowrap">
                                    {formatearFecha(item.fecha)}
                                  </td>
                                  {(tipoPersona === "todos" || personaId === -1) && (
                                    <td className="px-4 py-3 text-gray-700 text-xs font-semibold">
                                      {item._persona ?? "—"}
                                    </td>
                                  )}
                                  <td className="px-4 py-3">
                                    <BadgeEstado tipo={item.tipo} />
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {item.descripcion}
                                    {item.tipo === 'modificacion' && (
                                      <span className="block mt-1 text-[10px] text-gray-400 italic">
                                        * Cambios en campos generales.
                                      </span>
                                    )}
                                    {item.detalles?.observaciones && (
                                      <span className="block mt-1 text-[11px] text-gray-400 font-medium">
                                        Nota: {item.detalles.observaciones}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {item.estado && (
                                      <span className="text-gray-600 font-medium">{item.estado}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* ── Controles de Paginación ── */}
                      {totalRegistros > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50 text-sm">
                          {/* Selector de registros por página + total */}
                          <div className="flex items-center gap-2 text-gray-500">
                            <span>Mostrar</span>
                            <select
                              value={registrosPorPagina}
                              onChange={e => { setRegistrosPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                              className="border border-gray-300 rounded-md px-2 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                            >
                              {[10, 20, 50, 100].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                            <span>registros por página &nbsp;·&nbsp; {totalRegistros} en total</span>
                          </div>

                          {/* Navegación de páginas */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => irAPagina(1)}
                              disabled={paginaActual === 1}
                              className="px-2 py-1 rounded text-xs font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Primera página"
                            >«</button>
                            <button
                              onClick={() => irAPagina(paginaActual - 1)}
                              disabled={paginaActual === 1}
                              className="px-2 py-1 rounded text-xs font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Página anterior"
                            >‹</button>

                            {/* Números de página — mostramos máx 5 */}
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                              .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 1)
                              .reduce<(number | "…")[]>((acc, n, i, arr) => {
                                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                                acc.push(n);
                                return acc;
                              }, [])
                              .map((item, i) =>
                                item === "…"
                                  ? <span key={`e-${i}`} className="px-1 text-gray-400">…</span>
                                  : <button
                                      key={item}
                                      onClick={() => irAPagina(item as number)}
                                      className={`w-7 h-7 rounded text-xs font-semibold transition-colors
                                        ${paginaActual === item
                                          ? 'bg-[#003366] text-white'
                                          : 'text-gray-600 hover:bg-gray-200'}`}
                                    >{item}</button>
                              )
                            }

                            <button
                              onClick={() => irAPagina(paginaActual + 1)}
                              disabled={paginaActual === totalPaginas}
                              className="px-2 py-1 rounded text-xs font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Página siguiente"
                            >›</button>
                            <button
                              onClick={() => irAPagina(totalPaginas)}
                              disabled={paginaActual === totalPaginas}
                              className="px-2 py-1 rounded text-xs font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Última página"
                            >»</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
