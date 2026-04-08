'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaPlus, FaCheck, FaTimes, FaSearch, FaClipboardList, FaFileAlt, FaUserEdit
} from 'react-icons/fa';
import Sidebar from '@/components/SideBar';
import { useAuth } from '@/contexts/AuthContext';
import { PermisoExtendidoDto } from '@/dto/permiso.dto';

const inputClass =
  'shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 text-sm leading-tight ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] border-gray-300 transition-colors';

const formatFecha = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('es-CR') : '-';

const BadgeEstado = ({ estado }: { estado: string }) => {
  let colorClass = 'bg-gray-100 text-gray-700';
  if (estado === 'APROBADO') colorClass = 'bg-green-100 text-green-700';
  if (estado === 'RECHAZADO') colorClass = 'bg-red-100 text-red-700';
  if (estado === 'PENDIENTE') colorClass = 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {estado}
    </span>
  );
};

export default function PermisosPage() {
  const [data, setData] = useState<PermisoExtendidoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const { usuario } = useAuth();
  
  const [filtros, setFiltros] = useState({ estado: 'todos' });

  // Modal para aprobar/rechazar
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState<PermisoExtendidoDto | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<'APROBADO' | 'RECHAZADO'>('APROBADO');
  const [guardando, setGuardando] = useState(false);

  const isAdminRoles = ['admin', 'pastorGeneral', 'asistenteAdministrativo'].includes(usuario?.rol || '');

  const cargar = useCallback(async () => {
    try {
      setLoading(true); setMensaje(''); setEsError(false);
      const res = await fetch('/api/permisos?limit=100'); // Por simplicidad, limitamos a 100
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al consultar permisos');
        setEsError(true); setData([]); return;
      }
      setData(json.data || []);
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'Error de conexión.');
      setEsError(true); setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    return data.filter(r => filtros.estado === 'todos' || r.estado === filtros.estado);
  }, [data, filtros]);

  const abrirModalEstado = (p: PermisoExtendidoDto, estadoAction: 'APROBADO' | 'RECHAZADO') => {
    setPermisoSeleccionado(p);
    setNuevoEstado(estadoAction);
    setObservaciones('');
    setModalEstadoOpen(true);
  };

  const guardarCambioEstado = async () => {
    if (!permisoSeleccionado) return;
    try {
      setGuardando(true); setMensaje(''); setEsError(false);
      const res = await fetch(`/api/permisos/${permisoSeleccionado.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, observacionesResolucion: observaciones || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al actualizar estado'); setEsError(true); return;
      }
      setMensaje(`Permiso ${nuevoEstado.toLowerCase()} exitosamente.`);
      setModalEstadoOpen(false); setPermisoSeleccionado(null);
      await cargar();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'Error de conexión.'); setEsError(true);
    } finally { setGuardando(false); }
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="permisos" pageTitle="Gestión de Permisos" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 my-4 sm:my-6">
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#003366]">Permisos de Ausencia</h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
              <div className="flex gap-2">
                <Link
                  href="/permisos/registro"
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <FaPlus /> Solicitar Permiso
                </Link>
              </div>
            </div>

            {mensaje && (
              <div className={`mb-4 p-3.5 rounded-lg text-sm border ${
                esError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {mensaje}
              </div>
            )}

            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-gray-600 text-xs font-semibold mb-1">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
                  className={inputClass}
                >
                  <option value="todos">Todos</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="APROBADO">Aprobados</option>
                  <option value="RECHAZADO">Rechazados</option>
                </select>
              </div>
              <button
                onClick={cargar} disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors h-[38px]"
              >
                Recargar
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#003366] text-white">
                    <th className="px-4 py-3 font-semibold text-left">ID</th>
                    <th className="px-4 py-3 font-semibold text-left">Usuario</th>
                    <th className="px-4 py-3 font-semibold text-left">F. Inicio</th>
                    <th className="px-4 py-3 font-semibold text-left">F. Fin</th>
                    <th className="px-4 py-3 font-semibold text-left">Motivo</th>
                    <th className="px-4 py-3 font-semibold text-center">Doc.</th>
                    <th className="px-4 py-3 font-semibold text-left">Estado</th>
                    {isAdminRoles && <th className="px-4 py-3 font-semibold text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">Cargando datos...</td></tr>
                  ) : filtrados.length > 0 ? (
                    filtrados.map(r => (
                      <tr key={r.id} className="border-t hover:bg-blue-50/30">
                        <td className="px-4 py-3 text-gray-600">{r.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{r.nombreCompleto}</td>
                        <td className="px-4 py-3 text-gray-600">{formatFecha(r.fechaInicio)}</td>
                        <td className="px-4 py-3 text-gray-600">{formatFecha(r.fechaFin)}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={r.motivo}>{r.motivo}</td>
                        <td className="px-4 py-3 text-center">
                          {r.documentoUrl ? (
                            <a href={r.documentoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="Ver Documento">
                              <FaFileAlt className="mx-auto" />
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><BadgeEstado estado={r.estado} /></td>
                        {isAdminRoles && (
                          <td className="px-4 py-3 text-center">
                            {r.estado === 'PENDIENTE' && (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => abrirModalEstado(r, 'APROBADO')}
                                  className="w-7 h-7 rounded bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center transition-colors"
                                  title="Aprobar"
                                >
                                  <FaCheck className="text-xs" />
                                </button>
                                <button
                                  onClick={() => abrirModalEstado(r, 'RECHAZADO')}
                                  className="w-7 h-7 rounded bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center transition-colors"
                                  title="Rechazar"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-gray-400">
                        <FaClipboardList className="mx-auto mb-2 text-2xl opacity-30" />
                        <p className="text-sm">No hay permisos registrados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      {/* Modal para aprobar/rechazar */}
      {modalEstadoOpen && permisoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className={`px-6 py-4 flex items-center gap-2 ${nuevoEstado === 'APROBADO' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              {nuevoEstado === 'APROBADO' ? <FaCheck /> : <FaTimes />}
              <h2 className="font-bold">Confirmar {nuevoEstado === 'APROBADO' ? 'Aprobación' : 'Rechazo'}</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que deseas <strong>{nuevoEstado.toLowerCase()}</strong> este permiso solicitado por <strong>{permisoSeleccionado.nombreCompleto}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-semibold mb-1">Observaciones (Opcional)</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder="Detalles sobre la resolución..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setModalEstadoOpen(false)} disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambioEstado} disabled={guardando}
                className={`px-5 py-2 text-sm rounded-lg font-semibold text-white transition-colors ${
                  nuevoEstado === 'APROBADO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } ${guardando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {guardando ? 'Guardando...' : `Confirmar ${nuevoEstado.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
