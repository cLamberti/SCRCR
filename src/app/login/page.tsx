'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaChurch, FaUser } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, usuario } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar usuario en el contexto
      login(data.data.usuario);

      // Mostrar mensaje de éxito
      setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
      
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-['Segoe_UI',_sans-serif]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <FaChurch className="mx-auto text-4xl text-[#003366]" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Iniciar Sesión en SCRCR
          </h1>
          <p className="text-gray-600">
            Bienvenido de nuevo.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="text-sm font-bold text-gray-700 block mb-2"
            >
              Nombre de Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
              placeholder="su_usuario"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-bold text-gray-700 block mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white font-bold bg-[#003366] rounded-md hover:bg-[#004488] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] disabled:bg-gray-400"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
        
        {usuario && (
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <FaUser className="text-2xl text-gray-700" />
              <span className="text-lg font-medium text-gray-900">{usuario.username}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}