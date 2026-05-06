'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome, FaUserPlus, FaList,
  FaSignOutAlt, FaBars, FaTimes, FaChurch,
  FaCalendarAlt, FaUsers, FaChartLine, FaCog, FaClipboardList, FaFileAlt
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'admin' | 'tesorero' | 'pastorGeneral';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  roles: Role[];
};

interface SidebarProps {
  activeItem?: string;
  pageTitle?: string;
}

const NAV_ITEMS: Omit<NavItem, 'onClick'>[] = [
  {
    id: 'inicio',
    href: '/',
    icon: FaHome,
    label: 'Inicio',
    roles: ['admin', 'tesorero', 'pastorGeneral'],
  },
  {
    id: 'listado',
    href: '/consulta-asociados',
    icon: FaList,
    label: 'Listado Asociados',
    roles: ['admin', 'tesorero', 'pastorGeneral'],
  },
  {
  id: "congregados",
  href: "/congregados",
  icon: FaUsers,
  label: "Congregados",
  roles: ["admin", "tesorero", "pastorGeneral"] as Role[],
},
  {
    id: 'eventos',
    href: '/eventos',
    icon: FaCalendarAlt,
    label: 'Eventos',
    roles: ['admin', 'tesorero', 'pastorGeneral'],
  },
  {
    id: 'gestion-usuarios',
    href: '/gestion-usuarios',
    icon: FaUsers,
    label: 'Gestión de Usuarios',
    roles: ['admin', 'pastorGeneral'],
  },
  {
    id: 'planilla',
    href: '/planilla',
    icon: FaFileAlt,
    label: 'Planilla',
    roles: ['admin', 'tesorero'],
  },
  {
    id: 'reportes',
    href: '/reportes',
    icon: FaChartLine,
    label: 'Reportes',
    roles: ['admin', 'tesorero', 'pastorGeneral'],
  },
  {
    id: 'permisos',
    href: '/permisos',
    icon: FaClipboardList,
    label: 'Permisos',
    roles: ['admin', 'tesorero', 'pastorGeneral'] as Role[],
  },
  {
    id: 'configuracion',
    href: '/configuracion',
    icon: FaCog,
    label: 'Configuración',
    roles: ['admin', 'tesorero', 'pastorGeneral'] as Role[],
  },
];

const ROL_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  tesorero: 'Tesorero',
  pastorGeneral: 'Pastor General',
};

export default function Sidebar({ activeItem, pageTitle = 'SCRCR' }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout, usuario, loading } = useAuth();

  const rol = usuario?.rol as Role | undefined;

  // Solo filtra cuando el contexto ya resolvió la sesión
  const itemsFiltrados: NavItem[] = !loading && rol
    ? NAV_ITEMS.filter(item => item.roles.includes(rol))
    : [];

  const menuItems: NavItem[] = [
    ...itemsFiltrados,
    // Cerrar sesión siempre al final, solo si hay sesión activa
    ...(usuario && !loading
      ? [{
          id: 'cerrar',
          onClick: logout,
          icon: FaSignOutAlt,
          label: 'Cerrar Sesión',
          roles: ['admin', 'tesorero', 'pastorGeneral'] as Role[],
        }]
      : []),
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

      {/* Encabezado con logo */}
      <div className="px-4 pt-6 pb-5 border-b border-white/10">
        <Link href={usuario && !loading ? '/' : pathname} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <FaChurch className="text-white text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">SCRCR</p>
            <p className="text-white/45 text-[10px] leading-tight mt-0.5">Iglesia Bíblica Emanuel</p>
          </div>
        </Link>
      </div>

      {/* Datos del usuario autenticado */}
      {!loading && usuario && (
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <p className="text-white/80 text-xs font-semibold truncate">{usuario.nombreCompleto}</p>
          <p className="text-white/40 text-[10px] mt-0.5">
            {rol ? ROL_LABEL[rol] : ''}
          </p>
        </div>
      )}

      {/* Skeleton mientras el AuthContext verifica la sesión */}
      {loading && (
        <div className="px-4 pt-4 pb-3 border-b border-white/10 space-y-1.5">
          <div className="h-3 w-32 rounded bg-white/15 animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-white/10 animate-pulse" />
        </div>
      )}

      <p className="px-4 pt-4 pb-2 text-[10px] font-bold tracking-widest text-white/30 uppercase">
        Módulos
      </p>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">

        {/* Placeholders animados mientras carga */}
        {loading && (
          <div className="space-y-1 pt-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-xl bg-white/10 animate-pulse"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        )}

        {/* Items reales una vez resuelto el usuario */}
        {!loading && menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const isCerrar = item.id === 'cerrar';

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
      {/* Barra superior móvil */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#003366] flex items-center gap-3 px-4 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <FaBars className="text-white text-base" />
        </button>
        <Link href={usuario && !loading ? '/' : pathname} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
          <FaChurch className="text-white/60 text-sm flex-shrink-0" />
          <span className="text-white font-semibold text-sm truncate">{pageTitle}</span>
        </Link>
      </header>

      {/* Overlay móvil */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Aside principal */}
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