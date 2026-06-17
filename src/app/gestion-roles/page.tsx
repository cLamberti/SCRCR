'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FaKey, FaSave, FaShieldAlt, FaInfoCircle, FaCheck, FaTimes,
  FaPlus, FaTrash, FaLock,
} from 'react-icons/fa';
import Sidebar from '@/components/SideBar';
import Swal from 'sweetalert2';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type ModuloKey } from '@/lib/modulos';

type Matrix = Record<string, Record<string, boolean>>;

type RolDef = {
  key: string;
  label: string;
  esBase: boolean;
};

// Celdas que siempre están fijas (no editables)
function isBloqueado(modulo: ModuloKey, rol: string): boolean {
  if (modulo === 'gestion-roles' && rol !== 'admin') return true;
  if (modulo === 'gestion-usuarios' && rol !== 'admin') return true;
  if (modulo === 'inicio' && rol === 'admin') return true;
  return false;
}

export default function GestionRolesPage() {
  const { refrescarPermisos } = useAuth();

  const [matrix, setMatrix] = useState<Matrix>({});
  const [original, setOriginal] = useState<Matrix>({});
  const [roles, setRoles] = useState<RolDef[]>([]);
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
        setRoles(json.roles ?? []);
      } else {
        setMensaje(json.message || 'Error al cargar permisos.');
        setEsError(true);
      }
    } catch {
      setMensaje('Error de conexión.'); setEsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = (modulo: string, rol: string) => {
    if (isBloqueado(modulo as ModuloKey, rol)) return;
    setMatrix(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [rol]: !prev[modulo]?.[rol] },
    }));
  };

  const hayCambios = JSON.stringify(matrix) !== JSON.stringify(original);

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

  // ── Crear nuevo rol ────────────────────────────────────────────────────────
  const crearRol = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Rol',
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">
              Nombre visible
            </label>
            <input id="swal-label" class="swal2-input" placeholder="Ej: Secretario, Tesorero..." style="margin:0;width:100%">
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">
              Identificador interno
            </label>
            <input id="swal-key" class="swal2-input" placeholder="Ej: secretario, tesorero..." style="margin:0;width:100%">
            <p style="font-size:11px;color:#9ca3af;margin-top:4px">Solo letras, números y guión bajo. Sin espacios.</p>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const label = (document.getElementById('swal-label') as HTMLInputElement)?.value?.trim();
        const key   = (document.getElementById('swal-key')   as HTMLInputElement)?.value?.trim();
        if (!label || !key) { Swal.showValidationMessage('Ambos campos son obligatorios.'); return false; }
        if (!/^[a-zA-Z0-9_]+$/.test(key)) { Swal.showValidationMessage('El identificador solo puede tener letras, números y _.'); return false; }
        return { label, key };
      },
      didOpen: () => {
        // Auto-fill key from label
        const labelInput = document.getElementById('swal-label') as HTMLInputElement;
        const keyInput   = document.getElementById('swal-key')   as HTMLInputElement;
        labelInput?.addEventListener('input', () => {
          if (!keyInput) return;
          keyInput.value = labelInput.value
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
        });
      },
    });

    if (!formValues) return;

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await cargar();
        setMensaje(`Rol "${formValues.label}" creado correctamente.`);
        setEsError(false);
      } else {
        Swal.fire('Error', json.message || 'No se pudo crear el rol.', 'error');
      }
    } catch {
      Swal.fire('Error', 'Error de conexión.', 'error');
    }
  };

  // ── Eliminar rol ──────────────────────────────────────────────────────────
  const eliminarRol = async (rol: RolDef) => {
    const confirm = await Swal.fire({
      title: `¿Eliminar "${rol.label}"?`,
      text: 'Se eliminarán todos los permisos asociados a este rol. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch('/api/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: rol.key }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await cargar();
        setMensaje(`Rol "${rol.label}" eliminado.`); setEsError(false);
      } else {
        Swal.fire('Error', json.message || 'No se pudo eliminar el rol.', 'error');
      }
    } catch {
      Swal.fire('Error', 'Error de conexión.', 'error');
    }
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="gestion-roles" pageTitle="Gestión de Roles" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 my-4 sm:my-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-1 gap-3 flex-wrap">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#003366] flex items-center gap-2">
                  <FaKey className="text-lg" /> Gestión de Roles
                </h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={crearRol}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white transition"
                >
                  <FaPlus className="text-xs" /> Nuevo rol
                </button>
                {hayCambios && (
                  <button onClick={resetear} disabled={guardando}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                    Descartar
                  </button>
                )}
                <button onClick={guardar} disabled={!hayCambios || guardando}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                    !hayCambios || guardando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#003366] hover:bg-[#004488]'
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

            {/* Aviso de seguridad */}
            <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <FaShieldAlt className="flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Seguridad:</strong> La protección de rutas opera de forma independiente.
                Esta tabla controla la <strong>visibilidad en el menú</strong>. Las celdas grises son permisos fijos que no se pueden cambiar.
              </span>
            </div>

            {/* Tabla */}
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
                      {roles.map(r => (
                        <th key={r.key} className="px-3 py-3.5 text-center text-white font-semibold text-xs whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span>{r.label}</span>
                            {!r.esBase && (
                              <button
                                onClick={() => eliminarRol(r)}
                                title={`Eliminar rol "${r.label}"`}
                                className="text-red-300 hover:text-red-100 transition p-0.5 rounded"
                              >
                                <FaTrash className="text-[10px]" />
                              </button>
                            )}
                            {r.esBase && (
                              <FaLock className="text-white/30 text-[10px]" title="Rol base del sistema" />
                            )}
                          </div>
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
                        {roles.map(rol => {
                          const bloqueado = isBloqueado(mod.key, rol.key);
                          const activo = matrix[mod.key]?.[rol.key] ?? false;
                          return (
                            <td key={rol.key} className="px-3 py-3.5 text-center">
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
              <span className="flex items-center gap-1.5">
                <FaLock className="text-gray-400 text-[10px]" />
                Rol base (no eliminable)
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
