"use client";

import { useEffect, useMemo, useState } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaCalendarAlt, FaHome, FaPlus, FaEdit, FaSave,
  FaTimes, FaSearch, FaChevronLeft, FaChevronRight,
  FaTrash, FaFilter, FaArrowLeft,
} from "react-icons/fa";
import Sidebar from "@/components/SideBar";

type Evento = {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  hora: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
};

type ListResponse = {
  success: boolean;
  data: Evento[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type MutateResponse = { success: boolean; message?: string; data?: Evento; errors?: any };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function normalizeTime(h: string | null | undefined) {
  if (!h) return "";
  const parts = h.split(":");
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : h;
}

function formatFecha(fecha: string) {
  if (!fecha) return "-";
  const [y, m, d] = fecha.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export default function EventosPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const nombreDebounced = useDebounce(nombre, 400);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [activo, setActivo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [errLoad, setErrLoad] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [cNombre, setCNombre] = useState("");
  const [cFecha, setCFecha] = useState(todayStr());
  const [cHora, setCHora] = useState("");
  const [cDescripcion, setCDescripcion] = useState("");
  const [cActivo, setCActivo] = useState(true);

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgOk, setMsgOk] = useState<boolean | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<Evento>>({});

  const [deleteModal, setDeleteModal] = useState<Evento | null>(null);

  const canCreate = useMemo(() =>
    cNombre.trim().length > 0 && DATE_RE.test(cFecha) && (!cHora || TIME_RE.test(cHora)),
    [cNombre, cFecha, cHora]
  );

  async function fetchEventos() {
    setLoading(true);
    setErrLoad(null);
    try {
      const params = new URLSearchParams();
      if (nombreDebounced.trim()) params.set("nombre", nombreDebounced.trim());
      if (fechaDesde) params.set("fechaDesde", fechaDesde);
      if (fechaHasta) params.set("fechaHasta", fechaHasta);
      if (activo !== "") params.set("activo", activo);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/eventos?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Error al obtener eventos");

      const lr = json as ListResponse;
      setEventos(lr.data.map(e => ({ ...e, hora: normalizeTime(e.hora) })));
      setTotalPages(lr.pagination.totalPages);
      setTotal(lr.pagination.total);
    } catch (e: any) {
      setErrLoad(e?.message || "Error al listar eventos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEventos(); }, [nombreDebounced, fechaDesde, fechaHasta, activo, page, limit]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useAutoRefresh(fetchEventos);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || sending) return;
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: cNombre.trim(), descripcion: cDescripcion.trim() || null, fecha: cFecha, hora: cHora || null, activo: cActivo }),
      });
      const json: MutateResponse = await res.json();
      if (!res.ok || !json?.data) { setMsgOk(false); setMsg(json?.message || "No se pudo crear el evento."); return; }
      await fetchEventos();
      setMsgOk(true);
      setMsg("Evento creado correctamente.");
      setCNombre(""); setCDescripcion(""); setCFecha(todayStr()); setCHora(""); setCActivo(true);
      setShowForm(false);
    } catch { setMsgOk(false); setMsg("Error de red al crear el evento."); }
    finally { setSending(false); }
  }

  function startEdit(ev: Evento) {
    setEditingId(ev.id);
    setEditRow({ nombre: ev.nombre, descripcion: ev.descripcion ?? "", fecha: ev.fecha.slice(0, 10), hora: normalizeTime(ev.hora) || "", activo: ev.activo });
  }

  function cancelEdit() { setEditingId(null); setEditRow({}); }

  async function saveEdit(id: number) {
    if (!editRow?.nombre || !editRow?.fecha || !DATE_RE.test(String(editRow.fecha))) {
      setMsgOk(false); setMsg("Nombre y fecha válida son obligatorios."); return;
    }
    setSending(true); setMsg(null);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: String(editRow.nombre), descripcion: (editRow.descripcion ?? "") || null, fecha: String(editRow.fecha), hora: editRow.hora ? String(editRow.hora) : null, activo: Boolean(editRow.activo ?? true) }),
      });
      const json: MutateResponse = await res.json();
      if (!res.ok || !json?.data) { setMsgOk(false); setMsg(json?.message || "No se pudo actualizar."); return; }
      await fetchEventos();
      setMsgOk(true); setMsg("Evento actualizado."); cancelEdit();
    } catch { setMsgOk(false); setMsg("Error de red al actualizar."); }
    finally { setSending(false); }
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    setSending(true); setMsg(null);
    try {
      const res = await fetch(`/api/eventos/${deleteModal.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json?.success) { setMsgOk(false); setMsg(json?.message ?? "No se pudo eliminar."); return; }
      await fetchEventos();
      setMsgOk(true); setMsg("Evento eliminado.");
    } catch { setMsgOk(false); setMsg("Error de red al eliminar."); }
    finally { setSending(false); setDeleteModal(null); }
  }

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#17609c] focus:border-transparent transition";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar pageTitle="Gestión de Eventos" />

      <div className="flex-1 pt-14 md:pt-0 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Gestión de Eventos</h1>
              <p className="text-xs text-gray-400">Crea, edita y administra eventos</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setMsg(null); }}
            className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <FaPlus className="text-xs" />
            Nuevo evento
          </button>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-5">
          {/* Mensaje global */}
          {msg && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${msgOk ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
              {msg}
            </div>
          )}

          {/* Formulario crear */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Nuevo evento</h2>
                <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white transition">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre *</label>
                  <input type="text" value={cNombre} onChange={e => setCNombre(e.target.value)} className={inputCls} placeholder="Ej. Culto dominical" required />
                </div>
                <div>
                  <label className={labelCls}>Fecha *</label>
                  <input type="date" value={cFecha} onChange={e => setCFecha(e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Hora</label>
                  <input type="time" value={cHora} onChange={e => setCHora(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={cActivo ? "true" : "false"} onChange={e => setCActivo(e.target.value === "true")} className={inputCls}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Descripción</label>
                  <textarea value={cDescripcion} onChange={e => setCDescripcion(e.target.value)} className={inputCls} rows={2} placeholder="Descripción opcional..." />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                  <button type="submit" disabled={!canCreate || sending} className="px-5 py-2 text-sm font-semibold text-white bg-[#17609c] hover:bg-[#0f4c7a] disabled:opacity-50 rounded-lg transition">
                    {sending ? "Guardando..." : "Crear evento"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <FaFilter className="text-[10px]" /> Filtros
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input type="text" value={nombre} onChange={e => { setPage(1); setNombre(e.target.value); }} placeholder="Buscar por nombre…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17609c]" />
              </div>
              <input type="date" value={fechaDesde} onChange={e => { setPage(1); setFechaDesde(e.target.value); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17609c]" title="Desde" />
              <input type="date" value={fechaHasta} onChange={e => { setPage(1); setFechaHasta(e.target.value); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17609c]" title="Hasta" />
              <select value={activo} onChange={e => { setPage(1); setActivo(e.target.value); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]">
                <option value="">Todos los estados</option>
                <option value="true">Solo activos</option>
                <option value="false">Solo inactivos</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">
                {loading ? "Cargando..." : `${total} evento${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
              </span>
              {/* Botón mobile */}
              <button onClick={() => { setShowForm(v => !v); setMsg(null); }} className="md:hidden inline-flex items-center gap-2 bg-[#003366] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <FaPlus /> Nuevo
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Cargando eventos...</div>
            ) : errLoad ? (
              <div className="p-8 text-center text-red-500 text-sm">{errLoad}</div>
            ) : eventos.length === 0 ? (
              <div className="p-12 text-center">
                <FaCalendarAlt className="mx-auto text-gray-300 text-3xl mb-3" />
                <p className="text-gray-500 text-sm">No hay eventos para mostrar.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {eventos.map(ev => {
                        const isEdit = editingId === ev.id;
                        return (
                          <tr key={ev.id} className={`hover:bg-gray-50 transition ${!ev.activo ? "opacity-60" : ""}`}>
                            <td className="px-6 py-4">
                              {isEdit ? (
                                <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#17609c]" value={String(editRow.nombre ?? "")} onChange={e => setEditRow(r => ({ ...r, nombre: e.target.value }))} />
                              ) : <span className="font-medium text-gray-900">{ev.nombre}</span>}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {isEdit ? (
                                <input type="date" className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#17609c]" value={String(editRow.fecha ?? ev.fecha.slice(0, 10))} onChange={e => setEditRow(r => ({ ...r, fecha: e.target.value }))} />
                              ) : formatFecha(ev.fecha)}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {isEdit ? (
                                <input type="time" className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#17609c]" value={String(editRow.hora ?? normalizeTime(ev.hora))} onChange={e => setEditRow(r => ({ ...r, hora: e.target.value }))} />
                              ) : normalizeTime(ev.hora) || "-"}
                            </td>
                            <td className="px-6 py-4 text-gray-500 max-w-xs">
                              {isEdit ? (
                                <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#17609c]" value={String(editRow.descripcion ?? ev.descripcion ?? "")} onChange={e => setEditRow(r => ({ ...r, descripcion: e.target.value }))} />
                              ) : <span className="line-clamp-2">{ev.descripcion ?? "-"}</span>}
                            </td>
                            <td className="px-6 py-4">
                              {isEdit ? (
                                <label className="inline-flex items-center gap-2 text-sm">
                                  <input type="checkbox" checked={Boolean(editRow.activo ?? ev.activo)} onChange={e => setEditRow(r => ({ ...r, activo: e.target.checked }))} className="rounded" />
                                  Activo
                                </label>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ev.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                  {ev.activo ? "Activo" : "Inactivo"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 justify-end">
                                {isEdit ? (
                                  <>
                                    <button onClick={() => saveEdit(ev.id)} disabled={sending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#17609c] hover:bg-[#0f4c7a] rounded-lg disabled:opacity-50 transition">
                                      <FaSave /> Guardar
                                    </button>
                                    <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                                      <FaTimes /> Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(ev)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                                      <FaEdit /> Editar
                                    </button>
                                    <button onClick={() => setDeleteModal(ev)} disabled={sending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition">
                                      <FaTrash /> Eliminar
                                    </button>
                                  </>
                                )}
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
                  {eventos.map(ev => (
                    <div key={ev.id} className={`p-4 ${!ev.activo ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{ev.nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatFecha(ev.fecha)} {normalizeTime(ev.hora) && `• ${normalizeTime(ev.hora)}`}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ev.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {ev.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      {ev.descripcion && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ev.descripcion}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(ev)} className="flex-1 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Editar</button>
                        <button onClick={() => setDeleteModal(ev)} className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Paginación */}
            {!loading && total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Página {page} de {totalPages}</span>
                  <span>•</span>
                  <select value={limit} onChange={e => { setPage(1); setLimit(Number(e.target.value)); }} className="border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none">
                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}/página</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal eliminar */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-600 px-6 py-4">
              <h2 className="text-white font-bold text-sm">Confirmar eliminación</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-1">¿Eliminar el evento?</p>
              <p className="font-semibold text-gray-900 text-sm mb-4">"{deleteModal.nombre}"</p>
              <p className="text-xs text-gray-500">Se marcará como inactivo. Esta acción se puede revertir editando el evento.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={confirmDelete} disabled={sending} className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition">
                {sending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}