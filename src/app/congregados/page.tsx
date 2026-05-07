"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  FaUsers, FaUserPlus, FaSearch, FaEdit, FaTrash,
  FaChevronLeft, FaChevronRight, FaExclamationTriangle,
  FaTimes, FaSave, FaPlus, FaFilter, FaCheckCircle,
} from "react-icons/fa";
import Sidebar from "@/components/SideBar";
import { EstadoCivil } from "@/models/Congregado";

type CongregadoRow = {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string;
  segundoTelefono?: string;
  estadoCivil: string;
  ministerio: string;
  segundoMinisterio?: string;
  urlFotoCedula: string;
  fechaIngreso: string;
  estado: number;
  observaciones?: string;
  fechaNacimiento?: string;
  correo?: string;
  profesion?: string;
  direccion?: string;
};

type FormState = {
  nombre: string;
  cedula: string;
  fechaIngreso: string;
  telefono: string;
  segundoTelefono: string;
  estadoCivil: string;
  ministerio: string;
  segundoMinisterio: string;
  urlFotoCedula: string;
  estado: number;
  observaciones: string;
  fechaNacimiento: string;
  correo: string;
  profesion: string;
  direccion: string;
};

const FORM_INICIAL: FormState = {
  nombre: "", cedula: "", fechaIngreso: "", telefono: "",
  segundoTelefono: "", estadoCivil: EstadoCivil.SOLTERO,
  ministerio: "", segundoMinisterio: "",
  urlFotoCedula: "https://placeholder.com/cedula.jpg", estado: 1,
  observaciones: "", fechaNacimiento: "", correo: "", profesion: "", direccion: "",
};

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  soltero: "Soltero/a", casado: "Casado/a", divorciado: "Divorciado/a",
  viudo: "Viudo/a", union_libre: "Unión libre",
};

type PageSize = 10 | 25 | 50;

const inputBase =
  "shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 text-sm leading-tight " +
  "focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-colors";
const inputClass = inputBase + " border-gray-300";
const inputClassError = inputBase + " border-red-400 bg-red-50/30";

type CongregadoFormErrors = {
  nombre?: string; cedula?: string; fechaIngreso?: string;
  telefono?: string; ministerio?: string; urlFotoCedula?: string; correo?: string;
};
type CongregadoFormTouched = Partial<Record<keyof CongregadoFormErrors, boolean>>;

function validarCampoCongregado(campo: keyof CongregadoFormErrors, valor: string): string | undefined {
  switch (campo) {
    case 'nombre':
      if (!valor.trim()) return 'El nombre completo es obligatorio.';
      if (valor.trim().length < 3) return 'Debe tener al menos 3 caracteres.';
      return undefined;
    case 'cedula':
      if (!valor.trim()) return 'La cédula es obligatoria.';
      return undefined;
    case 'fechaIngreso':
      if (!valor) return 'La fecha de ingreso es obligatoria.';
      return undefined;
    case 'telefono':
      if (!valor.trim()) return 'El teléfono es obligatorio.';
      return undefined;
    case 'ministerio':
      if (!valor.trim()) return 'El ministerio es obligatorio.';
      return undefined;
    case 'urlFotoCedula':
      if (!valor.trim()) return 'La URL de la foto cédula es obligatoria.';
      return undefined;
    case 'correo':
      if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor))
        return 'Ingresa un correo válido, por ejemplo: nombre@correo.com';
      return undefined;
    default:
      return undefined;
  }
}

const formatFecha = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("es-CR") : "-";

const Badge = ({ activo }: { activo: boolean }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
    {activo ? "Activo" : "Inactivo"}
  </span>
);

export default function CongregadosPage() {
  const [data, setData] = useState<CongregadoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  // filtros locales
  const [filtros, setFiltros] = useState({ nombre: "", cedula: "", estado: "todos" });

  // paginación
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  // selección múltiple
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  // modal crear/editar
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<CongregadoRow | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [formErrors, setFormErrors] = useState<CongregadoFormErrors>({});
  const [formTouched, setFormTouched] = useState<CongregadoFormTouched>({});

  // modal eliminar masivo
  const [modalDelete, setModalDelete] = useState(false);
  const [elimPerm, setElimPerm] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // ── Carga ──────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      setLoading(true); setMensaje(""); setEsError(false);
      const res = await fetch("/api/congregados?all=true");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMensaje(json.message || "Error al cargar congregados"); setEsError(true); setData([]); return;
      }
      setData(json.data || []);
    } catch {
      setMensaje("Error de conexión."); setEsError(true); setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresh(cargar);
  useEffect(() => { setPagina(1); setSeleccionados(new Set()); }, [filtros, pageSize]);

  // ── Filtrado + paginación ──────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const n = filtros.nombre.trim().toLowerCase();
    const c = filtros.cedula.trim().toLowerCase();
    return data.filter(r => {
      const okN = !n || r.nombre.toLowerCase().includes(n);
      const okC = !c || r.cedula.toLowerCase().includes(c);
      const okE = filtros.estado === "todos" || String(r.estado) === filtros.estado;
      return okN && okC && okE;
    });
  }, [data, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = useMemo(() => {
    const ini = (paginaActual - 1) * pageSize;
    return filtrados.slice(ini, ini + pageSize);
  }, [filtrados, paginaActual, pageSize]);

  // ── Selección ─────────────────────────────────────────────────────────────
  const toggleFila = (id: number) =>
    setSeleccionados(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const limpiarSeleccion = () => setSeleccionados(new Set());

  const seleccionadosData = useMemo(
    () => data.filter(r => seleccionados.has(r.id)),
    [data, seleccionados]
  );

  // ── Crear / Editar ─────────────────────────────────────────────────────────
  const handleCampoCong = (campo: keyof CongregadoFormErrors, valor: string) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setFormTouched(prev => ({ ...prev, [campo]: true }));
    setFormErrors(prev => ({ ...prev, [campo]: validarCampoCongregado(campo, valor) }));
  };

  // Solo valida al perder foco — NO reescribe el valor (evita revertir cambios)
  const handleBlurCong = (campo: keyof CongregadoFormErrors) => {
    setFormTouched(prev => ({ ...prev, [campo]: true }));
    setFormErrors(prev => ({ ...prev, [campo]: validarCampoCongregado(campo, String((form as any)[campo] ?? '')) }));
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setFormErrors({}); setFormTouched({});
    setShowForm(true);
    setMensaje(""); setEsError(false);
  };

  const abrirEditar = (row: CongregadoRow) => {
    setEditando(row);
    setFormErrors({}); setFormTouched({});
    setForm({
      nombre: row.nombre || "",
      cedula: row.cedula || "",
      fechaIngreso: row.fechaIngreso ? new Date(row.fechaIngreso).toISOString().split("T")[0] : "",
      telefono: row.telefono || "",
      segundoTelefono: row.segundoTelefono || "",
      estadoCivil: row.estadoCivil || EstadoCivil.SOLTERO,
      ministerio: row.ministerio || "",
      segundoMinisterio: row.segundoMinisterio || "",
      urlFotoCedula: row.urlFotoCedula || "",
      estado: row.estado,
      observaciones: row.observaciones || "",
      fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento).toISOString().split("T")[0] : "",
      correo: row.correo || "",
      profesion: row.profesion || "",
      direccion: row.direccion || "",
    });
    setShowForm(true);
    setMensaje(""); setEsError(false);
  };

  const guardar = async () => {
    // Validate all required fields first
    const camposReq: (keyof CongregadoFormErrors)[] = ['nombre', 'cedula', 'fechaIngreso', 'telefono', 'ministerio', 'urlFotoCedula'];
    const newErrors: CongregadoFormErrors = {};
    const newTouched: CongregadoFormTouched = {};
    for (const campo of camposReq) {
      newTouched[campo] = true;
      const err = validarCampoCongregado(campo, String((form as any)[campo] ?? ''));
      if (err) newErrors[campo] = err;
    }
    if (form.correo) {
      newTouched.correo = true;
      const errCorreo = validarCampoCongregado('correo', form.correo);
      if (errCorreo) newErrors.correo = errCorreo;
    }
    setFormTouched(prev => ({ ...prev, ...newTouched }));
    setFormErrors(prev => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;
    setGuardando(true); setMensaje(""); setEsError(false);
    try {
      const body = {
        ...form,
        segundoTelefono: form.segundoTelefono || null,
        segundoMinisterio: form.segundoMinisterio || null,
        // Garantizar URL válida para no romper validación
        urlFotoCedula: form.urlFotoCedula || "https://placeholder.com/cedula.jpg",
        // Campos de fecha opcionales: excluir si están vacíos
        ...(form.fechaNacimiento ? {} : { fechaNacimiento: undefined }),
      };

      const url = editando ? `/api/congregados/${editando.id}` : "/api/congregados";
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setMensaje(json.message || "Error al guardar"); setEsError(true); return;
      }

      setMensaje(editando ? "Congregado actualizado exitosamente." : "Congregado registrado exitosamente.");
      setShowForm(false); setEditando(null);
      await cargar();
    } catch {
      setMensaje("Error de conexión."); setEsError(true);
    } finally {
      setGuardando(false);
    }
  };

  // ── Reactivar ─────────────────────────────────────────────────────────────
  const reactivar = async (id: number) => {
    try {
      const res = await fetch(`/api/congregados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: 1 }),
      });
      const json = await res.json();
      if (json.success) {
        setMensaje("Congregado reactivado exitosamente.");
        setEsError(false);
        await cargar();
      } else {
        setMensaje(json.message || "Error al reactivar"); setEsError(true);
      }
    } catch {
      setMensaje("Error de conexión."); setEsError(true);
    }
  };

  // ── Eliminación masiva ────────────────────────────────────────────────────
  const eliminarSeleccionados = async () => {
    setEliminando(true); setMensaje(""); setEsError(false);
    try {
      const ids = [...seleccionados];
      await Promise.allSettled(
        ids.map(id => fetch(`/api/congregados/${id}${elimPerm ? "?permanente=true" : ""}`, { method: "DELETE" }))
      );
      setMensaje(`${ids.length} congregado(s) ${elimPerm ? "eliminado(s) permanentemente" : "desactivado(s)"}.`);
      setModalDelete(false); setElimPerm(false); limpiarSeleccion();
      await cargar();
    } catch {
      setMensaje("Error al eliminar."); setEsError(true);
    } finally {
      setEliminando(false);
    }
  };

  // ── Paginación visible ────────────────────────────────────────────────────
  const paginasVisibles = useMemo(() => {
    const delta = 1; const rango: number[] = [];
    for (let i = Math.max(1, paginaActual - delta); i <= Math.min(totalPaginas, paginaActual + delta); i++) rango.push(i);
    if (rango[0] > 2) rango.unshift(-1);
    if (rango[0] > 1) rango.unshift(1);
    if (rango[rango.length - 1] < totalPaginas - 1) rango.push(-2);
    if (rango[rango.length - 1] < totalPaginas) rango.push(totalPaginas);
    return rango;
  }, [paginaActual, totalPaginas]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="congregados" pageTitle="Congregados" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 my-4 sm:my-6">

            {/* Cabecera */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#003366]">Gestión de Congregados</h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={abrirCrear}
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <FaPlus className="text-xs" /> Nuevo
                </button>
                <div className="relative w-[80px] h-[55px] hidden sm:block">
                  <Image src="/logo-iglesia.png" alt="Logo" fill className="object-contain" sizes="80px" />
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Registra, consulta, edita y gestiona los congregados de la iglesia.
            </p>

            {/* Mensaje global */}
            {mensaje && (
              <div className={`mb-4 p-3.5 rounded-lg text-sm border ${esError ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                }`}>
                {mensaje}
                {esError && <button onClick={cargar} className="ml-4 underline font-bold">Reintentar</button>}
              </div>
            )}

            {/* Filtros */}
            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-[#003366] mb-3 flex items-center gap-2">
                <FaFilter className="text-xs" /> Filtros
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-gray-600 text-xs font-semibold mb-1">Nombre</label>
                  <input type="text" placeholder="Ej: María Solano"
                    value={filtros.nombre}
                    onChange={e => setFiltros({ ...filtros, nombre: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-semibold mb-1">Cédula</label>
                  <input type="text" placeholder="Ej: 5-0291-0483"
                    value={filtros.cedula}
                    onChange={e => setFiltros({ ...filtros, cedula: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-semibold mb-1">Estado</label>
                  <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })} className={inputClass}>
                    <option value="todos">Todos</option>
                    <option value="1">Activos</option>
                    <option value="0">Inactivos</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFiltros({ nombre: "", cedula: "", estado: "todos" })}
                  className="px-4 py-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition">
                  Limpiar
                </button>
                <button onClick={cargar} disabled={loading}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#003366] hover:bg-[#004488]"}`}>
                  {loading ? "Actualizando..." : "Recargar"}
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <FaUsers className="text-xs text-[#003366]" />
                  <strong className="text-[#003366]">{filtrados.length}</strong> resultado(s)
                  {seleccionados.size > 0 && (
                    <span className="ml-1 text-gray-500">
                      · <strong className="text-[#003366]">{seleccionados.size}</strong> seleccionado(s)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="hidden sm:inline">Filas:</span>
                  {([10, 25, 50] as PageSize[]).map(n => (
                    <button key={n} onClick={() => setPageSize(n)}
                      className={`w-8 h-7 rounded-md font-semibold transition ${pageSize === n ? "bg-[#003366] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {seleccionados.size > 0 && (
                <div className="flex flex-col gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <span className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
                    <FaTrash className="text-red-500 flex-shrink-0" />
                    {seleccionados.size} congregado(s) seleccionado(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setElimPerm(false); setModalDelete(true); }}
                      aria-label="Eliminar seleccionados"
                      className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                      <FaTrash className="text-xs" /> Eliminar seleccionados
                    </button>
                    <button onClick={limpiarSeleccion} className="text-xs text-red-600 hover:text-red-800 underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tabla (desktop) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 mb-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#003366] text-white">
                    <th className="px-3 py-3 w-10"><span className="sr-only">Sel.</span></th>
                    {["ID", "Nombre", "Cédula", "Teléfono", "Estado Civil", "Ministerio", "Estado", "Ingreso", "Acciones"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody data-testid="table-body">
                  {loading ? (
                    <tr><td colSpan={10} className="p-8 text-center text-gray-400 text-sm">Cargando datos...</td></tr>
                  ) : paginados.length > 0 ? (
                    paginados.map(r => {
                      const checked = seleccionados.has(r.id);
                      return (
                        <tr key={r.id} className={`border-t transition-colors ${checked ? "bg-blue-50" : r.estado === 0 ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-blue-50/30"
                          }`}>
                          <td className="px-3 py-3 text-center">
                            <input type="checkbox" checked={checked} onChange={() => toggleFila(r.id)}
                              className="w-4 h-4 accent-[#003366] cursor-pointer" />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-500">{r.id}</td>
                          <td className={`px-4 py-3 font-medium max-w-[160px] truncate ${r.estado === 0 ? "line-through text-gray-400" : "text-gray-800"}`}>
                            {r.nombre}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.cedula}</td>
                          <td className="px-4 py-3 text-gray-600">{r.telefono}</td>
                          <td className="px-4 py-3 text-gray-600">{ESTADO_CIVIL_LABELS[r.estadoCivil] || r.estadoCivil}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{r.ministerio}</td>
                          <td className="px-4 py-3"><Badge activo={r.estado === 1} /></td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatFecha(r.fechaIngreso)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {r.estado === 0 && (
                                <button onClick={() => reactivar(r.id)}
                                  className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap">
                                  <FaCheckCircle className="text-xs" /> Activar
                                </button>
                              )}
                              <button onClick={() => abrirEditar(r)}
                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap">
                                <FaEdit className="text-xs" /> Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-gray-400">
                        <FaSearch className="mx-auto mb-2 text-2xl opacity-30" />
                        <p className="text-sm">No se encontraron resultados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tarjetas (mobile) */}
            <div className="md:hidden mb-4">
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  Cargando datos...
                </div>
              ) : paginados.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                  <FaSearch className="mx-auto mb-2 text-2xl opacity-30" />
                  <p className="text-sm">No se encontraron resultados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginados.map(r => {
                    const checked = seleccionados.has(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl border shadow-sm p-4 transition-colors ${
                          checked ? "bg-blue-50 border-blue-200" : r.estado === 0 ? "bg-red-50/30 border-gray-200" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFila(r.id)}
                              className="w-4 h-4 accent-[#003366] cursor-pointer mt-0.5 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${r.estado === 0 ? "line-through text-gray-400" : "text-gray-900"}`}>
                                {r.nombre}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">#{r.id} · {r.cedula}</p>
                            </div>
                          </div>
                          <Badge activo={r.estado === 1} />
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-3 pl-6">
                          {r.telefono && <p><span className="font-semibold">Tel:</span> {r.telefono}</p>}
                          {r.ministerio && <p><span className="font-semibold">Ministerio:</span> {r.ministerio}</p>}
                          {r.estadoCivil && <p><span className="font-semibold">Est. Civil:</span> {ESTADO_CIVIL_LABELS[r.estadoCivil] || r.estadoCivil}</p>}
                          <p><span className="font-semibold">Ingreso:</span> {formatFecha(r.fechaIngreso)}</p>
                        </div>
                        <div className="pl-6 flex items-center gap-2">
                          {r.estado === 0 && (
                            <button
                              onClick={() => reactivar(r.id)}
                              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              <FaCheckCircle className="text-xs" /> Activar
                            </button>
                          )}
                          <button
                            onClick={() => abrirEditar(r)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            <FaEdit className="text-xs" /> Editar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  Página {paginaActual} de {totalPaginas} · {(paginaActual - 1) * pageSize + 1}–{Math.min(paginaActual * pageSize, filtrados.length)} de {filtrados.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  {paginasVisibles.map((p, i) =>
                    p < 0 ? (
                      <span key={`e-${i}`} className="w-8 text-center text-gray-400 text-xs">…</span>
                    ) : (
                      <button key={p} onClick={() => setPagina(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${p === paginaActual ? "bg-[#003366] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                        {p}
                      </button>
                    )
                  )}
                  <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
            {totalPaginas <= 1 && filtrados.length > 0 && (
              <p className="text-xs text-gray-400 text-right">{filtrados.length} de {data.length} registros</p>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL CREAR / EDITAR ────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="modal-form">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#003366] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold flex items-center gap-2">
                {editando ? <><FaEdit className="text-sm" /> Editar Congregado — ID: {editando.id}</> : <><FaUserPlus className="text-sm" /> Registrar Congregado</>}
              </h2>
              <button onClick={() => { setShowForm(false); setEditando(null); }} className="text-white/70 hover:text-white transition">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label htmlFor="nombre" className="block text-gray-700 text-xs font-semibold mb-1.5">Nombre completo *</label>
                  <input id="nombre" type="text" value={form.nombre}
                    onChange={e => handleCampoCong('nombre', e.target.value)}
                    onBlur={() => handleBlurCong('nombre')}
                    className={formTouched.nombre && formErrors.nombre ? inputClassError : inputClass}
                    placeholder="Ej: María Fernanda Solano Mora" />
                  {formTouched.nombre && formErrors.nombre && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Cédula */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Cédula *</label>
                  <input type="text" value={form.cedula}
                    onChange={e => handleCampoCong('cedula', e.target.value)}
                    onBlur={() => handleBlurCong('cedula')}
                    className={formTouched.cedula && formErrors.cedula ? inputClassError : inputClass}
                    placeholder="5-0291-0483" />
                  {formTouched.cedula && formErrors.cedula && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.cedula}</p>
                  )}
                </div>

                {/* Fecha ingreso */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de ingreso a la congregación *</label>
                  <input type="date" value={form.fechaIngreso}
                    onChange={e => handleCampoCong('fechaIngreso', e.target.value)}
                    onBlur={() => handleBlurCong('fechaIngreso')}
                    className={formTouched.fechaIngreso && formErrors.fechaIngreso ? inputClassError : inputClass} />
                  {formTouched.fechaIngreso && formErrors.fechaIngreso && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.fechaIngreso}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Teléfono *</label>
                  <input type="tel" value={form.telefono}
                    onChange={e => handleCampoCong('telefono', e.target.value)}
                    onBlur={() => handleBlurCong('telefono')}
                    className={formTouched.telefono && formErrors.telefono ? inputClassError : inputClass}
                    placeholder="8888-8888" />
                  {formTouched.telefono && formErrors.telefono && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.telefono}</p>
                  )}
                </div>

                {/* Segundo teléfono */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Segundo teléfono</label>
                  <input type="tel" value={form.segundoTelefono} onChange={e => setForm(prev => ({ ...prev, segundoTelefono: e.target.value }))} className={inputClass} placeholder="Opcional" />
                </div>

                {/* Estado civil */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Estado civil *</label>
                  <select value={form.estadoCivil} onChange={e => setForm(prev => ({ ...prev, estadoCivil: e.target.value }))} className={inputClass}>
                    {Object.entries(ESTADO_CIVIL_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Estado</label>
                  <select value={form.estado} onChange={e => setForm(prev => ({ ...prev, estado: Number(e.target.value) }))} className={inputClass}>
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>

                {/* Ministerio */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Ministerio *</label>
                  <input type="text" value={form.ministerio}
                    onChange={e => handleCampoCong('ministerio', e.target.value)}
                    onBlur={() => handleBlurCong('ministerio')}
                    className={formTouched.ministerio && formErrors.ministerio ? inputClassError : inputClass}
                    placeholder="Ej: Alabanza" />
                  {formTouched.ministerio && formErrors.ministerio && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.ministerio}</p>
                  )}
                </div>

                {/* Segundo ministerio */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Segundo ministerio</label>
                  <input type="text" value={form.segundoMinisterio} onChange={e => setForm(prev => ({ ...prev, segundoMinisterio: e.target.value }))} className={inputClass} placeholder="Opcional" />
                </div>

                {/* URL foto cédula */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">URL foto cédula *</label>
                  <input type="url" value={form.urlFotoCedula}
                    onChange={e => handleCampoCong('urlFotoCedula', e.target.value)}
                    onBlur={() => handleBlurCong('urlFotoCedula')}
                    className={formTouched.urlFotoCedula && formErrors.urlFotoCedula ? inputClassError : inputClass}
                    placeholder="https://..." />
                  {formTouched.urlFotoCedula && formErrors.urlFotoCedula && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.urlFotoCedula}</p>
                  )}
                </div>

                {/* Fecha de nacimiento */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de nacimiento</label>
                  <input type="date" value={form.fechaNacimiento} onChange={e => setForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))} className={inputClass} />
                </div>

                {/* Correo electrónico */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Correo electrónico (opcional)</label>
                  <input type="email" value={form.correo}
                    onChange={e => handleCampoCong('correo', e.target.value)}
                    onBlur={() => handleBlurCong('correo')}
                    className={formTouched.correo && formErrors.correo ? inputClassError : inputClass}
                    placeholder="Ej: correo@ejemplo.com" />
                  {formTouched.correo && formErrors.correo && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.correo}</p>
                  )}
                </div>

                {/* Oficio o profesión */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Oficio o profesión</label>
                  <input type="text" value={form.profesion} onChange={e => setForm(prev => ({ ...prev, profesion: e.target.value }))} className={inputClass} placeholder="Ej: Estudiante, Ingeniero" />
                </div>

                {/* Dirección */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Dirección</label>
                  <input type="text" value={form.direccion} onChange={e => setForm(prev => ({ ...prev, direccion: e.target.value }))} className={inputClass} placeholder="Dirección completa" />
                </div>

                {/* Observaciones */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Observaciones</label>
                  <textarea value={form.observaciones} onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))} rows={3} className={inputClass + ' resize-none'} placeholder="Notas adicionales..." />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => { setShowForm(false); setEditando(null); }} disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                className={`px-5 py-2 text-sm rounded-lg font-semibold text-white flex items-center gap-2 transition ${guardando ? "bg-gray-400 cursor-not-allowed" : "bg-[#003366] hover:bg-[#004488]"}`}>
                <FaSave className="text-xs" />
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR ─────────────────────────────────────────────────── */}
      {modalDelete && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4" data-testid="modal-delete">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <FaExclamationTriangle className="text-white text-lg flex-shrink-0" />
              <h2 className="text-white font-bold text-base">Confirmar eliminación</h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Se {elimPerm ? "eliminará permanentemente" : "desactivará"} a los siguientes{" "}
                <strong>{seleccionadosData.length}</strong> congregado(s):
              </p>
              <ul className="mb-5 max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {seleccionadosData.map(a => (
                  <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-medium text-gray-800 truncate">{a.nombre}</span>
                    <span className="text-gray-400 text-xs ml-3 flex-shrink-0">{a.cedula}</span>
                  </li>
                ))}
              </ul>

              <div className={`p-3.5 rounded-xl border transition-colors ${elimPerm ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={elimPerm} onChange={e => setElimPerm(e.target.checked)} className="w-4 h-4 accent-red-600" />
                  <div>
                    <p className={`text-sm font-semibold ${elimPerm ? "text-red-700" : "text-gray-700"}`}>Eliminación permanente</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {elimPerm ? "Se borrarán definitivamente de la base de datos." : "Solo se marcarán como inactivos."}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setModalDelete(false); setElimPerm(false); }} disabled={eliminando}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition">
                Cancelar
              </button>
              <button onClick={eliminarSeleccionados} disabled={eliminando}
                className={`px-5 py-2 text-sm rounded-lg font-semibold text-white transition ${eliminando ? "bg-gray-400 cursor-not-allowed" : elimPerm ? "bg-red-700 hover:bg-red-800" : "bg-red-600 hover:bg-red-700"}`}>
                {eliminando ? "Procesando..." : elimPerm ? "Eliminar permanentemente" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}