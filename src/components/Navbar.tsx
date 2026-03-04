'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaChurch, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#003366] text-white shadow-lg relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <FaChurch className="text-2xl flex-shrink-0" />
            <span className="font-bold text-xl">SCRCR</span>
          </Link>

          {/* Desktop: usuario y logout */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <span className="text-sm opacity-70">Cargando...</span>
            ) : isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2">
                  <FaUser className="text-sm opacity-70" />
                  <span className="text-sm font-medium">{user.nombreCompleto}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">
                    {user.rol === 'admin' ? 'Admin' : user.rol === 'tesorero' ? 'Tesorero' : 'Pastor General'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 hover:text-gray-300 transition-colors text-sm"
                >
                  <FaSignOutAlt />
                  Salir
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-white text-[#003366] px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors text-sm">
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile: botón hamburguesa */}
          <button
            className="md:hidden p-2 rounded hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div className="md:hidden bg-[#002a52] border-t border-white/10 px-4 py-3">
          {loading ? (
            <p className="text-sm py-2 opacity-70">Cargando...</p>
          ) : isAuthenticated && user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 py-2 border-b border-white/10">
                <FaUser className="text-sm opacity-70" />
                <span className="text-sm font-medium">{user.nombreCompleto}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-auto">
                  {user.rol === 'admin' ? 'Admin' : user.rol === 'tesorero' ? 'Tesorero' : 'Pastor'}
                </span>
              </div>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm py-2 hover:text-gray-300 transition-colors w-full"
              >
                <FaSignOutAlt />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block bg-white text-[#003366] px-4 py-2 rounded-md font-medium text-center text-sm"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}