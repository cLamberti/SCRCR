'use client';

import { useEffect, useMemo, useState } from 'react';

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

  const cargar = async () => {
    try {
      setLoading(true);
      setMensaje('');
      const res = await fetch('/api/asociados', { method: 'GET' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al consultar asociados');
        setData([]);
        return;
      }
      const rows: AsociadoRow[] = (json.data || []).map((a: any) => ({
        ...a,
        fechaIngreso: a.fechaIngreso
          ? new Date(a.fechaIngreso).toISOString()
          : '',
      }));
      setData(rows);
    } catch (err) {
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
      setMensaje('Error de conexión al actualizar.');
    } finally {
      setGuardando(false);
    }
  };

  const formInputClass = (hasValue: boolean) =>
    `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
      hasValue ? 'border-green-500 focus:ring-green-200' : 'border-gray-300 focus:ring-blue-200'
    }`;

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen font-['Segoe_UI',sans-serif]">
      <div className="flex-grow p-4">
        <div className="max-w-7xl mx-auto">

          <div className="p-[30px] bg-white rounded-lg my-[30px] shadow-md">
            {/* Encabezado */}
            <div className="flex items-start justify-between">
              <div className="text-2xl font-bold border-b-2 border-gray-300 pb-2 mb-[20px] text-[#003366]">
                Consultar asociados
              </div>
            </div>

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

            {/* Filtros */}
            <form onSubmit={onSubmit} className="mb-4">
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
                  <label className="block text-black-700 text-sm font-bold mb-2">
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
                  <label className="block text-black text-sm font-bold mb-2">
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
                  className={`${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  } text-white font-semibold px-4 py-2 rounded shadow`}
                >
                  {loading ? 'Actualizando…' : 'Recargar'}
                </button>
              </div>
            </form>

            {/* Tabla de resultados */}
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">Cédula</th>
                    <th className="text-left p-2">Teléfono</th>
                    <th className="text-left p-2">Ministerio</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Ingreso</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        Cargando…
                      </td>
                    </tr>
                  ) : filtrados.length > 0 ? (
                    filtrados.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-gray-50">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.nombreCompleto}</td>
                        <td className="p-2">{r.cedula}</td>
                        <td className="p-2">{r.telefono || '-'}</td>
                        <td className="p-2">{r.ministerio || '-'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            r.estado === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {r.estado === 1 ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-2">
                          {r.fechaIngreso ? new Date(r.fechaIngreso).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => abrirModalEdicion(r)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded shadow"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        Sin resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="mt-3 text-xs text-gray-500">
              Mostrando {filtrados.length} de {data.length} registros
            </div>
          </div>

        </div>
      </div>

      {/* Modal de edición */}
      {modalOpen && asociadoEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-xl font-bold text-[#003366]">
                Editar Asociado - ID: {asociadoEditando.id}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre completo */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nombre completo *
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
                    placeholder="Cédula"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    value={formulario.telefono}
                    onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                    className={formInputClass(!!formulario.telefono)}
                    placeholder="Teléfono"
                  />
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={formulario.correo}
                    onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                    className={formInputClass(!!formulario.correo)}
                    placeholder="correo@ejemplo.com"
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
                    placeholder="Ministerio"
                  />
                </div>

                {/* Fecha de ingreso */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Fecha de ingreso
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
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                className={`px-5 py-2 rounded font-semibold text-white shadow ${
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

    </div>
  );
}