'use client';

import Link from 'next/link';
import { FaChurch, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <nav className="bg-[#003366] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y nombre */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <FaChurch className="text-2xl" />
            <span className="font-bold text-xl">SCRCR</span>
          </Link>

          {/* Menú de navegación */}
          <div className="flex items-center space-x-6">
            
  

            {/* Usuario y logout */}
            {loading ? (
              <div className="text-sm">Cargando...</div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FaUser className="text-sm" />
                  <span className="text-sm font-medium">{user.nombreCompleto}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">
                    {user.rol === 'admin' ? 'Admin' : 
                     user.rol === 'tesorero' ? 'Tesorero' : 
                     'Pastor General'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 hover:text-gray-300 transition-colors"
                  title="Cerrar sesión"
                >
                  <FaSignOutAlt />
                  <span className="text-sm">Salir</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-white text-[#003366] px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}