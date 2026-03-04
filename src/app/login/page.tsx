'use client';

import { useState, Suspense } from 'react';
import { FaChurch, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  // Usar el login del contexto para que el usuario quede seteado
  // en el estado global antes de navegar
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      // login() ya hace router.push('/') internamente
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#001f4d] via-[#003366] to-[#004080]">
      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white">
        <FaChurch className="text-7xl mb-6 opacity-90" />
        <h1 className="text-4xl font-bold mb-3 text-center">SCRCR</h1>
        <p className="text-lg text-white/70 text-center max-w-sm leading-relaxed">
          Sistema de Control y Registro de Asociados, Congregados y Recursos Humanos
        </p>
        <p className="mt-4 text-white/50 text-sm">Iglesia Bíblica Emanuel de Liberia</p>

        <div className="mt-12 grid grid-cols-3 gap-4 opacity-20">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-white" />
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <FaChurch className="text-5xl text-white mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">SCRCR</h1>
            <p className="text-white/60 text-sm mt-1">Iglesia Bíblica Emanuel</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                    placeholder="su_usuario"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#003366] hover:bg-[#004488] disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-gray-500">
              <Link href="/recuperar-password" className="text-[#003366] hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            © {new Date().getFullYear()} Sistema SCRCR — Iglesia Bíblica Emanuel
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#003366]">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white/70 text-sm">Cargando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}