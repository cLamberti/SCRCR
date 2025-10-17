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
  fechaIngreso: string; // el API puede venir con Date/ISO; lo mostramos legible
  estado: number;       // 1 activo, 0 inactivo
};

export default function ConsultarAsociadosPage() {
  const [data, setData] = useState<AsociadoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [filtros, setFiltros] = useState({
    nombreCompleto: '',
    cedula: '',
    estado: 'todos', // 'todos' | '1' | '0'
  });

  // Cargar lista inicial
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
      // Normalizar fecha a string legible
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

  // Filtro en cliente (coincide con tu estilo: simple y directo)
  const filtrados = useMemo(() => {
    const n = filtros.nombreCompleto.trim().toLowerCase();
    const c = filtros.cedula.trim().toLowerCase();
    const e = filtros.estado;

    return data.filter((r) => {
      const okNombre = !n || r.nombreCompleto?.toLowerCase().includes(n);
      const okCedula = !c || r.cedula?.toLowerCase().includes(c);
      const okEstado =
        e === 'todos' ? true : String(r.estado) === e;

      return okNombre && okCedula && okEstado;
    });
  }, [data, filtros]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // como filtramos en cliente, no hacemos nuevo fetch aquí
    // si luego habilitas filtros en backend, aquí armamos query y recargamos
  };

  const limpiarFiltros = () => {
    setFiltros({ nombreCompleto: '', cedula: '', estado: 'todos' });
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
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-300'
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
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        Cargando…
                      </td>
                    </tr>
                  ) : filtrados.length > 0 ? (
                    filtrados.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.nombreCompleto}</td>
                        <td className="p-2">{r.cedula}</td>
                        <td className="p-2">{r.telefono || '-'}</td>
                        <td className="p-2">{r.ministerio || '-'}</td>
                        <td className="p-2">{r.estado === 1 ? 'Activo' : 'Inactivo'}</td>
                        <td className="p-2">
                          {r.fechaIngreso ? new Date(r.fechaIngreso).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
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
    </div>
  );
}
