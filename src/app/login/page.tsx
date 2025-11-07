'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaChurch, FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '@/components/Notification';

interface LoginForm {
  username: string;
  password: string;
}

interface LoginError {
  field: string;
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const { 
    notifications, 
    removeNotification, 
    showLoginError, 
    showLoginSuccess 
  } = useNotifications();
  
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginError[]>([]);

  // Verificar si ya está logueado
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Ya está logueado, redirigir
          window.location.href = '/consulta-asociados';
        }
      }
    } catch (error) {
      // No hacer nada si falla la verificación
      console.log('No hay sesión activa');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Login exitoso, datos recibidos:', data);
        showLoginSuccess(data.user?.nombreCompleto || data.user?.username || 'Usuario');
        
        // Usar window.location para asegurar que las cookies se envíen
        setTimeout(() => {
          window.location.href = '/consulta-asociados';
        }, 1500);
      } else {
        console.log('Error en login:', { response, data });
        const errorMessage = data.message || 'Error al iniciar sesión';
        showLoginError(errorMessage);
        setErrors(data.errors || []);
      }
    } catch (error) {
      console.error('Error al hacer login:', error);
      showLoginError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string): string | null => {
    const error = errors.find(err => err.field === field);
    return error ? error.message : null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f4f4f4] to-[#e8e8e8]">
      {/* Navbar */}
      <nav className="bg-[#003366] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <Link 
              href="/" 
              className="text-white text-xl font-bold p-2 rounded transition-colors hover:bg-[#005599] flex items-center"
            >
              <FaChurch className="inline mr-2" /> SCRCR
            </Link>
            
            <Link
              href="/"
              className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-[#003366] rounded-full flex items-center justify-center mb-4">
              <FaChurch className="text-white text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-gray-600">
              Sistema SCRCR - Iglesia Bíblica Emanuel
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-lg p-8">

              {/* Campo Username */}
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border ${
                      getFieldError('username') ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#003366] focus:border-[#003366] focus:z-10 sm:text-sm`}
                    placeholder="Ingresa tu usuario"
                    value={form.username}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {getFieldError('username') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('username')}</p>
                )}
              </div>

              {/* Campo Password */}
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none rounded-md relative block w-full pl-10 pr-10 py-3 border ${
                      getFieldError('password') ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#003366] focus:border-[#003366] focus:z-10 sm:text-sm`}
                    placeholder="Ingresa tu contraseña"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                    )}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
                )}
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#003366] hover:bg-[#005599] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366]'
                } transition duration-200`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <FaSignInAlt className={`h-5 w-5 ${loading ? 'text-gray-300' : 'text-white group-hover:text-gray-200'}`} />
                </span>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>


        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#003366] text-white text-center py-4">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            Sistema SCRCR | Iglesia Bíblica Emanuel
          </p>
        </div>
      </footer>

      {/* Contenedor de notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}