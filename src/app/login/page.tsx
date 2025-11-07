'use client';

import { useState } from 'react';
import { FaChurch } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('=== FRONTEND LOGIN ===');
    console.log('Username:', username);
    console.log('Password length:', password.length);

    try {
      const body = {
        username: username.trim(),
        password: password
      };

      console.log('Enviando body:', body);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Mostrar mensaje de éxito
      setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
      
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        router.push(redirect);
        router.refresh();
      }, 1500);

    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] text-gray-900"
              placeholder="su_usuario"
              autoComplete="username"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] text-gray-900"
              placeholder="••••••••"
              autoComplete="current-password"
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
              className="w-full px-4 py-2 text-white font-bold bg-[#003366] rounded-md hover:bg-[#004488] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>¿Olvidaste tu contraseña?</p>
          <Link href="/recuperar-password" className="text-[#003366] hover:underline font-medium">
            Recuperar contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}