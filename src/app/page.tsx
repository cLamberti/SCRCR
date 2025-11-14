'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { 
  FaUserPlus, 
  FaSearch, 
  FaUserMinus, 
  FaUsers, 
  FaChartLine,
  FaCog,
  FaExclamationTriangle,
  FaCalendarAlt
} from 'react-icons/fa';

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un mensaje de no autorizado en sessionStorage
    const message = sessionStorage.getItem('unauthorized-message');
    if (message) {
      setUnauthorizedMessage(message);
      sessionStorage.removeItem('unauthorized-message');
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        setUnauthorizedMessage(null);
      }, 5000);
    }
  }, []);

  // Definir módulos según el rol
  const getModulosPorRol = () => {
    if (!user) return [];

    const modulos = [
      {
        titulo: 'Registro de Asociados',
        descripcion: 'Registrar nuevos asociados en el sistema',
        icono: <FaUserPlus className="text-4xl" />,
        href: '/registro-asociados',
        roles: ['admin', 'tesorero', 'pastorGeneral'],
        color: 'from-[#003366] to-[#004488]'
      },
      {
        titulo: 'Consulta de Asociados',
        descripcion: 'Buscar y consultar información de asociados',
        icono: <FaSearch className="text-4xl" />,
        href: '/consulta-asociados',
        roles: ['admin', 'tesorero', 'pastorGeneral'],
        color: 'from-[#17609c] to-[#2070ac]'
      },
      {
        titulo: 'Eliminar Asociados',
        descripcion: 'Gestionar la eliminación de asociados',
        icono: <FaUserMinus className="text-4xl" />,
        href: '/eliminar-asociados',
        roles: ['admin', 'pastorGeneral'],
        color: 'from-gray-600 to-gray-700'
      },
      {
        titulo: 'Gestión de Usuarios',
        descripcion: 'Administrar usuarios del sistema',
        icono: <FaUsers className="text-4xl" />,
        href: '/gestion-usuarios',
        roles: ['admin', 'pastorGeneral'],
        color: 'from-slate-600 to-slate-700'
      },
      {
        titulo: 'Registro de Asistencia',
        descripcion: 'Generar registro de asistencia',
        icono: <FaChartLine className="text-4xl" />,
        href: '/asistencia/registro',
        roles: ['admin', 'tesorero', 'pastorGeneral'],
        color: 'from-[#2070ac] to-[#3080bc]'
      },
      {
        titulo: 'Configuración',
        descripcion: 'Configurar parámetros del sistema',
        icono: <FaCog className="text-4xl" />,
        href: '/configuracion',
        roles: ['admin'],
        color: 'from-gray-700 to-gray-800'
      },
      {
        titulo: 'Eventos',
        descripcion: 'Crea, edita y elimina eventos',
        icono: <FaCalendarAlt className="text-4xl" />, 
        href: '/eventos',
        roles: ['admin', 'tesorero', 'pastorGeneral'], 
        color: 'from-[#3080bc] to-[#17609c]'
      },
    ];

    // Filtrar módulos según el rol del usuario
    return modulos.filter(modulo => modulo.roles.includes(user.rol));
  };

  const modulosDisponibles = getModulosPorRol();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003366] to-[#17609c] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Sistema SCRCR
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto">
            Sistema de Control y Registro de Asociados, Congregados y Recursos Humanos
          </p>
          <p className="text-md mt-2 opacity-90">
            Iglesia Bíblica Emanuel
          </p>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Mensaje de no autorizado */}
        {unauthorizedMessage && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-md animate-fade-in">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
              <div>
                <h3 className="text-red-800 font-bold">Acceso Denegado</h3>
                <p className="text-red-700">{unauthorizedMessage}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#003366] mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        ) : isAuthenticated && user ? (
          <>
            {/* Mensaje de bienvenida */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenido, {user.nombreCompleto}
              </h2>
              <p className="text-gray-600">
                Rol: <span className="font-semibold text-[#003366]">
                  {user.rol === 'admin' ? 'Administrador' : 
                   user.rol === 'tesorero' ? 'Tesorero' : 
                   'Pastor General'}
                </span>
              </p>
            </div>

            {/* Grid de Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modulosDisponibles.map((modulo, index) => (
                <Link
                  key={index}
                  href={modulo.href}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full border border-gray-200">
                    <div className={`bg-gradient-to-r ${modulo.color} p-6 text-white flex justify-center items-center h-32 group-hover:scale-105 transition-transform duration-300`}>
                      {modulo.icono}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#003366] transition-colors">
                        {modulo.titulo}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {modulo.descripcion}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Información adicional */}
            {modulosDisponibles.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">
                  No hay módulos disponibles para tu rol actual.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Vista para usuarios no autenticados */}
            <div className="max-w-4xl mx-auto">
              {/* Logo de la iglesia */}
              <div className="mb-12 flex justify-center">
                <Image
                  src="/logo-iglesia.png"
                  alt="Logo de la Iglesia Bíblica Emanuel"
                  width={400}
                  height={300}
                  className="w-full max-w-md h-auto object-contain"
                  priority
                />
              </div>

              {/* Información del sistema */}
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                  Acerca del Sistema
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  El Sistema SCRCR es una plataforma integral diseñada para la gestión 
                  eficiente de asociados, congregados y recursos humanos de la Iglesia 
                  Bíblica Emanuel.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-[#003366] mb-2">Funcionalidades</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• Registro de asociados</li>
                      <li>• Consulta de información</li>
                      <li>• Gestión de usuarios</li>
                      <li>• Reportes y estadísticas</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-[#003366] mb-2">Beneficios</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• Organización centralizada</li>
                      <li>• Acceso rápido a datos</li>
                      <li>• Seguridad de información</li>
                      <li>• Control de accesos</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center bg-gradient-to-r from-[#003366] to-[#17609c] text-white rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">
                  ¿Listo para comenzar?
                </h3>
                <p className="mb-6">
                  Inicia sesión para acceder a todas las funcionalidades del sistema
                </p>
                <Link
                  href="/login"
                  className="inline-block bg-white text-[#003366] px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Sistema SCRCR - Iglesia Bíblica Emanuel
          </p>
          <p className="text-xs mt-2 opacity-75">
            Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}