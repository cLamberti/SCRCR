"use client";

import { useEffect, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  FaCalendarAlt, FaCheckCircle, FaTimesCircle,
  FaExclamationCircle, FaSpinner, FaUsers, FaSearch,
  FaRedo, FaDownload,
} from "react-icons/fa";
import Sidebar from "@/components/SideBar";

enum EstadoAsistencia {
  Presente = "presente",
  Ausente = "ausente",
  Justificado = "justificado",
}

type TipoPersona = "asociado" | "congregado";

interface Persona {
  id: number;
  nombre: string;
  cedula: string;
  ministerio?: string;
}

interface Evento {
  id: number;
  nombre: string;
  fecha: string;
}

interface RegistroAsistencia {
  id: number;
  asociadoId: number | null;
  congregadoId: number | null;
  eventoId: number;
  estado: EstadoAsistencia;
  fecha: string;
  justificacion?: string | null;
  horaRegistro: string;
  createdAt: string;
  updatedAt: string;
}

const ESTADO_CONFIG = {
  [EstadoAsistencia.Presente]: {
    label: "Presente",
    badge: "bg-green-100 text-green-800",
    btn: "bg-green-600 hover:bg-green-700 text-white",
    btnActive: "bg-green-200 text-green-800 cursor-not-allowed",
    icon: FaCheckCircle,
  },
  [EstadoAsistencia.Ausente]: {
    label: "Ausente",
    badge: "bg-red-100 text-red-800",
    btn: "bg-red-600 hover:bg-red-700 text-white",
    btnActive: "bg-red-200 text-red-800 cursor-not-allowed",
    icon: FaTimesCircle,
  },
  [EstadoAsistencia.Justificado]: {
    label: "Justificado",
    badge: "bg-amber-100 text-amber-800",
    btn: "bg-amber-500 hover:bg-amber-600 text-white",
    btnActive: "bg-amber-200 text-amber-800 cursor-not-allowed",
    icon: FaExclamationCircle,
  },
};

function escaparCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).replace(/"/g, '""');
  return `"${texto}"`;
}

export default function ReportesPage() {
  const [tipo, setTipo] = useState<TipoPersona>("asociado");
  const [asociados, setAsociados] = useState<Persona[]>([]);
  const [congregados, setCongregados] = useState<Persona[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [eventoId, setEventoId] = useState<number>(0);
  const [cargandoPersonas, setCargandoPersonas] = useState(true);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [procesando, setProcesando] = useState<Set<number>>(new Set());
  const [busqueda, setBusqueda] = useState("");

  const personas = tipo === "asociado" ? asociados : congregados;

  const cargarTodo = useCallback(() => {
    setCargandoPersonas(true);
    Promise.all([cargarAsociados(), cargarCongregados(), cargarEventos()]).finally(() =>
      setCargandoPersonas(false)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);
  useAutoRefresh(cargarTodo);

  useEffect(() => {
    if (eventoId > 0) cargarRegistros();
    else setRegistros([]);
  }, [eventoId]);

  // Limpiar búsqueda al cambiar tipo
  useEffect(() => {
    setBusqueda("");
  }, [tipo]);

  const cargarAsociados = async () => {
    try {
      const res = await fetch("/api/asociados/consulta?all=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAsociados(
          data.data.map((a: any) => ({
            id: a.id,
            nombre: a.nombreCompleto,
            cedula: a.cedula,
            ministerio: a.ministerio,
          }))
        );
      } else setAsociados([]);
    } catch {
      toast.error("Error al cargar asociados");
      setAsociados([]);
    }
  };

  const cargarCongregados = async () => {
    try {
      const res = await fetch("/api/congregados?all=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCongregados(
          data.data.map((c: any) => ({
            id: c.id,
            nombre: c.nombre,
            cedula: c.cedula,
            ministerio: c.ministerio,
          }))
        );
      } else setCongregados([]);
    } catch {
      toast.error("Error al cargar congregados");
      setCongregados([]);
    }
  };

  const cargarEventos = async () => {
    try {
      setCargandoEventos(true);
      const res = await fetch("/api/eventos");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEventos(data.data);
        if (data.data.length > 0) setEventoId(data.data[0].id);
      } else {
        toast.error("No se pudieron cargar los eventos");
        setEventos([]);
      }
    } catch {
      toast.error("Error de conexión al cargar eventos");
      setEventos([]);
    } finally {
      setCargandoEventos(false);
    }
  };

  const cargarRegistros = async () => {
    try {
      setCargandoRegistros(true);
      const res = await fetch(`/api/reporte-asistencia?eventoId=${eventoId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRegistros(
          data.data.map((r: any) => ({
            id: r.id,
            asociadoId: r.asociadoId ?? null,
            congregadoId: r.congregadoId ?? null,
            eventoId: r.eventoId,
            estado: r.estado as EstadoAsistencia,
            fecha: r.fecha,
            justificacion: r.justificacion,
            horaRegistro: r.horaRegistro,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }))
        );
      } else setRegistros([]);
    } catch {
      toast.error("Error al cargar registros");
      setRegistros([]);
    } finally {
      setCargandoRegistros(false);
    }
  };

  const obtenerRegistro = (personaId: number): RegistroAsistencia | undefined => {
    if (tipo === "asociado") return registros.find(r => r.asociadoId === personaId);
    return registros.find(r => r.congregadoId === personaId);
  };

  const obtenerEstado = (personaId: number) => obtenerRegistro(personaId)?.estado;

  const registrarAsistencia = async (
    personaId: number,
    estado: EstadoAsistencia,
    justificacion?: string
  ) => {
    setProcesando(prev => new Set(prev).add(personaId));
    const toastId = toast.loading("Registrando...");
    try {
      const body: Record<string, unknown> = {
        eventoId,
        estado,
        fecha: new Date().toISOString().split("T")[0],
        ...(justificacion ? { justificacion } : {}),
      };
      if (tipo === "asociado") body.asociadoId = personaId;
      else body.congregadoId = personaId;

      const res = await fetch("/api/reporte-asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await cargarRegistros();
        toast.success(ESTADO_CONFIG[estado].label, { id: toastId, duration: 1500 });
      } else toast.error(data.message || "Error al registrar", { id: toastId });
    } catch {
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setProcesando(prev => { const n = new Set(prev); n.delete(personaId); return n; });
    }
  };

  const actualizarAsistencia = async (
    registroId: number,
    personaId: number,
    nuevoEstado: EstadoAsistencia,
    justificacion?: string
  ) => {
    setProcesando(prev => new Set(prev).add(personaId));
    const toastId = toast.loading("Actualizando...");
    try {
      const res = await fetch(`/api/reporte-asistencia?id=${registroId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, justificacion }),
      });
      const data = await res.json();
      if (data.success) {
        await cargarRegistros();
        toast.success(`Actualizado a ${ESTADO_CONFIG[nuevoEstado].label}`, { id: toastId, duration: 1500 });
      } else toast.error(data.message || "Error al actualizar", { id: toastId });
    } catch {
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setProcesando(prev => { const n = new Set(prev); n.delete(personaId); return n; });
    }
  };

  const manejarCambioEstado = async (personaId: number, nuevoEstado: EstadoAsistencia) => {
    const existente = obtenerRegistro(personaId);

    if (!existente) {
      if (nuevoEstado === EstadoAsistencia.Justificado) {
        const { value } = await Swal.fire({
          title: "Justificación",
          input: "textarea",
          inputPlaceholder: "Escriba la justificación...",
          showCancelButton: true,
          confirmButtonText: "Registrar",
          cancelButtonText: "Cancelar",
          inputValidator: v => (!v?.trim() ? "La justificación es obligatoria" : null),
        });
        if (value) await registrarAsistencia(personaId, nuevoEstado, value);
      } else await registrarAsistencia(personaId, nuevoEstado);
      return;
    }

    if (existente.estado === nuevoEstado) {
      toast("Ya tiene este estado", { icon: "ℹ️", duration: 2000 });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "¿Cambiar estado?",
      text: `De ${ESTADO_CONFIG[existente.estado].label} a ${ESTADO_CONFIG[nuevoEstado].label}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;

    if (nuevoEstado === EstadoAsistencia.Justificado) {
      const { value } = await Swal.fire({
        title: "Nueva justificación",
        input: "textarea",
        showCancelButton: true,
        confirmButtonText: "Actualizar",
        inputValidator: v => (!v?.trim() ? "La justificación es obligatoria" : null),
      });
      if (value) await actualizarAsistencia(existente.id, personaId, nuevoEstado, value);
    } else {
      await actualizarAsistencia(existente.id, personaId, nuevoEstado);
    }
  };

  const resetearAsistencia = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Resetear asistencias?",
      html: `<p class="text-sm text-gray-600 mb-3">Se eliminarán <strong>todos los registros</strong> del evento (asociados y congregados).</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Sí, resetear",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;

    const toastId = toast.loading("Reseteando...");
    try {
      const res = await fetch(`/api/reporte-asistencia?eventoId=${eventoId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRegistros([]);
        toast.success("Asistencia reseteada", { id: toastId, duration: 2000 });
      } else toast.error(data.message || "Error al resetear", { id: toastId });
    } catch {
      toast.error("Error de conexión", { id: toastId });
    }
  };

  // Registros relevantes al tipo activo
  const registrosActivos = registros.filter(r =>
    tipo === "asociado" ? r.asociadoId != null : r.congregadoId != null
  );

  const estadisticas = {
    presentes: registrosActivos.filter(r => r.estado === EstadoAsistencia.Presente).length,
    ausentes: registrosActivos.filter(r => r.estado === EstadoAsistencia.Ausente).length,
    justificados: registrosActivos.filter(r => r.estado === EstadoAsistencia.Justificado).length,
    sinRegistro: personas.length - registrosActivos.length,
  };

  const porcentajeAsistencia = personas.length > 0
    ? Math.round((estadisticas.presentes / personas.length) * 100)
    : 0;

  const filtrados = personas.filter(p => {
    const q = busqueda.toLowerCase();
    return !q || p.nombre.toLowerCase().includes(q) || p.cedula.includes(q) || (p.ministerio || "").toLowerCase().includes(q);
  });

  const eventoSeleccionado = eventos.find(ev => ev.id === eventoId);

  const exportarReporteCSV = () => {
    if (!eventoId) { toast.error("Seleccione un evento antes de exportar."); return; }
    if (personas.length === 0) { toast.error("No hay personas para exportar."); return; }

    const tipoLabel = tipo === "asociado" ? "Asociado" : "Congregado";
    const filas = personas.map(p => {
      const estado = obtenerEstado(p.id);
      return [p.nombre, p.cedula, p.ministerio || "", estado ? ESTADO_CONFIG[estado].label : "Sin registro", tipoLabel];
    });

    const encabezados = ["Nombre", "Cédula", "Ministerio", "Estado", "Tipo"];
    const csv = [encabezados, ...filas].map(fila => fila.map(escaparCSV).join(",")).join("\n");

    const nombreEvento = (eventoSeleccionado?.nombre || "evento").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    const fechaEvento = eventoSeleccionado?.fecha ? eventoSeleccionado.fecha.slice(0, 10) : new Date().toISOString().split("T")[0];

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `reporte_asistencia_${tipo}_${nombreEvento}_${fechaEvento}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    toast.success("Reporte exportado correctamente.");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar pageTitle="Reportes de Asistencia" />

      <div className="flex-1 pt-14 md:pt-0 flex flex-col min-h-screen">
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Reportes de Asistencia</h1>
              <p className="text-xs text-gray-400">Registra la asistencia por evento</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-5">
          {/* Selector de evento + resetear */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Evento
                </label>
                <select
                  value={eventoId}
                  onChange={e => setEventoId(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                >
                  {cargandoEventos ? (
                    <option>Cargando eventos...</option>
                  ) : eventos.length > 0 ? (
                    eventos.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.nombre} — {ev.fecha?.slice(0, 10)}
                      </option>
                    ))
                  ) : (
                    <option>No hay eventos disponibles</option>
                  )}
                </select>
              </div>
              <button
                onClick={resetearAsistencia}
                disabled={registros.length === 0 || cargandoRegistros}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FaRedo className="text-xs" />
                Resetear
              </button>
            </div>
          </div>

          {/* Toggle Asociados / Congregados */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 flex gap-1 w-fit">
            {(["asociado", "congregado"] as TipoPersona[]).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  tipo === t
                    ? "bg-[#003366] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <FaUsers className="text-xs" />
                {t === "asociado" ? "Asociados" : "Congregados"}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", value: personas.length, color: "border-[#003366] text-[#003366]", bg: "bg-blue-50" },
              { label: "Presentes", value: estadisticas.presentes, color: "border-green-500 text-green-700", bg: "bg-green-50" },
              { label: "Ausentes", value: estadisticas.ausentes, color: "border-red-500 text-red-700", bg: "bg-red-50" },
              { label: "Justificados", value: estadisticas.justificados, color: "border-amber-500 text-amber-700", bg: "bg-amber-50" },
              { label: "Sin registro", value: estadisticas.sinRegistro, color: "border-gray-400 text-gray-600", bg: "bg-gray-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border ${s.color} border-l-4 p-4`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Barra de progreso */}
          {personas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Asistencia registrada
                </span>
                <span className="text-sm font-bold text-[#003366]">
                  {registrosActivos.length} / {personas.length}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#003366] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(registrosActivos.length / personas.length) * 100}%` }}
                />
              </div>
              {estadisticas.presentes > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {porcentajeAsistencia}% de asistencia en presentes
                </p>
              )}
            </div>
          )}

          {/* Buscador */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder={`Buscar ${tipo === "asociado" ? "asociado" : "congregado"} por nombre, cédula o ministerio…`}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17609c] shadow-sm"
            />
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {cargandoPersonas
                  ? "Cargando..."
                  : `${filtrados.length} ${tipo === "asociado" ? "asociado" : "congregado"}${filtrados.length !== 1 ? "s" : ""}`}
              </span>
              {cargandoRegistros && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FaSpinner className="animate-spin" /> Actualizando...
                </span>
              )}
            </div>

            {cargandoPersonas ? (
              <div className="p-12 text-center text-gray-400 text-sm flex flex-col items-center gap-3">
                <FaSpinner className="animate-spin text-2xl text-[#003366]" />
                Cargando...
              </div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center">
                <FaUsers className="mx-auto text-gray-300 text-3xl mb-3" />
                <p className="text-gray-500 text-sm">
                  No hay {tipo === "asociado" ? "asociados" : "congregados"} para mostrar.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Nombre", "Cédula", "Ministerio", "Estado", "Justificación", "Acción"].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtrados.map(p => {
                        const estado = obtenerEstado(p.id);
                        const registro = obtenerRegistro(p.id);
                        const isProcesando = procesando.has(p.id);

                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-medium text-gray-900">{p.nombre}</td>
                            <td className="px-6 py-4 text-gray-500 text-xs font-mono">{p.cedula}</td>
                            <td className="px-6 py-4 text-gray-500">{p.ministerio || "—"}</td>
                            <td className="px-6 py-4">
                              {estado ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTADO_CONFIG[estado].badge}`}>
                                  {ESTADO_CONFIG[estado].label}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                  Sin registro
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-[200px]">
                              {estado === EstadoAsistencia.Justificado && registro?.justificacion ? (
                                <span
                                  className="block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 italic truncate cursor-help"
                                  title={registro.justificacion}
                                >
                                  {registro.justificacion}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1.5">
                                {Object.values(EstadoAsistencia).map(e => {
                                  const cfg = ESTADO_CONFIG[e];
                                  const isActive = estado === e;
                                  const Icon = cfg.icon;

                                  return (
                                    <button
                                      key={e}
                                      onClick={() => manejarCambioEstado(p.id, e)}
                                      disabled={isProcesando || isActive}
                                      title={cfg.label}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        isActive ? cfg.btnActive : cfg.btn
                                      } disabled:cursor-not-allowed`}
                                    >
                                      {isProcesando ? <FaSpinner className="animate-spin" /> : <Icon />}
                                      <span className="hidden lg:inline">{cfg.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filtrados.map(p => {
                    const estado = obtenerEstado(p.id);
                    const registro = obtenerRegistro(p.id);
                    const isProcesando = procesando.has(p.id);

                    return (
                      <div key={p.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {p.cedula} {p.ministerio && `· ${p.ministerio}`}
                            </p>
                          </div>
                          <div>
                            {estado ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_CONFIG[estado].badge}`}>
                                {ESTADO_CONFIG[estado].label}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                Sin registro
                              </span>
                            )}
                          </div>
                        </div>
                        {estado === EstadoAsistencia.Justificado && registro?.justificacion && (
                          <div className="mb-3 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-700 italic">{registro.justificacion}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {Object.values(EstadoAsistencia).map(e => {
                            const cfg = ESTADO_CONFIG[e];
                            const isActive = estado === e;
                            const Icon = cfg.icon;

                            return (
                              <button
                                key={e}
                                onClick={() => manejarCambioEstado(p.id, e)}
                                disabled={isProcesando || isActive}
                                className={`flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg transition ${
                                  isActive ? cfg.btnActive : cfg.btn
                                } disabled:cursor-not-allowed`}
                              >
                                {isProcesando ? <FaSpinner className="animate-spin" /> : <Icon />}
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Exportar CSV */}
          <div className="flex justify-end">
            <button
              onClick={exportarReporteCSV}
              disabled={cargandoPersonas || cargandoRegistros || personas.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#003366] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FaDownload className="text-xs" />
              Exportar CSV
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
