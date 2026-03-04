'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome, FaUserPlus, FaList,
  FaSignOutAlt, FaBars, FaTimes, FaChurch,
  FaCalendarAlt,
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

// Un item puede ser un Link (href) o un botón (onClick)
type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
};

interface SidebarProps {
  activeItem?: string;
  pageTitle?: string;
}

export default function Sidebar({ activeItem, pageTitle = 'SCRCR' }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth(); // se llama dentro del componente, no afuera

  const menuItems: NavItem[] = [
    { id: 'inicio',           href: '/',                   icon: FaHome,        label: 'Inicio'              },
    { id: 'listado',          href: '/consulta-asociados', icon: FaList,        label: 'Listado Asociados'   },
    { id: 'eventos',          href: '/eventos',            icon: FaCalendarAlt, label: 'Eventos'             },
    { id: 'gestion-usuarios', href: '/gestion-usuarios',   icon: FaUserPlus,    label: 'Gestión de Usuarios' },
    { id: 'reportes',         href: '/reportes',           icon: FaList,        label: 'Reportes'            },
    { id: 'cerrar',           onClick: logout,             icon: FaSignOutAlt,  label: 'Cerrar Sesión'       },
  ];

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (item: NavItem) =>
    activeItem ? activeItem === item.id : item.href ? pathname === item.href : false;

  const NavContent = () => (
    <div className="flex flex-col h-full">

      <div className="px-4 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <FaChurch className="text-white text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">SCRCR</p>
            <p className="text-white/45 text-[10px] leading-tight mt-0.5">Iglesia Bíblica Emanuel</p>
          </div>
        </div>
      </div>

      <p className="px-4 pt-5 pb-2 text-[10px] font-bold tracking-widest text-white/30 uppercase">
        Módulos
      </p>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const isCerrar = item.id === 'cerrar';

          // Items con onClick se renderizan como botón
          if (item.onClick) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`
                  w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                  transition-all duration-150 select-none
                  ${isCerrar
                    ? 'text-red-300 hover:bg-red-500/20 hover:text-red-200 mt-2'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'}
                `}
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs text-red-300">
                  <Icon />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

          // Items con href se renderizan como Link
          return (
            <Link
              key={item.id}
              href={item.href!}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                transition-all duration-150 select-none
                ${active
                  ? 'bg-white text-[#003366] font-semibold shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'}
              `}
            >
              <span className={`
                w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs
                transition-colors duration-150
                ${active ? 'bg-[#003366]/10 text-[#003366]' : 'text-white/50 group-hover:text-white'}
              `}>
                <Icon />
              </span>
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#003366] flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/25 text-center">v1.0 · 2025</p>
      </div>
    </div>
  );

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#003366] flex items-center gap-3 px-4 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <FaBars className="text-white text-base" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <FaChurch className="text-white/60 text-sm flex-shrink-0" />
          <span className="text-white font-semibold text-sm truncate">{pageTitle}</span>
        </div>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`
          fixed md:static top-0 left-0
          h-full md:h-auto md:min-h-screen
          w-[240px] md:w-[220px]
          bg-[#003366]
          z-[60] md:z-auto
          shadow-2xl md:shadow-none
          flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <button
          className="md:hidden absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <FaTimes className="text-white text-sm" />
        </button>
        <NavContent />
      </aside>
    </>
  );
}