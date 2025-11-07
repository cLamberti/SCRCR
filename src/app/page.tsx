'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaChurch, FaUser, FaSignOutAlt, FaUsers, FaUserPlus, FaSearch, FaTrash, FaChartLine } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getModulesForRole, getRoleDisplayName } from '@/utils/rolePermissions';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaTrash,
  FaChartLine,
  FaChurch,
};

export default function HomePage() {
  const { usuario, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const availableModules = usuario ? getModulesForRole(usuario.rol as any) : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] font-['Segoe_UI',_sans-serif]">
      {/* Navbar */}
      <nav className="bg-[#003366] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            {/* Logo y Marca */}
            <Link 
              href="/" 
              className="text-white text-xl font-bold p-2 rounded transition-colors hover:bg-[#005599] flex items-center" 
              id="head"
            >
              <FaChurch className="inline mr-2" /> SCRCR
            </Link>
            
            {/* Botones de Navegación o Info de Usuario */}
            <div className="flex gap-4 items-center">
              {loading ? (
                <div className="text-white">Cargando...</div>
              ) : usuario ? (
                <>
                  {/* Información del usuario logueado */}
                  <div className="flex items-center gap-3 text-white">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-xl" />
                        <span className="text-sm font-semibold">{usuario.nombreCompleto}</span>
                      </div>
                      <span className="text-xs text-gray-300">{getRoleDisplayName(usuario.rol as any)}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300 flex items-center gap-2"
                    >
                      <FaSignOutAlt />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
                  >
                    Ingresar al Sistema
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-5 text-center bg-gradient-to-r from-[#003366] to-[#17609c] text-white">
        <h1 className="text-4xl sm:text-5xl font-bold mb-5">
          {usuario ? `Bienvenido, ${usuario.nombreCompleto}` : 'Bienvenido al Sistema SCRCR'}
        </h1>
        <p className="text-lg max-w-3xl mx-auto">
          {usuario 
            ? `Accede a los módulos disponibles para tu rol de ${getRoleDisplayName(usuario.rol as any)}`
            : 'Este sistema permite gestionar los registros de asociados, congregados y recursos humanos de manera eficiente para la Iglesia Bíblica Emanuel.'
          }
        </p>
      </section>

      {/* Content Section */}
      <div className="content container mx-auto px-4 py-12 flex-grow">
        
        {usuario ? (
          /* Módulos disponibles para el usuario */
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[#003366] mb-8 text-center">
              Módulos Disponibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableModules.map((module) => {
                const IconComponent = iconMap[module.icon] || FaChurch;
                return (
                  <Link
                    key={module.path}
                    href={module.path}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border-2 border-transparent hover:border-[#003366]"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#003366] text-white rounded-full p-4 mb-4">
                        <IconComponent className="text-3xl" />
                      </div>
                      <h3 className="text-xl font-bold text-[#003366] mb-2">
                        {module.name}
                      </h3>
                      <p className="text-gray-600">
                        {module.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* Imagen Central: logo-iglesia.png */
          <div className="flex flex-col items-center">
            <div className="mb-10 w-full max-w-md sm:max-w-lg lg:max-w-xl">
              <Image
                src="/logo-iglesia.png" 
                alt="Logo de la Iglesia Bíblica Emanuel"
                width={700}
                height={400} 
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="mt-auto bg-[#003366] text-white text-center py-4">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            Sistema de Control y Registro de Asociados, Congregados y Recursos Humanos (SCRCR) | Iglesia Bíblica Emanuel
          </p>
        </div>
      </footer>
    </div>
  );
}