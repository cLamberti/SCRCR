'use client';

import { useEffect, useState } from 'react';
import { Usuario } from '@/models/Usuario';

// Definimos un tipo para el frontend, omitiendo datos sensibles como el hash del password
type UsuarioRow = Omit<Usuario, 'passwordHash'>;

export default function AdministracionUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setMensaje('');
      const res = await fetch('/api/usuarios');
      const json = await res.json();

      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al obtener la lista de usuarios');
        setUsuarios([]);
        return;
      }

      setUsuarios(json.data || []);
    } catch (e) {
      console.error('Error cargando usuarios:', e);
      setMensaje('Error de conexión. Intenta de nuevo.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const getEstadoLabel = (estado: number) => {
    switch (estado) {
      case 1: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Activo</span>;
      case 0: return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Inactivo</span>;
      case 2: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Bloqueado</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Desconocido</span>;
    }
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen font-['Segoe_UI',sans-serif]">
      <div className="flex-grow p-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-[30px] bg-white rounded-lg my-[30px] shadow-md">
            {/* Encabezado */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-2xl font-bold border-b-2 border-gray-300 pb-2 text-[#003366]">
                Administración de Usuarios
              </div>
            </div>

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

            {/* Tabla de usuarios */}
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Nombre Completo</th>
                    <th className="text-left p-2">Username</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Rol</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Último Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">Cargando usuarios…</td>
                    </tr>
                  ) : usuarios.length > 0 ? (
                    usuarios.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="p-2">{user.id}</td>
                        <td className="p-2 font-medium">{user.nombreCompleto}</td>
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2 capitalize">{user.rol}</td>
                        <td className="p-2">{getEstadoLabel(user.estado)}</td>
                        <td className="p-2">
                          {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString() : 'Nunca'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">No se encontraron usuarios.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}