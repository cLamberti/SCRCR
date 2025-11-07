'use client';

import { useEffect, useState } from 'react';

// Definimos un tipo para los datos del usuario que mostraremos en la tabla
type UsuarioRow = {
  id: number;
  nombreCompleto: string;
  username: string;
  email: string;
  rol: string;
  estado: number;
};

// Definimos un tipo para los datos del formulario
type FormState = {
  nombreCompleto: string;
  username: string;
  email: string;
  password: string;
  rol: 'admin' | 'tesorero' | 'pastorGeneral';
};

export default function GestionUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [formState, setFormState] = useState<FormState>({
    nombreCompleto: '',
    username: '',
    email: '',
    password: '',
    rol: 'tesorero', // Rol por defecto
  });

  // Función para cargar la lista de usuarios
  const cargarUsuarios = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const res = await fetch('/api/usuarios');
      const json = await res.json();

      if (!res.ok || !json.success) {
        setMensaje(json.message || 'Error al obtener usuarios');
        setUsuarios([]);
        return;
      }
      setUsuarios(json.data || []);
    } catch (e) {
      console.error('Error cargando usuarios:', e);
      setMensaje('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios cuando el componente se monta
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Si hay errores de validación, los mostramos
        if (json.errors) {
          const errorMessages = Object.values(json.errors).flat().join(' ');
          setMensaje(`Error: ${errorMessages}`);
        } else {
          setMensaje(json.message || 'Error al crear el usuario');
        }
        return;
      }

      setMensaje('Usuario creado exitosamente');
      // Limpiar formulario
      setFormState({
        nombreCompleto: '',
        username: '',
        email: '',
        password: '',
        rol: 'tesorero',
      });
      // Recargar la lista de usuarios para ver el nuevo
      await cargarUsuarios();

    } catch (error) {
      console.error('Error en el submit:', error);
      setMensaje('Error de conexión al crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const formInputClass = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen font-['Segoe_UI',sans-serif]">
      <div className="flex-grow p-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-[30px] bg-white rounded-lg my-[30px] shadow-md">
            <div className="text-2xl font-bold border-b-2 border-gray-300 pb-2 mb-[20px] text-[#003366]">
              Gestión de Usuarios
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

            {/* Formulario de creación */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Crear Nuevo Usuario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Nombre Completo</label>
                  <input type="text" name="nombreCompleto" value={formState.nombreCompleto} onChange={handleInputChange} className={formInputClass} required />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Nombre de Usuario</label>
                  <input type="text" name="username" value={formState.username} onChange={handleInputChange} className={formInputClass} required />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                  <input type="email" name="email" value={formState.email} onChange={handleInputChange} className={formInputClass} required />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                  <input type="password" name="password" value={formState.password} onChange={handleInputChange} className={formInputClass} required />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Rol</label>
                  <select name="rol" value={formState.rol} onChange={handleInputChange} className={formInputClass} required>
                    <option value="tesorero">Tesorero</option>
                    <option value="pastorGeneral">Pastor General</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>

            {/* Tabla de usuarios */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold">ID</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold">Nombre Completo</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold">Username</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold">Email</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold">Rol</th>
                    <th className="py-2 px-4 border-b text-left text-gray-700 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length > 0 ? (
                    usuarios.map(usuario => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{usuario.id}</td>
                        <td className="py-2 px-4 border-b">{usuario.nombreCompleto}</td>
                        <td className="py-2 px-4 border-b">{usuario.username}</td>
                        <td className="py-2 px-4 border-b">{usuario.email}</td>
                        <td className="py-2 px-4 border-b">{usuario.rol}</td>
                        <td className="py-2 px-4 border-b">
                          {usuario.estado === 1 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Inactivo</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                        {loading ? 'Cargando usuarios...' : 'No hay usuarios registrados.'}
                      </td>
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
