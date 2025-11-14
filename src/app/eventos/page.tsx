"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaCalendarAlt,
  FaHome,
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaSave,
  FaTimes,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
} from "react-icons/fa";

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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CreateOrUpdateResponse = {
  success: boolean;
  message?: string;
  data?: Evento;
  errors?: any;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
}

function normalizeTime(h: string | null | undefined) {
  if (!h) return "";
  const parts = h.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return h;
}

export default function EventosPage() {
  const router = useRouter();

  // Filtros y paginación (acorde a tu GET /api/eventos)
  const [nombre, setNombre] = useState("");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [activo, setActivo] = useState<string>(""); // "", "true", "false"
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [errLoad, setErrLoad] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form crear
  const [cNombre, setCNombre] = useState("");
  const [cFecha, setCFecha] = useState(todayStr());
  const [cHora, setCHora] = useState("");
  const [cDescripcion, setCDescripcion] = useState("");
  const [cActivo, setCActivo] = useState(true);

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<Evento>>({});

  const canCreate = useMemo(() => {
    return cNombre.trim().length > 0 && DATE_RE.test(cFecha) && (!cHora || TIME_RE.test(cHora));
  }, [cNombre, cFecha, cHora]);

  async function fetchEventos() {
    try {
      setLoading(true);
      setErrLoad(null);

      const params = new URLSearchParams();
      if (nombre.trim()) params.set("nombre", nombre.trim());
      if (fechaDesde) params.set("fechaDesde", fechaDesde);
      if (fechaHasta) params.set("fechaHasta", fechaHasta);
      if (activo !== "") params.set("activo", activo);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/eventos?${params.toString()}`, { cache: "no-store" });
      const json: any = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "No se pudo obtener eventos");
      }

      const lr = json as ListResponse;
      const normalized = lr.data.map((e) => ({
        ...e,
        hora: normalizeTime(e.hora),
      }));

      setEventos(normalized);
      setTotalPages(lr.pagination.totalPages);
      setTotal(lr.pagination.total);
    } catch (e: any) {
      setErrLoad(e?.message || "Error al listar eventos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, fechaDesde, fechaHasta, activo, page, limit]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || sending) return;
    setSending(true);
    setMsg(null);
    setOk(null);
    try {
      const payload = {
        nombre: cNombre.trim(),
        descripcion: cDescripcion.trim() || null,
        fecha: cFecha,
        hora: cHora || null,
        activo: cActivo,
      };

      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: CreateOrUpdateResponse = await res.json();
      if (!res.ok || !json?.data) {
        setOk(false);
        setMsg(json?.message || "No se pudo crear el evento.");
        return;
      }

      await fetchEventos();

      setOk(true);
      setMsg("Evento creado correctamente.");
      setCNombre("");
      setCDescripcion("");
      setCFecha(todayStr());
      setCHora("");
      setCActivo(true);
    } catch {
      setOk(false);
      setMsg("Error de red/servidor al crear el evento.");
    } finally {
      setSending(false);
    }
  }

  function startEdit(ev: Evento) {
    setEditingId(ev.id);
    setEditRow({
      nombre: ev.nombre,
      descripcion: ev.descripcion ?? "",
      fecha: ev.fecha.slice(0, 10),
      hora: normalizeTime(ev.hora) || "",
      activo: ev.activo,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow({});
  }

  async function saveEdit(id: number) {
    if (!editRow?.nombre || !editRow?.fecha || !DATE_RE.test(String(editRow.fecha))) {
      setOk(false);
      setMsg("Nombre y fecha (YYYY-MM-DD) son obligatorios.");
      return;
    }
    if (editRow?.hora && !TIME_RE.test(String(editRow.hora))) {
      setOk(false);
      setMsg("La hora debe tener formato HH:mm.");
      return;
    }

    setSending(true);
    setOk(null);
    setMsg(null);

    try {
      const payload: any = {
        nombre: String(editRow.nombre),
        descripcion: (editRow.descripcion ?? "") || null,
        fecha: String(editRow.fecha),
        hora: editRow.hora ? String(editRow.hora) : null,
        activo: typeof editRow.activo === "boolean" ? editRow.activo : true,
      };

      const res = await fetch(`/api/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: CreateOrUpdateResponse = await res.json();
      if (!res.ok || !json?.data) {
        setOk(false);
        setMsg(json?.message || "No se pudo actualizar el evento.");
        return;
      }

      await fetchEventos();

      setOk(true);
      setMsg("Evento actualizado correctamente.");
      cancelEdit();
    } catch {
      setOk(false);
      setMsg("Error de red/servidor al actualizar el evento.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: number) {
    const confirm = window.confirm("¿Eliminar este evento? Se marcará como inactivo.");
    if (!confirm) return;

    setSending(true);
    setMsg(null);
    setOk(null);

    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        setOk(false);
        setMsg(json?.message ?? "No se pudo eliminar el evento.");
        return;
      }

      await fetchEventos();
      setOk(true);
      setMsg("Evento eliminado.");
    } catch {
      setOk(false);
      setMsg("Error de red/servidor al eliminar el evento.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#0f172a]">
      {/* Header */}
      <header className="bg-[#003366] text-white">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-2xl" />
            <div>
              <h1 className="text-xl font-bold">Eventos</h1>
              <p className="text-sm opacity-90">Crea, edita y elimina eventos</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-white/60 px-3 py-2 rounded hover:bg-white hover:text-[#003366] transition"
          >
            <FaHome /> Inicio
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[#003366] hover:underline mb-6"
        >
          <FaArrowLeft /> Volver
        </button>

        {/* Crear nuevo evento */}
        <section className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-[#003366] mb-1">Nuevo evento</h2>
          <p className="text-sm text-gray-500 mb-4">Completa la información para registrar un nuevo evento.</p>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={cNombre}
                onChange={(e) => setCNombre(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                placeholder="Ej. Culto dominical"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={cFecha}
                onChange={(e) => setCFecha(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                value={cHora}
                onChange={(e) => setCHora(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                placeholder="HH:mm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={cDescripcion}
                onChange={(e) => setCDescripcion(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                placeholder="Detalle del evento…"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="c-activo"
                type="checkbox"
                checked={cActivo}
                onChange={(e) => setCActivo(e.target.checked)}
              />
              <label htmlFor="c-activo" className="text-sm text-gray-700">Activo</label>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={!canCreate || sending}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-md text-white transition ${
                  !canCreate || sending ? "bg-[#17609c]/50 cursor-not-allowed" : "bg-[#17609c] hover:bg-[#0f4c7a]"
                }`}
              >
                <FaPlus /> Crear evento
              </button>
            </div>
          </form>
        </section>

        {/* Filtros */}
        <section className="bg-white rounded-lg shadow-md p-4 border border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setPage(1); setNombre(e.target.value); }}
                placeholder="Buscar por nombre/desc/lugar…"
                className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
              />
            </div>
            <div>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setPage(1); setFechaDesde(e.target.value); }}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Desde"
              />
            </div>
            <div>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setPage(1); setFechaHasta(e.target.value); }}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Hasta"
              />
            </div>
            <div>
              <select
                value={activo}
                onChange={(e) => { setPage(1); setActivo(e.target.value); }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        </section>

        {/* Lista + edición */}
        <section className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-[#003366] font-semibold">Eventos registrados</h3>
          </div>

          {loading ? (
            <div className="p-6 text-gray-600">Cargando…</div>
          ) : errLoad ? (
            <div className="p-6 text-red-600">{errLoad}</div>
          ) : eventos.length === 0 ? (
            <div className="p-6 text-gray-500">No hay eventos para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-sm">
                  <tr>
                    <th className="text-left px-6 py-3">Nombre</th>
                    <th className="text-left px-6 py-3">Fecha</th>
                    <th className="text-left px-6 py-3">Hora</th>
                    <th className="text-left px-6 py-3">Descripción</th>
                    <th className="text-left px-6 py-3">Activo</th>
                    <th className="text-right px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventos.map((ev) => {
                    const isEdit = editingId === ev.id;
                    return (
                      <tr key={ev.id} className="text-sm">
                        {/* Nombre */}
                        <td className="px-6 py-3">
                          {isEdit ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={String(editRow.nombre ?? "")}
                              onChange={(e) => setEditRow((r) => ({ ...r, nombre: e.target.value }))}
                            />
                          ) : (
                            <span className="font-medium">{ev.nombre}</span>
                          )}
                        </td>
                        {/* Fecha */}
                        <td className="px-6 py-3">
                          {isEdit ? (
                            <input
                              type="date"
                              className="border rounded px-2 py-1"
                              value={String(editRow.fecha ?? ev.fecha.slice(0, 10))}
                              onChange={(e) => setEditRow((r) => ({ ...r, fecha: e.target.value }))}
                            />
                          ) : (
                            <span>{ev.fecha?.slice(0, 10)}</span>
                          )}
                        </td>
                        {/* Hora */}
                        <td className="px-6 py-3">
                          {isEdit ? (
                            <input
                              type="time"
                              className="border rounded px-2 py-1"
                              value={String(editRow.hora ?? normalizeTime(ev.hora))}
                              onChange={(e) => setEditRow((r) => ({ ...r, hora: e.target.value }))}
                            />
                          ) : (
                            <span>{normalizeTime(ev.hora) || "-"}</span>
                          )}
                        </td>
                        {/* Descripción */}
                        <td className="px-6 py-3">
                          {isEdit ? (
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={String(editRow.descripcion ?? ev.descripcion ?? "")}
                              onChange={(e) => setEditRow((r) => ({ ...r, descripcion: e.target.value }))}
                            />
                          ) : (
                            <span className="line-clamp-2 max-w-[360px]">
                              {ev.descripcion ?? "-"}
                            </span>
                          )}
                        </td>
                        {/* Activo */}
                        <td className="px-6 py-3">
                          {isEdit ? (
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(editRow.activo ?? ev.activo)}
                                onChange={(e) => setEditRow((r) => ({ ...r, activo: e.target.checked }))}
                              />
                              <span>Activo</span>
                            </label>
                          ) : (
                            <span className={ev.activo ? "text-green-700" : "text-gray-500"}>
                              {ev.activo ? "Sí" : "No"}
                            </span>
                          )}
                        </td>

                        {/* Acciones (con Eliminar + confirm) */}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            {isEdit ? (
                              <>
                                <button
                                  onClick={() => saveEdit(ev.id)}
                                  disabled={sending}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded text-white bg-[#17609c] hover:bg-[#0f4c7a] disabled:opacity-50"
                                  title="Guardar"
                                >
                                  <FaSave /> Guardar
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50"
                                  title="Cancelar"
                                >
                                  <FaTimes /> Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(ev)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50"
                                  title="Editar"
                                >
                                  <FaEdit /> Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(ev.id)}
                                  disabled={sending}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                  title="Eliminar"
                                >
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
          )}
        </section>

        {/* Paginación */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-600">
            Total: {total} — Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
            >
              <FaChevronLeft /> Anterior
            </button>
            <select
              value={limit}
              onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
              className="border rounded px-2 py-1"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}/página</option>
              ))}
            </select>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-2 px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente <FaChevronRight />
            </button>
          </div>
        </div>

        {/* feedback */}
        {msg && (
          <div
            className={`mt-4 px-4 py-3 rounded-md text-sm border ${
              ok ? "bg-green-50 text-green-800 border-green-200"
                 : "bg-yellow-50 text-yellow-800 border-yellow-200"
            }`}
          >
            {msg}
          </div>
        )}
      </main>
    </div>
  );
}
