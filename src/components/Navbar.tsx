'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaChurch, FaSignOutAlt, FaUsers, FaUserCog, FaTrash, FaFileAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/components/auth/RoleProtection';

interface User {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { hasPermission, hasModuleAccess } = useRolePermissions();

  // Determinar si estamos en página pública (inicio)
  const isPublicPage = pathname === '/' || pathname === '/registro-asociados';
  const isAdminArea = pathname.startsWith('/consulta-') || pathname.startsWith('/admin');

  const handleLogout = async () => {
    await logout();
  };

  // Definir elementos del menú basados en roles
  const getMenuItems = () => {
    if (!user) return [];

    const menuItems = [];

    // Consulta Asociados - Solo para administradores
    if (hasPermission(['admin'])) {
      menuItems.push({
        href: '/consulta-asociados',
        icon: FaUsers,
        label: 'Consultar Asociados',
        shortLabel: 'Consulta'
      });
    }

    // Los otros módulos quedan comentados/eliminados ya que solo el admin debe tener consulta
    // Si necesitas otros roles más adelante, descomenta las líneas apropiadas:
    
    /*
    // Registro Asociados - Solo si se requiere en el futuro
    if (hasPermission(['tesorero'])) {
      menuItems.push({
        href: '/registro-asociados',
        icon: FaUserCog,
        label: 'Registrar Asociados',
        shortLabel: 'Registro'
      });
    }

    // Reportes - Solo si se requiere en el futuro
    if (hasPermission(['tesorero', 'pastorGeneral'])) {
      menuItems.push({
        href: '/reportes',
        icon: FaFileAlt,
        label: 'Reportes',
        shortLabel: 'Reportes'
      });
    }
    */

    return menuItems;
  };



  return (
    <nav className="bg-[#003366] shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo y Marca */}
          <Link 
            href="/" 
            className="text-white text-xl font-bold p-2 rounded transition-colors hover:bg-[#005599] flex items-center"
          >
            <FaChurch className="inline mr-2" /> SCRCR
          </Link>
          
          {/* Navegación - Menú dinámico por roles */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {!loading && (
              <>
                {user && !isPublicPage ? (
                  <>
                    {/* Menú basado en roles */}
                    {getMenuItems().slice(0, 4).map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`text-white hover:bg-[#005599] px-2 py-2 rounded transition duration-300 flex items-center gap-1 text-sm ${
                            isActive ? 'bg-[#005599]' : ''
                          }`}
                          title={item.label}
                        >
                          <Icon className="text-sm" />
                          <span className="hidden lg:inline">{item.shortLabel}</span>
                        </Link>
                      );
                    })}

                    {/* Menú desplegable si hay más opciones */}
                    {getMenuItems().length > 4 && (
                      <div className="relative group">
                        <button className="text-white hover:bg-[#005599] px-2 py-2 rounded transition duration-300 flex items-center gap-1 text-sm">
                          <FaCog className="text-sm" />
                          <span className="hidden lg:inline">Más</span>
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          {getMenuItems().slice(4).map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Icon className="text-sm" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Separador */}
                    <div className="mx-2 h-6 w-px bg-white/30"></div>
                    
                    {/* Información del usuario */}
                    <div className="text-white text-sm px-2 py-1 bg-[#005599] rounded">
                      <span className="hidden md:inline">{user.nombreCompleto || user.username}</span>
                      <span className="md:hidden">{user.username}</span>
                    </div>

                    {/* Botón de logout */}
                    <button
                      onClick={handleLogout}
                      className="text-white hover:bg-red-600 px-2 py-2 rounded transition duration-300 flex items-center gap-1 text-sm"
                      title="Cerrar Sesión"
                    >
                      <FaSignOutAlt className="text-sm" />
                      <span className="hidden lg:inline">Salir</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Usuario no logueado */}
                    {isPublicPage && (
                      <>
                        <Link
                          href="/login"
                          className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
                        >
                          Iniciar Sesión
                        </Link>
                        <Link
                          href="/registro-asociados"
                          className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
                        >
                          Registro
                        </Link>
                      </>
                    )}
                    
                    {isAdminArea && (
                      <Link
                        href="/login"
                        className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
                      >
                        Iniciar Sesión
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}