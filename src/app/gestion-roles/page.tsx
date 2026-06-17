'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaKey, FaSave, FaShieldAlt, FaInfoCircle, FaCheck, FaTimes } from 'react-icons/fa';
import Sidebar from '@/components/SideBar';
import Swal from 'sweetalert2';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, ROLES, type Rol, type ModuloKey } from '@/lib/modulos';

type Matrix = Record<string, Record<string, boolean>>;

const BLOQUEADOS: Partial<Record<ModuloKey, Rol[]>> = {
  'gestion-roles':    ['pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  'gestion-usuarios': ['pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  'inicio':           ['admin'],
};

function isBloqueado(modulo: ModuloKey, rol: Rol): boolean {
  const locked = BLOQUEADOS[modulo];
  if (!locked) return false;
  return locked.includes(rol);
}

export default function GestionRolesPage() {
  const { refrescarPermisos } = useAuth();
  const [matrix, setMatrix] = useState<Matrix>({});
  const [original, setOriginal] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/roles-config');
      const json = await res.json();
      if (json.success) {
        setMatrix(JSON.parse(JSON.stringify(json.data)));
        setOriginal(JSON.parse(JSON.stringify(json.data)));
      } else {
        setMensaje(json.message || 'Error al cargar permisos.'); setEsError(true);
      }
    } catch {
      setMensaje('Error de conexión.'); setEsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = (modulo: string, rol: string) => {
    if (isBloqueado(modulo as ModuloKey, rol as Rol)) return;
    setMatrix(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [rol]: !prev[modulo]?.[rol] },
    }));
  };

  const haycambios = JSON.stringify(matrix) !== JSON.stringify(original);

  const guardar = async () => {
    const confirm = await Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Los cambios afectan inmediatamente la visibilidad de módulos para cada rol.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setGuardando(true); setMensaje(''); setEsError(false);
    try {
      const res = await fetch('/api/roles-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matrix),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOriginal(JSON.parse(JSON.stringify(matrix)));
        setMensaje('Permisos actualizados. Los usuarios verán los cambios al recargar su sesión.');
        setEsError(false);
        await refrescarPermisos();
      } else {
        setMensaje(json.message || 'Error al guardar.'); setEsError(true);
      }
    } catch {
      setMensaje('Error de conexión.'); setEsError(true);
    } finally {
      setGuardando(false);
    }
  };

  const resetear = () => {
    setMatrix(JSON.parse(JSON.stringify(original)));
    setMensaje(''); setEsError(false);
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="gestion-roles" pageTitle="Gestión de Roles" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 my-4 sm:my-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#003366] flex items-center gap-2">
                  <FaKey className="text-lg" /> Gestión de Roles
                </h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
              <div className="flex items-center gap-2">
                {haycambios && (
                  <button onClick={resetear} disabled={guardando}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                    Descartar
                  </button>
                )}
                <button onClick={guardar} disabled={!haycambios || guardando}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                    !haycambios || guardando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#003366] hover:bg-[#004488]'
                  }`}>
                  <FaSave className="text-xs" />
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Define qué módulos puede ver cada rol. Los cambios se aplican al recargar sesión.
            </p>

            {/* Mensaje */}
            {mensaje && (
              <div className={`mb-4 p-3.5 rounded-lg text-sm border flex items-start gap-2 ${
                esError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                <FaInfoCircle className="flex-shrink-0 mt-0.5" />
                {mensaje}
              </div>
            )}

            {/* Aviso */}
            <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <FaShieldAlt className="flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Seguridad:</strong> La protección de rutas del sistema opera de forma independiente como capa de seguridad.
                Esta tabla controla la <strong>visibilidad en el menú</strong>. Las celdas grises son permisos fijos que no se pueden cambiar.
              </span>
            </div>

            {/* Tabla de permisos */}
            {loading ? (
              <div className="flex items-center justify-center p-16">
                <svg className="animate-spin h-6 w-6 text-[#003366]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#003366]">
                      <th className="text-left px-5 py-3.5 text-white font-semibold text-xs w-52">Módulo</th>
                      {ROLES.map(r => (
                        <th key={r.key} className="px-4 py-3.5 text-center text-white font-semibold text-xs whitespace-nowrap">
                          {r.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS.map((mod, i) => (
                      <tr key={mod.key} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-800 text-xs">{mod.label}</p>
                          <p className="text-gray-400 text-[11px] mt-0.5 leading-snug">{mod.descripcion}</p>
                        </td>
                        {ROLES.map(rol => {
                          const bloqueado = isBloqueado(mod.key, rol.key);
                          const activo = matrix[mod.key]?.[rol.key] ?? false;
                          return (
                            <td key={rol.key} className="px-4 py-3.5 text-center">
                              {bloqueado ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mx-auto" title="Permiso fijo">
                                  {activo
                                    ? <FaCheck className="text-gray-400 text-xs" />
                                    : <FaTimes className="text-gray-300 text-xs" />}
                                </span>
                              ) : (
                                <button
                                  onClick={() => toggle(mod.key, rol.key)}
                                  title={activo ? 'Quitar acceso' : 'Dar acceso'}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mx-auto transition-all ${
                                    activo
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                      : 'bg-red-50 text-red-400 hover:bg-red-100'
                                  }`}>
                                  {activo ? <FaCheck className="text-xs" /> : <FaTimes className="text-xs" />}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                  <FaCheck className="text-green-600 text-[10px]" />
                </span>
                Acceso activo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                  <FaTimes className="text-red-400 text-[10px]" />
                </span>
                Sin acceso
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FaCheck className="text-gray-400 text-[10px]" />
                </span>
                Permiso fijo (no editable)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
