'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  FaHome, FaUserPlus, FaList, FaSignOutAlt,
  FaSearch, FaEdit, FaTrash, FaUsers,
  FaChevronLeft, FaChevronRight, FaExclamationTriangle, 
FaCalendarAlt
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { AsociadoResponse } from '@/dto/asociado.dto';
import Sidebar from '@/components/SideBar';

/* ─── Menú (sin "Eliminar Asociados" porque ahora esta vista lo maneja) ─── */
const menuItems = [
    { id: 'inicio',             href: '/',                   icon: FaHome,       label: 'Inicio'                },
    { id: 'listado',            href: '/consulta-asociados', icon: FaList,       label: 'Listado Asociados'       },
    { id: 'Eventos',            href: '/eventos',           icon: FaCalendarAlt, label: 'Eventos'               },
    {id: 'Gestión Usuarios', href: '/gestion-usuarios', icon: FaUserPlus,   label: 'Gestión de Usuarios'  },
    { id: 'Reportes',            href: '/reportes',         icon: FaList,       label: 'Reportes'              },
    { id: 'cerrar',             href: '#',                   icon: FaSignOutAlt, label: 'Cerrar Sesión'         },
];

type AsociadoRow = {
  id: number; nombreCompleto: string; cedula: string;
  correo?: string; telefono?: string; ministerio?: string;
  direccion?: string; fechaIngreso: string; estado: number;
};

type FormularioEdicion = {
  nombreCompleto: string; cedula: string; correo: string;
  telefono: string; telefonoContacto: string; ministerio: string; direccion: string;
  fechaIngreso: string; fechaNacimiento: string; estadoCivil: string;
  profesion: string; anosCongregarse: number | ''; fechaAceptacion: string;
  perteneceJuntaDirectiva: boolean; puestoJuntaDirectiva: string;
  estado: number; observaciones: string; fechaInactivo: string;
};

type PageSize = 10 | 25 | 50;

const inputClass =
  'shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 text-sm leading-tight ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] border-gray-300 transition-colors';

/* ─── Helpers ─── */
const formatFecha = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('es-CR') : '-';

const Badge = ({ activo }: { activo: boolean }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
    activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }`}>
    {activo ? 'Activo' : 'Eliminado'}
  </span>
);

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════════ */
export default function ConsultarAsociadosPage() {
  const [data,      setData]      = useState<AsociadoRow[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [mensaje,   setMensaje]   = useState('');
  const [erroresLista, setErroresLista] = useState<string[]>([]);
  const [esError,   setEsError]   = useState(false);

  /* Filtros */
  const [filtros, setFiltros] = useState({ nombreCompleto: '', cedula: '', estado: 'todos' });

  /* Paginación */
  const [pagina,    setPagina]    = useState(1);
  const [pageSize,  setPageSize]  = useState<PageSize>(10);

  /* Selección múltiple */
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  /* Modal edición */
  const [modalEditOpen,     setModalEditOpen]     = useState(false);
  const [asociadoEditando,  setAsociadoEditando]  = useState<AsociadoRow | null>(null);
  const [formulario,        setFormulario]        = useState<FormularioEdicion>({
    nombreCompleto: '', cedula: '', correo: '', telefono: '', telefonoContacto: '',
    ministerio: '', direccion: '', fechaIngreso: '', fechaNacimiento: '', estadoCivil: 'Soltero(a)',
    profesion: '', anosCongregarse: '', fechaAceptacion: '', perteneceJuntaDirectiva: false,
    puestoJuntaDirectiva: '', estado: 1, observaciones: '', fechaInactivo: '',
  });
  const [guardando, setGuardando] = useState(false);

  /* Modal confirmación eliminación masiva */
  const [modalDeleteOpen,    setModalDeleteOpen]    = useState(false);
  const [eliminacionPerm,    setEliminacionPerm]    = useState(false);
  const [eliminando,         setEliminando]         = useState(false);

  /* ─── Carga de datos ─── */
  const cargar = useCallback(async () => {
    try {
      setLoading(true); setMensaje(''); setEsError(false);
      const res  = await fetch('/api/asociados');
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al consultar asociados');
        setEsError(true); setData([]); return;
      }
      setData(
        (json.data || []).map((a: AsociadoResponse) => ({
          ...a,
          fechaIngreso: a.fechaIngreso ? new Date(a.fechaIngreso).toISOString() : '',
        }))
      );
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'Error de conexión.');
      setEsError(true); setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* Resetear página y selección cuando cambian filtros o pageSize */
  useEffect(() => { setPagina(1); setSeleccionados(new Set()); }, [filtros, pageSize]);

  /* ─── Filtrado y paginación ─── */
  const filtrados = useMemo(() => {
    const n = filtros.nombreCompleto.trim().toLowerCase();
    const c = filtros.cedula.trim().toLowerCase();
    return data.filter(r => {
      const okN = !n || r.nombreCompleto?.toLowerCase().includes(n);
      const okC = !c || r.cedula?.toLowerCase().includes(c);
      const okE = filtros.estado === 'todos' || String(r.estado) === filtros.estado;
      return okN && okC && okE;
    });
  }, [data, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);

  const paginados = useMemo(() => {
    const inicio = (paginaActual - 1) * pageSize;
    return filtrados.slice(inicio, inicio + pageSize);
  }, [filtrados, paginaActual, pageSize]);

  /* ─── Selección ─── */
  const toggleFila = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  /* Asociados seleccionados con sus datos (para el modal) */
  const seleccionadosData = useMemo(
    () => data.filter(r => seleccionados.has(r.id)),
    [data, seleccionados]
  );

  const abrirModalCrear = () => {
    setAsociadoEditando(null);
    setFormulario({
      nombreCompleto: '', cedula: '', correo: '', telefono: '', telefonoContacto: '',
      ministerio: '', direccion: '', fechaIngreso: '', fechaNacimiento: '', estadoCivil: 'Soltero(a)',
      profesion: '', anosCongregarse: '', fechaAceptacion: '', perteneceJuntaDirectiva: false,
      puestoJuntaDirectiva: '', estado: 1, observaciones: '', fechaInactivo: '',
    });
    setModalEditOpen(true); setMensaje(''); setErroresLista([]); setEsError(false);
  };

  const abrirModalEdicion = (a: AsociadoRow) => {
    setAsociadoEditando(a);
    setFormulario({
      nombreCompleto: a.nombreCompleto || '',
      cedula:         a.cedula         || '',
      correo:         a.correo         || '',
      telefono:       a.telefono       || '',
      telefonoContacto: (a as any).telefonoContacto || '',
      ministerio:     a.ministerio     || '',
      direccion:      a.direccion      || '',
      fechaIngreso:   a.fechaIngreso
        ? new Date(a.fechaIngreso).toISOString().split('T')[0]
        : '',
      fechaNacimiento: (a as any).fechaNacimiento ? new Date((a as any).fechaNacimiento).toISOString().split('T')[0] : '',
      estadoCivil: (a as any).estadoCivil || 'Soltero(a)',
      profesion: (a as any).profesion || '',
      anosCongregarse: (a as any).anosCongregarse || '',
      fechaAceptacion: (a as any).fechaAceptacion ? new Date((a as any).fechaAceptacion).toISOString().split('T')[0] : '',
      perteneceJuntaDirectiva: (a as any).perteneceJuntaDirectiva || false,
      puestoJuntaDirectiva: (a as any).puestoJuntaDirectiva || '',
      estado: a.estado,
      observaciones: (a as any).observaciones || '',
      fechaInactivo: (a as any).fechaInactivo
        ? new Date((a as any).fechaInactivo).toISOString().split('T')[0]
        : '',
    });
    setModalEditOpen(true); setMensaje(''); setErroresLista([]); setEsError(false);
  };

  const validarFormularioAsociado = (): string[] => {
    const errores: string[] = [];
    const f = formulario;

    if (!f.nombreCompleto.trim()) {
      errores.push('El nombre completo es requerido.');
    } else if (f.nombreCompleto.trim().split(/\s+/).length < 2) {
      errores.push('El nombre completo debe incluir al menos nombre y apellido.');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(f.nombreCompleto)) {
      errores.push('El nombre completo solo puede contener letras y espacios.');
    }

    if (!f.cedula.trim()) {
      errores.push('La cédula es requerida.');
    } else if (!/^[0-9-]+$/.test(f.cedula)) {
      errores.push('La cédula solo puede contener números y guiones.');
    } else if (f.cedula.trim().length < 9) {
      errores.push('La cédula debe tener al menos 9 caracteres.');
    }

    if (!f.telefono.trim()) {
      errores.push('El celular es requerido.');
    } else if (!/^[\d\s\-+()]+$/.test(f.telefono)) {
      errores.push('El celular contiene caracteres no válidos.');
    } else if (f.telefono.replace(/[\s\-+()]/g, '').length < 8) {
      errores.push('El celular debe tener al menos 8 dígitos.');
    }

    if (f.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) {
      errores.push('El formato del correo electrónico no es válido.');
    }

    if (f.telefonoContacto && f.telefonoContacto.replace(/[\s\-+()]/g, '').length < 8) {
      errores.push('El teléfono de contacto debe tener al menos 8 dígitos.');
    }

    if (f.perteneceJuntaDirectiva && !f.puestoJuntaDirectiva) {
      errores.push('El puesto en la Junta Directiva es requerido.');
    }

    if (f.anosCongregarse !== '' && (Number(f.anosCongregarse) < 0 || !Number.isInteger(Number(f.anosCongregarse)))) {
      errores.push('Los años de congregarse deben ser un número entero positivo.');
    }

    return errores;
  };

  const guardarCambios = async () => {
    const erroresValidacion = validarFormularioAsociado();
    if (erroresValidacion.length > 0) {
      setErroresLista(erroresValidacion);
      setEsError(true);
      return;
    }

    try {
      setGuardando(true); setMensaje(''); setErroresLista([]); setEsError(false);

      const url = asociadoEditando
        ? `/api/asociados/update?id=${asociadoEditando.id}`
        : '/api/asociados';
      const method = asociadoEditando ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al guardar');
        setErroresLista(Array.isArray(json.errors) ? json.errors : typeof json.errors === 'string' ? [json.errors] : []);
        setEsError(true);
        Swal.fire('Error', json.message || 'Hubo un problema al guardar', 'error');
        return;
      }
      
      Swal.fire('¡Éxito!', asociadoEditando ? 'Asociado actualizado exitosamente.' : 'Asociado registrado exitosamente.', 'success');
      setModalEditOpen(false); setAsociadoEditando(null);
      await cargar();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'Error de conexión.'); 
      setEsError(true);
      Swal.fire('Error', 'Error de conexión con el servidor', 'error');
    } finally { setGuardando(false); }
  };

  /* ─── Eliminación masiva ─── */
  const eliminarSeleccionados = async () => {
    try {
      setEliminando(true); setMensaje(''); setEsError(false);
      const ids = [...seleccionados];

      /* Llamadas en paralelo */
      const resultados = await Promise.allSettled(
        ids.map(id =>
          fetch(
            `/api/asociados/delete?id=${id}${eliminacionPerm ? '&permanente=true' : ''}`,
            { method: 'DELETE' }
          ).then(r => r.json())
        )
      );

      const fallidos = resultados.filter(r => r.status === 'rejected').length;

      if (fallidos > 0) {
        setMensaje(`${ids.length - fallidos} eliminado(s), ${fallidos} con error.`);
        setEsError(true);
      } else {
        setMensaje(
          eliminacionPerm
            ? `${ids.length} asociado(s) eliminado(s) permanentemente.`
            : `${ids.length} asociado(s) marcado(s) como eliminado(s).`
        );
      }

      setModalDeleteOpen(false);
      setEliminacionPerm(false);
      limpiarSeleccion();
      await cargar();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'Error de conexión.'); setEsError(true);
    } finally { setEliminando(false); }
  };

  /* ─── Paginación: números visibles ─── */
  const paginasVisibles = useMemo(() => {
    const delta = 1;
    const rango: number[] = [];
    for (
      let i = Math.max(1, paginaActual - delta);
      i <= Math.min(totalPaginas, paginaActual + delta);
      i++
    ) rango.push(i);
    if (rango[0] > 2)          rango.unshift(-1); // ellipsis izquierdo
    if (rango[0] > 1)          rango.unshift(1);
    if (rango[rango.length - 1] < totalPaginas - 1) rango.push(-2); // ellipsis derecho
    if (rango[rango.length - 1] < totalPaginas)     rango.push(totalPaginas);
    return rango;
  }, [paginaActual, totalPaginas]);

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="listado" pageTitle="Consultar Asociados" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 my-4 sm:my-6">

            {/* ── Cabecera ── */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#003366]">Gestión de Asociados</h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={abrirModalCrear}
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <FaUserPlus className="text-xs" /> Nuevo
                </button>
                <div className="relative w-[80px] h-[55px] hidden sm:block">
                  <Image src="/logo-iglesia.png" alt="Logo" fill className="object-contain" sizes="80px" />
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Busca, consulta, edita y gestiona los asociados registrados.
            </p>

            {/* ── Mensaje global ── */}
            {mensaje && !modalEditOpen && (
              <div className={`mb-4 p-3.5 rounded-lg text-sm border ${
                esError
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {mensaje}
              </div>
            )}

            {/* ── Filtros ── */}
            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-[#003366] mb-3 flex items-center gap-2">
                <FaSearch className="text-xs" /> Filtros de búsqueda
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-gray-600 text-xs font-semibold mb-1">Nombre</label>
                  <input
                    type="text" placeholder="Ej: Ana Mora"
                    value={filtros.nombreCompleto}
                    onChange={e => setFiltros({ ...filtros, nombreCompleto: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-semibold mb-1">Cédula</label>
                  <input
                    type="text" placeholder="Ej: 2-0403-6583"
                    value={filtros.cedula}
                    onChange={e => setFiltros({ ...filtros, cedula: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-semibold mb-1">Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
                    className={inputClass}
                  >
                    <option value="todos">Todos</option>
                    <option value="1">Activos</option>
                    <option value="0">Eliminados</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltros({ nombreCompleto: '', cedula: '', estado: 'todos' })}
                  className="px-4 py-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={cargar} disabled={loading}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors text-white ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#003366] hover:bg-[#004488]'
                  }`}
                >
                  {loading ? 'Actualizando...' : 'Recargar'}
                </button>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-2 mb-3">

              {/* Fila: conteo + filas por página */}
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
                    <button
                      key={n}
                      onClick={() => setPageSize(n)}
                      className={`w-8 h-7 rounded-md font-semibold transition-colors ${
                        pageSize === n
                          ? 'bg-[#003366] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barra de acción: solo visible cuando hay selección */}
              {seleccionados.size > 0 && (
                <div className="flex flex-col gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <span className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
                    <FaTrash className="text-red-500 flex-shrink-0" />
                    {seleccionados.size} asociado(s) seleccionado(s) para eliminar
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEliminacionPerm(false); setModalDeleteOpen(true); }}
                      className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <FaTrash className="text-xs" />
                      Eliminar seleccionados
                    </button>
                    <button
                      onClick={limpiarSeleccion}
                      className="text-xs text-red-600 hover:text-red-800 underline transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Tabla (desktop) ── */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 mb-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#003366] text-white">
                    {/* Columna checkbox */}
                    <th className="px-3 py-3 w-10">
                      <span className="sr-only">Selección</span>
                    </th>
                    {['ID', 'Nombre', 'Cédula', 'Teléfono', 'Ministerio', 'Estado', 'Ingreso', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400 text-sm">
                        Cargando datos...
                      </td>
                    </tr>
                  ) : paginados.length > 0 ? (
                    paginados.map(r => {
                      const checked = seleccionados.has(r.id);
                      return (
                        <tr
                          key={r.id}
                          className={`border-t transition-colors ${
                            checked
                              ? 'bg-blue-50'
                              : r.estado === 0
                              ? 'bg-red-50/40 hover:bg-red-50/70'
                              : 'hover:bg-blue-50/30'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFila(r.id)}
                              className="w-4 h-4 accent-[#003366] cursor-pointer"
                              aria-label={`Seleccionar ${r.nombreCompleto}`}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-500">{r.id}</td>
                          <td className={`px-4 py-3 font-medium max-w-[160px] truncate ${
                            r.estado === 0 ? 'line-through text-gray-400' : 'text-gray-800'
                          }`}>
                            {r.nombreCompleto}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.cedula}</td>
                          <td className="px-4 py-3 text-gray-600">{r.telefono || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{r.ministerio || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge activo={r.estado === 1} />
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatFecha(r.fechaIngreso)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => abrirModalEdicion(r)}
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <FaEdit className="text-xs" /> Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-gray-400">
                        <FaSearch className="mx-auto mb-2 text-2xl opacity-30" />
                        <p className="text-sm">No se encontraron resultados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Tarjetas (mobile) ── */}
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
                          checked ? 'bg-blue-50 border-blue-200' : r.estado === 0 ? 'bg-red-50/30 border-gray-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFila(r.id)}
                              className="w-4 h-4 accent-[#003366] cursor-pointer mt-0.5 flex-shrink-0"
                              aria-label={`Seleccionar ${r.nombreCompleto}`}
                            />
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${r.estado === 0 ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {r.nombreCompleto}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">#{r.id} · {r.cedula}</p>
                            </div>
                          </div>
                          <Badge activo={r.estado === 1} />
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-3 pl-6">
                          {r.telefono && <p><span className="font-semibold">Tel:</span> {r.telefono}</p>}
                          {r.ministerio && <p><span className="font-semibold">Ministerio:</span> {r.ministerio}</p>}
                          <p><span className="font-semibold">Ingreso:</span> {formatFecha(r.fechaIngreso)}</p>
                        </div>
                        <div className="pl-6">
                          <button
                            onClick={() => abrirModalEdicion(r)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
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

            {/* ── Paginación ── */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  Página {paginaActual} de {totalPaginas} ·{' '}
                  {(paginaActual - 1) * pageSize + 1}–
                  {Math.min(paginaActual * pageSize, filtrados.length)} de {filtrados.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>

                  {paginasVisibles.map((p, i) =>
                    p < 0 ? (
                      <span key={`ellipsis-${i}`} className="w-8 text-center text-gray-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPagina(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          p === paginaActual
                            ? 'bg-[#003366] text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* Conteo sin paginación */}
            {totalPaginas <= 1 && filtrados.length > 0 && (
              <p className="text-xs text-gray-400 text-right">
                {filtrados.length} de {data.length} registros
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL EDICIÓN / CREAR
      ══════════════════════════════════════════ */}
      {modalEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#003366] text-white px-6 py-4 flex-shrink-0">
              <h2 className="text-base font-bold">
                {asociadoEditando ? `Editar Asociado — ID: ${asociadoEditando.id}` : 'Registrar Asociado'}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {mensaje && esError && (
                <div className="mb-4 p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                  <p className="font-bold mb-1">{mensaje}</p>
                  {erroresLista.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      {erroresLista.map((err, i) => (
                        <li key={i}>{typeof err === 'object' ? JSON.stringify(err) : err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <form id="asociado-form" onSubmit={(e) => { e.preventDefault(); guardarCambios(); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fila 1 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Nombre Completo *</label>
                  <input required type="text" value={formulario.nombreCompleto} onChange={e => setFormulario({ ...formulario, nombreCompleto: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Cédula *</label>
                  <input required type="text" value={formulario.cedula} onChange={e => setFormulario({ ...formulario, cedula: e.target.value })} className={inputClass} />
                </div>

                {/* Fila 2 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Correo Electrónico</label>
                  <input type="email" value={formulario.correo} onChange={e => setFormulario({ ...formulario, correo: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Teléfono Personal</label>
                  <input type="text" value={formulario.telefono} onChange={e => setFormulario({ ...formulario, telefono: e.target.value })} className={inputClass} />
                </div>

                {/* Fila 3 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Teléfono de Contacto (Emergencia)</label>
                  <input type="text" value={formulario.telefonoContacto} onChange={e => setFormulario({ ...formulario, telefonoContacto: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Estado Civil</label>
                  <select value={formulario.estadoCivil} onChange={e => setFormulario({ ...formulario, estadoCivil: e.target.value })} className={inputClass}>
                    <option value="Soltero(a)">Soltero(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viudo(a)">Viudo(a)</option>
                    <option value="Unión libre">Unión libre</option>
                  </select>
                </div>

                {/* Fila 4 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Nacimiento</label>
                  <input type="date" value={formulario.fechaNacimiento} onChange={e => setFormulario({ ...formulario, fechaNacimiento: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Profesión u Oficio</label>
                  <input type="text" value={formulario.profesion} onChange={e => setFormulario({ ...formulario, profesion: e.target.value })} className={inputClass} />
                </div>

                {/* Fila 5 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Años de Congregarse</label>
                  <input type="number" value={formulario.anosCongregarse} onChange={e => setFormulario({ ...formulario, anosCongregarse: e.target.value === '' ? '' : Number(e.target.value) })} className={inputClass} min="0" />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Aceptación (Asociado)</label>
                  <input type="date" value={formulario.fechaAceptacion} onChange={e => setFormulario({ ...formulario, fechaAceptacion: e.target.value })} className={inputClass} />
                </div>

                {/* Fila 6 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Ministerio</label>
                  <input type="text" value={formulario.ministerio} onChange={e => setFormulario({ ...formulario, ministerio: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Ingreso (Congregación)</label>
                  <input type="date" value={formulario.fechaIngreso} onChange={e => setFormulario({ ...formulario, fechaIngreso: e.target.value })} className={inputClass} />
                </div>

                {/* Fila 7 */}
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="junta" checked={formulario.perteneceJuntaDirectiva} onChange={e => setFormulario({ ...formulario, perteneceJuntaDirectiva: e.target.checked })} className="w-4 h-4 accent-[#003366] rounded" />
                  <label htmlFor="junta" className="text-gray-700 text-xs font-semibold">¿Pertenece a la Junta Directiva?</label>
                </div>
                {formulario.perteneceJuntaDirectiva && (
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Puesto en Junta Directiva</label>
                    <input type="text" value={formulario.puestoJuntaDirectiva} onChange={e => setFormulario({ ...formulario, puestoJuntaDirectiva: e.target.value })} className={inputClass} />
                  </div>
                )}

                {/* Fila 8 */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Estado</label>
                  <select
                    value={formulario.estado}
                    onChange={e => setFormulario({ ...formulario, estado: Number(e.target.value) })}
                    className={inputClass}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
                {formulario.estado === 0 && (
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Inactivo</label>
                    <input
                      type="date" value={formulario.fechaInactivo}
                      onChange={e => setFormulario({ ...formulario, fechaInactivo: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Dirección</label>
                  <input
                    type="text" value={formulario.direccion}
                    onChange={e => setFormulario({ ...formulario, direccion: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Observaciones</label>
                  <textarea
                    value={formulario.observaciones}
                    onChange={e => setFormulario({ ...formulario, observaciones: e.target.value })}
                    rows={3}
                    placeholder="Notas adicionales sobre el asociado..."
                    className={inputClass + ' resize-none'}
                  />
                </div>
              </form>
            </div>
            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => { setModalEditOpen(false); setAsociadoEditando(null); }}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit" form="asociado-form" disabled={guardando}
                className={`px-5 py-2 text-sm rounded-lg font-semibold text-white transition-colors ${
                  guardando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#003366] hover:bg-[#004488]'
                }`}
              >
                {guardando ? 'Guardando...' : (asociadoEditando ? 'Guardar cambios' : 'Registrar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL CONFIRMACIÓN ELIMINACIÓN MASIVA
      ══════════════════════════════════════════ */}
      {modalDeleteOpen && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Cabecera */}
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <FaExclamationTriangle className="text-white text-lg flex-shrink-0" />
              <h2 className="text-white font-bold text-base">Confirmar eliminación</h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Se {eliminacionPerm ? 'eliminará permanentemente' : 'marcará como eliminado'} a los siguientes{' '}
                <strong>{seleccionadosData.length}</strong> asociado(s):
              </p>

              {/* Lista de seleccionados */}
              <ul className="mb-5 max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {seleccionadosData.map(a => (
                  <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-medium text-gray-800 truncate">{a.nombreCompleto}</span>
                    <span className="text-gray-400 text-xs ml-3 flex-shrink-0">{a.cedula}</span>
                  </li>
                ))}
              </ul>

              {/* Toggle permanente */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                eliminacionPerm ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={eliminacionPerm}
                    onChange={e => setEliminacionPerm(e.target.checked)}
                    className="w-4 h-4 accent-red-600"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${eliminacionPerm ? 'text-red-700' : 'text-gray-700'}`}>
                      Eliminación permanente
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {eliminacionPerm
                        ? 'Se borrarán definitivamente de la base de datos. Esta acción no se puede deshacer.'
                        : 'Se marcarán como eliminados pero se podrán recuperar.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => { setModalDeleteOpen(false); setEliminacionPerm(false); }}
                disabled={eliminando}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarSeleccionados} disabled={eliminando}
                className={`px-5 py-2 text-sm rounded-lg font-semibold text-white transition-colors ${
                  eliminando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : eliminacionPerm
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {eliminando
                  ? 'Eliminando...'
                  : eliminacionPerm
                  ? 'Eliminar permanentemente'
                  : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}