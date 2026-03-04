'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import {
  FaUserPlus, FaSearch, FaUserMinus, FaUsers,
  FaChartLine, FaCog, FaExclamationTriangle, FaCalendarAlt,
} from 'react-icons/fa';

const modulos = [
  { titulo: 'Consulta de Asociados', descripcion: 'Buscar y consultar información de asociados', icono: <FaSearch className="text-3xl" />, href: '/consulta-asociados', roles: ['admin', 'tesorero', 'pastorGeneral'], color: 'from-[#17609c] to-[#2070ac]' },
  { titulo: 'Gestión de Usuarios', descripcion: 'Administrar usuarios del sistema', icono: <FaUsers className="text-3xl" />, href: '/gestion-usuarios', roles: ['admin', 'pastorGeneral'], color: 'from-slate-600 to-slate-700' },
  { titulo: 'Reportes', descripcion: 'Generar reportes y estadísticas', icono: <FaChartLine className="text-3xl" />, href: '/reportes', roles: ['admin', 'tesorero', 'pastorGeneral'], color: 'from-[#2070ac] to-[#3080bc]' },
  { titulo: 'Configuración', descripcion: 'Configurar parámetros del sistema', icono: <FaCog className="text-3xl" />, href: '/configuracion', roles: ['admin'], color: 'from-gray-700 to-gray-800' },
  { titulo: 'Eventos', descripcion: 'Crea, edita y elimina eventos', icono: <FaCalendarAlt className="text-3xl" />, href: '/eventos', roles: ['admin', 'tesorero', 'pastorGeneral'], color: 'from-[#3080bc] to-[#17609c]' },
];

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null);

  useEffect(() => {
    const msg = sessionStorage.getItem('unauthorized-message');
    if (msg) {
      setUnauthorizedMessage(msg);
      sessionStorage.removeItem('unauthorized-message');
      setTimeout(() => setUnauthorizedMessage(null), 5000);
    }
  }, []);

  const modulosDisponibles = user
    ? modulos.filter(m => m.roles.includes(user.rol))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#003366] to-[#17609c] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">Sistema SCRCR</h1>
          <p className="text-base md:text-xl max-w-2xl mx-auto text-white/80 leading-relaxed">
            Sistema de Control y Registro de Asociados, Congregados y Recursos Humanos
          </p>
          <p className="text-sm mt-2 text-white/60">Iglesia Bíblica Emanuel</p>
        </div>
      </section>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {/* Mensaje acceso denegado */}
        {unauthorizedMessage && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-bold text-sm">Acceso Denegado</h3>
                <p className="text-red-700 text-sm">{unauthorizedMessage}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Cargando...</p>
            </div>
          </div>
        ) : isAuthenticated && user ? (
          <>
            {/* Bienvenida */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-7">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                Bienvenido, {user.nombreCompleto}
              </h2>
              <p className="text-gray-500 text-sm">
                Rol: <span className="font-semibold text-[#003366]">
                  {user.rol === 'admin' ? 'Administrador' : user.rol === 'tesorero' ? 'Tesorero' : 'Pastor General'}
                </span>
              </p>
            </div>

            {/* Grid módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {modulosDisponibles.map((m, i) => (
                <Link key={i} href={m.href} className="group">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full border border-gray-100 hover:border-gray-200">
                    <div className={`bg-gradient-to-r ${m.color} p-5 text-white flex justify-center items-center h-28 group-hover:opacity-90 transition-opacity`}>
                      {m.icono}
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-[#003366] transition-colors">
                        {m.titulo}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{m.descripcion}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {modulosDisponibles.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-yellow-800 text-sm">No hay módulos disponibles para tu rol.</p>
              </div>
            )}
          </>
        ) : (
          /* Vista no autenticado */
          <div className="max-w-3xl mx-auto">
            <div className="mb-10 flex justify-center">
              <Image src="/logo-iglesia.png" alt="Logo Iglesia Bíblica Emanuel" width={350} height={250}
                className="w-full max-w-xs h-auto object-contain" priority />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">Acerca del Sistema</h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 text-center">
                Plataforma integral para la gestión eficiente de asociados, congregados y recursos humanos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-bold text-[#003366] text-sm mb-2">Funcionalidades</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    {['Registro de asociados', 'Consulta de información', 'Gestión de usuarios', 'Reportes y estadísticas'].map(f => (
                      <li key={f} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#003366] rounded-full flex-shrink-0" />{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-bold text-[#003366] text-sm mb-2">Beneficios</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    {['Organización centralizada', 'Acceso rápido a datos', 'Seguridad de información', 'Control de accesos'].map(b => (
                      <li key={b} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0" />{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center bg-gradient-to-r from-[#003366] to-[#17609c] text-white rounded-xl p-8">
              <h3 className="text-xl font-bold mb-3">¿Listo para comenzar?</h3>
              <p className="text-white/70 text-sm mb-5">Inicia sesión para acceder a todas las funcionalidades</p>
              <Link href="/login"
                className="inline-block bg-white text-[#003366] px-7 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#003366] text-white py-5 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-white/70">
            © {new Date().getFullYear()} Sistema SCRCR — Iglesia Bíblica Emanuel. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}