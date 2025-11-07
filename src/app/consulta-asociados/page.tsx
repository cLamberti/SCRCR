"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { FaHome, FaUserPlus, FaUsers, FaList, FaCog, FaSignOutAlt, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { AsociadoResponse } from '@/dto/asociado.dto';

// Componente para el menú lateral (sidebar)
const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('listado');

  const menuItems = [
    { id: 'inicio', href: '/', icon: FaHome, label: 'Inicio' },
    { id: 'registro-asociados', href: '/registro-asociados', icon: FaUserPlus, label: 'Registro de Asociados' },
    { id: 'registro-congregados', href: '#', icon: FaUsers, label: 'Registro de Congregados' },
    { id: 'listado', href: '/consulta-asociados', icon: FaList, label: 'Listado General' },
    { id: 'configuracion', href: '#', icon: FaCog, label: 'Configuración' },
    { id: 'cerrar', href: '#', icon: FaSignOutAlt, label: 'Cerrar Sesión' }
  ];

  return (
    <div className="w-[220px] bg-[#003366] text-white min-h-screen pt-[30px] flex flex-col shadow-lg">
      <div className="px-5 mb-8">
        <h4 className="text-center text-lg font-semibold">Bienvenido</h4>
        <div className="w-full h-px bg-[#005599] mt-2"></div>
      </div>

      <nav className="flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setActiveItem(item.id)}
              className={`
                text-white no-underline flex items-center py-3 px-5 transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-[#005599] border-r-4 border-white shadow-inner' 
                  : 'hover:bg-[#004488] hover:pl-6'
                }
              `}
            >
              <Icon className={`
                mr-3 transition-all duration-200
                ${isActive ? 'text-white scale-110' : 'text-gray-300 group-hover:text-white'}
              `} />
              <span className={`
                transition-all duration-200
                ${isActive ? 'font-semibold' : 'group-hover:font-medium'}
              `}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
};

type AsociadoRow = {
  id: number;
  nombreCompleto: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  ministerio?: string;
  direccion?: string;
  fechaIngreso: string;
  estado: number;
};

type FormularioEdicion = {
  nombreCompleto: string;
  cedula: string;
  correo: string;
  telefono: string;
  ministerio: string;
  direccion: string;
  fechaIngreso: string;
  estado: number;
};

export default function ConsultarAsociadosPage() {
  const [data, setData] = useState<AsociadoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [filtros, setFiltros] = useState({
    nombreCompleto: '',
    cedula: '',
    estado: 'todos',
  });

  // Estados para el modal de edición
  const [modalOpen, setModalOpen] = useState(false);
  const [asociadoEditando, setAsociadoEditando] = useState<AsociadoRow | null>(null);
  const [formulario, setFormulario] = useState<FormularioEdicion>({
    nombreCompleto: '',
    cedula: '',
    correo: '',
    telefono: '',
    ministerio: '',
    direccion: '',
    fechaIngreso: '',
    estado: 1,
  });
  const [guardando, setGuardando] = useState(false);

  // Estados para eliminar
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [asociadoAEliminar, setAsociadoAEliminar] = useState<AsociadoRow | null>(null);
  const [eliminacionPermanente, setEliminacionPermanente] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      setMensaje('');
      const res = await fetch('/api/asociados', { method: 'GET' });
      const json = await res.json();
      console.log('Asociados:', json.data);
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al consultar asociados');
        setData([]);
        return;
      }
      const rows: AsociadoRow[] = (json.data || []).map((a: AsociadoResponse) => ({
        ...a,
        fechaIngreso: a.fechaIngreso
          ? new Date(a.fechaIngreso).toISOString()
          : '',
      }));
      setData(rows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión.';
      setMensaje(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const n = filtros.nombreCompleto.trim().toLowerCase();
    const c = filtros.cedula.trim().toLowerCase();
    const e = filtros.estado;

    return data.filter((r) => {
      const okNombre = !n || r.nombreCompleto?.toLowerCase().includes(n);
      const okCedula = !c || r.cedula?.toLowerCase().includes(c);
      const okEstado = e === 'todos' ? true : String(r.estado) === e;
      return okNombre && okCedula && okEstado;
    });
  }, [data, filtros]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const limpiarFiltros = () => {
    setFiltros({ nombreCompleto: '', cedula: '', estado: 'todos' });
  };

  // Abrir modal de edición
  const abrirModalEdicion = (asociado: AsociadoRow) => {
    setAsociadoEditando(asociado);
    setFormulario({
      nombreCompleto: asociado.nombreCompleto || '',
      cedula: asociado.cedula || '',
      correo: asociado.correo || '',
      telefono: asociado.telefono || '',
      ministerio: asociado.ministerio || '',
      direccion: asociado.direccion || '',
      fechaIngreso: asociado.fechaIngreso 
        ? new Date(asociado.fechaIngreso).toISOString().split('T')[0] 
        : '',
      estado: asociado.estado,
    });
    setModalOpen(true);
    setMensaje('');
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalOpen(false);
    setAsociadoEditando(null);
    setGuardando(false);
  };

  // Guardar cambios
  const guardarCambios = async () => {
    if (!asociadoEditando) return;

    try {
      setGuardando(true);
      setMensaje('');

      const res = await fetch(`/api/asociados/update?id=${asociadoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al actualizar el asociado');
        return;
      }

      setMensaje('Asociado actualizado exitosamente');
      cerrarModal();
      await cargar();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al actualizar.';
      setMensaje(errorMessage);
    } finally {
      setGuardando(false);
    }
  };

  // Funciones para eliminar
  const abrirConfirmacionEliminar = (asociado: AsociadoRow) => {
    setAsociadoAEliminar(asociado);
    setEliminacionPermanente(false);
    setConfirmDeleteOpen(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setConfirmDeleteOpen(false);
    setAsociadoAEliminar(null);
    setEliminacionPermanente(false);
  };

  const eliminarAsociado = async () => {
    if (!asociadoAEliminar) return;
    
    try {
      setLoading(true);
      setMensaje('');
      
      const url = `/api/asociados/delete?id=${asociadoAEliminar.id}${eliminacionPermanente ? '&permanente=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al eliminar el asociado');
        return;
      }
      
      const mensajeExito = eliminacionPermanente 
        ? 'Asociado eliminado permanentemente'
        : 'Asociado marcado como eliminado';
      setMensaje(mensajeExito);
      
      cerrarConfirmacionEliminar();
      await cargar();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error de conexión al eliminar.';
        setMensaje(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formInputClass = (hasValue: boolean) =>
    `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
      hasValue ? 'border-green-500 focus:ring-green-200' : 'border-gray-300 focus:ring-blue-200'
    }`;

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen font-['Segoe_UI',sans-serif]">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Contenido Principal */}
      <div className="flex-grow p-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-[30px] bg-white rounded-lg my-[30px] shadow-md">
            
            {/* Encabezado del Formulario */}
            <div className="flex items-start justify-between">
              <div className="text-2xl font-bold border-b-2 border-gray-300 pb-2 mb-[20px] text-[#003366]">
                Consultar asociados
              </div>
              <div className="mb-[20px]">
                <Image
                  src="/logo-iglesia.png"
                  alt="Logo Iglesia"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Texto explicativo */}
            <p className="text-gray-600 mb-6">
              Busca, consulta, edita y gestiona la información de los asociados registrados en el sistema.
            </p>

            {/* Mensaje de estado */}
            {mensaje && (
              <div className={`mb-4 p-4 rounded ${
                mensaje.toLowerCase().includes('error')
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                {mensaje}
              </div>
            )}

            {/* Sección de Filtros */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
                <FaSearch className="mr-2" />
                Filtros de Búsqueda
              </h3>
              
              <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nombre o apellidos
                    </label>
                    <input
                      type="text"
                      value={filtros.nombreCompleto}
                      onChange={(e) => setFiltros({ ...filtros, nombreCompleto: e.target.value })}
                      className={formInputClass(!!filtros.nombreCompleto)}
                      placeholder="Ej: Ana Mora"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={filtros.cedula}
                      onChange={(e) => setFiltros({ ...filtros, cedula: e.target.value })}
                      className={formInputClass(!!filtros.cedula)}
                      placeholder="Ej: 2-0403-6583"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Estado
                    </label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                      className={formInputClass(true)}
                    >
                      <option value="todos">Todos</option>
                      <option value="1">Activos</option>
                      <option value="0">Eliminados</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#003366] hover:bg-[#004488]'} text-white font-semibold px-6 py-2 rounded shadow transition-colors`}
                  >
                    <FaSearch className="inline mr-2" />
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded shadow transition-colors"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={cargar}
                    disabled={loading}
                    className={`${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold px-6 py-2 rounded shadow transition-colors`}
                  >
                    {loading ? 'Actualizando…' : 'Recargar'}
                  </button>
                </div>
              </form>
            </div>

            {/* Tabla de resultados */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
                <FaUsers className="mr-2" />
                Resultados ({filtrados.length})
              </h3>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#003366] text-white">
                    <tr>
                      <th className="text-left p-3 font-semibold">ID</th>
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Cédula</th>
                      <th className="text-left p-3 font-semibold">Teléfono</th>
                      <th className="text-left p-3 font-semibold">Ministerio</th>
                      <th className="text-left p-3 font-semibold">Estado</th>
                      <th className="text-left p-3 font-semibold">Ingreso</th>
                      <th className="text-left p-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-gray-500">Cargando…</td>
                      </tr>
                    ) : filtrados.length > 0 ? (
                      filtrados.map((r) => (
                        <tr key={r.id} className={`border-t hover:bg-gray-50 ${r.estado === 0 ? 'bg-red-50 opacity-75' : ''}`}>
                          <td className="p-3 font-medium">{r.id}</td>
                          <td className={`p-3 ${r.estado === 0 ? 'line-through text-gray-500' : ''}`}>{r.nombreCompleto}</td>
                          <td className="p-3">{r.cedula}</td>
                          <td className="p-3">{r.telefono || '-'}</td>
                          <td className="p-3">{r.ministerio || '-'}</td>
                          <td className="p-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              r.estado === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {r.estado === 1 ? 'Activo' : 'Eliminado'}
                            </span>
                          </td>
                          <td className="p-3">
                            {r.fechaIngreso ? new Date(r.fechaIngreso).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirModalEdicion(r)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded shadow transition-colors flex items-center"
                              >
                                <FaEdit className="mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => abrirConfirmacionEliminar(r)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded shadow transition-colors flex items-center"
                              >
                                <FaTrash className="mr-1" />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          <FaSearch className="mx-auto mb-2 text-2xl" />
                          No se encontraron resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Información de registros */}
              <div className="mt-3 text-sm text-gray-500 text-center">
                Mostrando {filtrados.length} de {data.length} registros
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {modalOpen && asociadoEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header del modal */}
            <div className="bg-[#003366] text-white p-4">
              <h2 className="text-lg font-bold">
                Editar Asociado - ID: {asociadoEditando.id}
              </h2>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formulario.nombreCompleto}
                    onChange={(e) => setFormulario({ ...formulario, nombreCompleto: e.target.value })}
                    className={formInputClass(!!formulario.nombreCompleto)}
                    placeholder="Nombre completo"
                  />
                </div>

                {/* Cédula */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    value={formulario.cedula}
                    onChange={(e) => setFormulario({ ...formulario, cedula: e.target.value })}
                    className={formInputClass(!!formulario.cedula)}
                    placeholder="Número de cédula"
                  />
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formulario.correo}
                    onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                    className={formInputClass(!!formulario.correo)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formulario.telefono}
                    onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                    className={formInputClass(!!formulario.telefono)}
                    placeholder="8888-8888"
                  />
                </div>

                {/* Ministerio */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Ministerio
                  </label>
                  <input
                    type="text"
                    value={formulario.ministerio}
                    onChange={(e) => setFormulario({ ...formulario, ministerio: e.target.value })}
                    className={formInputClass(!!formulario.ministerio)}
                    placeholder="Ministerio asignado"
                  />
                </div>

                {/* Fecha de Ingreso */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    value={formulario.fechaIngreso}
                    onChange={(e) => setFormulario({ ...formulario, fechaIngreso: e.target.value })}
                    className={formInputClass(!!formulario.fechaIngreso)}
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Estado
                  </label>
                  <select
                    value={formulario.estado}
                    onChange={(e) => setFormulario({ ...formulario, estado: Number(e.target.value) })}
                    className={formInputClass(true)}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formulario.direccion}
                    onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                    className={formInputClass(!!formulario.direccion)}
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
            </div>

            {/* Botones del modal */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                className={`px-5 py-2 rounded font-semibold text-white shadow transition-colors ${
                  guardando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#003366] hover:bg-[#004488]'
                }`}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDeleteOpen && asociadoAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[95%] max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[#003366] mb-2">
              Confirmar eliminación
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar al asociado{' '}
              <strong>{asociadoAEliminar.nombreCompleto}</strong> (ID: {asociadoAEliminar.id})?
            </p>
            
            {/* Opción de eliminación permanente */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="eliminacionPermanente"
                  type="checkbox"
                  checked={eliminacionPermanente}
                  onChange={(e) => setEliminacionPermanente(e.target.checked)}
                />
                <label htmlFor="eliminacionPermanente" className="text-sm text-gray-700">
                  Eliminación permanente (hard delete)
                </label>
              </div>
              <div className="text-xs text-gray-500">
                <strong>Sin marcar:</strong> Marca como "Eliminado" (se puede recuperar)<br/>
                <strong>Marcado:</strong> Elimina permanentemente de la base de datos
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={cerrarConfirmacionEliminar}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded text-white font-semibold transition-colors ${
                  eliminacionPermanente 
                    ? 'bg-red-700 hover:bg-red-800' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={eliminarAsociado}
              >
                {eliminacionPermanente ? 'Eliminar permanentemente' : 'Marcar como eliminado'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}