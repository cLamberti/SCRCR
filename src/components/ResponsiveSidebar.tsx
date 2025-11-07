'use client';

import { useState } from 'react';
import { FaHome, FaUserPlus, FaUsers, FaList, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

export default function ResponsiveSidebar({ activeItem = 'listado', onItemClick }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  // Menú para usuarios administradores logueados
  const adminMenuItems = [
    { id: 'inicio', href: '/', icon: FaHome, label: 'Inicio' },
    { id: 'listado', href: '/consulta-asociados', icon: FaList, label: 'Gestionar Asociados' },
    { id: 'configuracion', href: '#', icon: FaCog, label: 'Configuración' },
    { id: 'cerrar', href: '#', icon: FaSignOutAlt, label: 'Cerrar Sesión' }
  ];

  // Menú público (para usuarios no logueados)
  const publicMenuItems = [
    { id: 'inicio', href: '/', icon: FaHome, label: 'Inicio' },
    { id: 'registro-asociados', href: '/registro-asociados', icon: FaUserPlus, label: 'Registro de Asociados' },
    { id: 'registro-congregados', href: '#', icon: FaUsers, label: 'Registro de Congregados' }
  ];

  // Usar el menú apropiado según el estado de autenticación
  const menuItems = user ? adminMenuItems : publicMenuItems;

  const handleItemClick = (itemId: string) => {
    if (itemId === 'cerrar') {
      logout();
      setIsMobileOpen(false);
      return;
    }
    
    if (onItemClick) {
      onItemClick(itemId);
    }
    setIsMobileOpen(false); // Cerrar menú móvil al hacer click
  };

  const MenuContent = () => (
    <>
      <div className="px-5 mb-8">
        <h4 className="text-center text-lg font-semibold">
          {user ? `Bienvenido, ${user.username}` : 'Menú'}
        </h4>
        <div className="w-full h-px bg-[#005599] mt-2"></div>
      </div>

      <nav className="flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={() => handleItemClick(item.id)}
              className={`
                text-white no-underline flex items-center py-3 px-5 transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-[#005599] border-r-4 border-white shadow-inner' 
                  : 'hover:bg-[#004488] hover:pl-6'
                }
              `}
            >
              <Icon className={`
                mr-3 transition-all duration-200
                ${isActive ? 'text-white scale-110' : 'text-gray-300 group-hover:text-white'}
              `} />
              <span className={`
                transition-all duration-200
                ${isActive ? 'text-white font-medium' : 'text-gray-200 group-hover:text-white'}
              `}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full"></div>
              )}
            </a>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Botón para abrir menú móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#003366] text-white p-3 rounded-md shadow-lg hover:bg-[#005599] transition-colors"
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar Desktop */}
      <div className="hidden lg:flex w-[220px] bg-[#003366] text-white min-h-screen pt-[30px] flex-col shadow-lg">
        <MenuContent />
      </div>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Drawer móvil */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-[280px] bg-[#003366] text-white z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header del drawer */}
        <div className="flex justify-between items-center p-4 border-b border-[#005599]">
          <h3 className="text-lg font-semibold">Menú</h3>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="text-white hover:bg-[#005599] p-2 rounded transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Contenido del drawer */}
        <div className="flex flex-col h-full pt-4">
          <MenuContent />
        </div>
      </div>
    </>
  );
}