'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { FaHome, FaUserPlus, FaUsers, FaList, FaCog, FaSignOutAlt, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { AsociadoResponse } from '@/dto/asociado.dto';
const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('listado');

  const menuItems = [
    { id: 'inicio', href: '/', icon: FaHome, label: 'Inicio' },
    { id: 'registro-asociados', href: '/registro-asociados', icon: FaUserPlus, label: 'Registro de Asociados' },
    { id: 'listado', href: '/consulta-asociados', icon: FaList, label: 'Listado General' },
    { id: 'eliminar-asociado', href: '/eliminar-asociados', icon: FaTrash, label: 'Eliminar Asociados' },
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
  fechaIngreso?: string;
  estado: number;
};

export default function EliminarAsociadosPage() {
  const [data, setData] = useState<AsociadoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [permanente, setPermanente] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // filtros simples (cliente) para encontrar rápido al asociado a eliminar
  const [filtros, setFiltros] = useState({
    nombreCompleto: '',
    cedula: '',
    estado: 'todos', // 'todos' | '1' | '0'
  });

  // cargar lista (puedes cambiar a filtros por backend cuando quieras)
  const cargar = async () => {
    try {
      setLoading(true);
      setMensaje('');
      console.log('=== CARGANDO LISTA ===');
      const res = await fetch('/api/asociados');
      console.log('Response status:', res.status);
      const json = await res.json();
      console.log('Response data:', json);
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al obtener asociados');
        setData([]);
        return;
      }
      const rows: AsociadoRow[] = (json.data || []).map((a: any) => ({
        ...a,
        fechaIngreso: a.fechaIngreso ? new Date(a.fechaIngreso).toISOString() : '',
      }));
      console.log('Processed rows:', rows);
      console.log('Total registros:', rows.length);
      console.log('Estados encontrados:', rows.map(r => ({ id: r.id, estado: r.estado })));
      setData(rows);
    } catch (e) {
      console.error('Error cargando:', e);
      setMensaje('Error de conexión. Intenta de nuevo.');
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
    return data.filter(r => {
      const okNombre = !n || r.nombreCompleto?.toLowerCase().includes(n);
      const okCedula = !c || r.cedula?.toLowerCase().includes(c);
      const okEstado = e === 'todos' ? true : String(r.estado) === e;
      return okNombre && okCedula && okEstado;
    });
  }, [data, filtros]);

  const formInputClass = (hasValue: boolean) =>
    `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
      hasValue ? 'border-green-500 focus:ring-green-200' : 'border-gray-300 focus:ring-blue-200'
    }`;

  const onSubmitFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    // si luego haces filtros en backend, aquí armas la query y haces fetch
  };

  const limpiarFiltros = () => {
    setFiltros({ nombreCompleto: '', cedula: '', estado: 'todos' });
  };

  const abrirConfirmacion = () => {
    if (!selectedId) return;
    setConfirmOpen(true);
  };

  const eliminar = async () => {
    if (!selectedId) return;
    setConfirmOpen(false);
    setLoading(true);
    setMensaje('');
    try {
      const url = `/api/asociados/delete?id=${selectedId}${permanente ? '&permanente=true' : ''}`;
      console.log('=== INICIANDO ELIMINACIÓN ===');
      console.log('URL:', url);
      console.log('Selected ID:', selectedId);
      console.log('Permanente:', permanente);
      
      const res = await fetch(url, { method: 'DELETE' });
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      const json = await res.json();
      console.log('Response JSON:', json);
      
      if (!res.ok || !json.success) {
        console.log('Error en la respuesta');
        setMensaje(json.message || 'Error al eliminar el asociado');
        return;
      }
      console.log('Eliminación exitosa');
      const mensajeExito = permanente 
        ? 'Asociado eliminado permanentemente'
        : 'Asociado marcado como eliminado (soft delete)';
      setMensaje(mensajeExito);
      setSelectedId(null);
      console.log('Recargando lista...');
      // refrescar lista para que desaparezca el registro (o pase a inactivo)
      await cargar();
      console.log('Lista recargada');
    } catch (e) {
      console.error('Error en eliminación:', e);
      setMensaje('Error de conexión al eliminar.');
    } finally {
      setLoading(false);
    }
  };

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
    

            {/* Mensaje */}
            {mensaje && (
              <div className={`mb-4 p-4 rounded ${
                mensaje.toLowerCase().includes('error')
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                {mensaje}
              </div>
            )}

            {/* Filtros */}
            <form onSubmit={onSubmitFiltros} className="mb-4">
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/3 px-3 mb-3 md:mb-0">
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

                <div className="w-full md:w-1/3 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={filtros.cedula}
                    onChange={(e) => setFiltros({ ...filtros, cedula: e.target.value })}
                    className={formInputClass(!!filtros.cedula)}
                    placeholder="Ej: 2040386583"
                  />
                </div>

                <div className="w-full md:w-1/3 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Estado
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                    className={formInputClass(filtros.estado !== 'todos')}
                  >
                    <option value="todos">Todos</option>
                    <option value="1">Activos</option>
                    <option value="0">Inactivos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="bg-[#003366] hover:bg-[#004488] text-white font-semibold px-5 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded shadow"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={cargar}
                  disabled={loading}
                  className={`${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold px-4 py-2 rounded shadow`}
                >
                  {loading ? 'Actualizando…' : 'Recargar'}
                </button>
              </div>
            </form>

            {/* Tabla + acciones */}
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Sel.</th>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">Cédula</th>
                    <th className="text-left p-2">Teléfono</th>
                    <th className="text-left p-2">Ministerio</th>
                    <th className="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">Cargando…</td>
                    </tr>
                  ) : filtrados.length > 0 ? (
                    filtrados.map((r) => (
                      <tr key={r.id} className={`border-t ${selectedId === r.id ? 'bg-blue-50' : ''} ${r.estado === 0 ? 'bg-red-50 opacity-75' : ''}`}>
                        <td className="p-2">
                          <input
                            type="radio"
                            name="selected"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </td>
                        <td className="p-2">{r.id}</td>
                        <td className={`p-2 ${r.estado === 0 ? 'line-through text-gray-500' : ''}`}>{r.nombreCompleto}</td>
                        <td className="p-2">{r.cedula}</td>
                        <td className="p-2">{r.telefono || '-'}</td>
                        <td className="p-2">{r.ministerio || '-'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            r.estado === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {r.estado === 1 ? 'Activo' : 'Eliminado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">Sin resultados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de eliminación */}
            <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="permanente"
                    type="checkbox"
                    checked={permanente}
                    onChange={(e) => setPermanente(e.target.checked)}
                  />
                  <label htmlFor="permanente" className="text-sm text-gray-700">
                    Eliminación permanente (hard delete)
                  </label>
                </div>
                <div className="text-xs text-gray-500 max-w-md">
                  <strong>Sin marcar:</strong> Marca como "Eliminado" (se puede recuperar)<br/>
                  <strong>Marcado:</strong> Elimina permanentemente de la base de datos
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!selectedId || loading}
                  onClick={abrirConfirmacion}
                  className={`px-5 py-2 rounded font-semibold text-white shadow ${
                    !selectedId || loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {permanente ? 'Eliminar permanentemente' : 'Eliminar seleccionado'}
                </button>
              </div>
            </div>

            {/* Modal de confirmación simple */}
            {confirmOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-[95%] max-w-md shadow-xl">
                  <h2 className="text-lg font-bold text-[#003366] mb-2">
                    Confirmar eliminación
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    ¿Seguro que deseas {permanente ? 'eliminar PERMANENTEMENTE' : 'eliminar'} el asociado con ID <b>{selectedId}</b>?
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                      onClick={eliminar}
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="mt-3 text-xs text-gray-500">
              Mostrando {filtrados.length} de {data.length} registros
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
