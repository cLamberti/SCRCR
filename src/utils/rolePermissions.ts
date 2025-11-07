
export const ROLES = {
  ADMIN: 'admin',
  TESORERO: 'tesorero',
  PASTOR_GENERAL: 'pastorGeneral',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export interface ModulePermission {
  name: string;
  path: string;
  icon: string;
  description: string;
  allowedRoles: Role[];
}

export const MODULES: ModulePermission[] = [
  {
    name: 'Gestión de Usuarios',
    path: '/gestion-usuarios',
    icon: 'FaUsers',
    description: 'Administrar usuarios del sistema',
    allowedRoles: [ROLES.ADMIN],
  },
  {
    name: 'Gestion de Asociados',
    path: '/registro-asociados',
    icon: 'FaUserPlus',
    description: 'Registrar, Consultar, Eliminar, o editar asociados',
    allowedRoles: [ROLES.ADMIN, ROLES.PASTOR_GENERAL],
  },
  {
    name: 'Gestion de Congregados',
    path: '/consulta-asociados',
    icon: 'FaSearch',
    description: 'Registrar, Consultar, Eliminar, o editar congregados',
    allowedRoles: [ROLES.ADMIN, ROLES.TESORERO, ROLES.PASTOR_GENERAL],
  },
  {
    name: 'Reportes de asistencia',
    path: '/eliminar-asociados',
    icon: 'FaTrash',
    description: 'Ver reportes de asistencia y estadísticas',
    allowedRoles: [ROLES.ADMIN],
  },
  {
    name: 'Reportes Financieros',
    path: '/reportes-financieros',
    icon: 'FaChartLine',
    description: 'Ver reportes y estadísticas financieras',
    allowedRoles: [ROLES.ADMIN, ROLES.TESORERO],
  },
  {
    name: 'Gestion de eventos',
    path: '/gestion-congregados',
    icon: 'FaChurch',
    description: 'Administrar eventos de la iglesia',
    allowedRoles: [ROLES.ADMIN, ROLES.PASTOR_GENERAL],
  },
  {
  name: 'Registro de asistencia',
  path: '/asistencia/registro',
  icon: 'FaClipboard', 
  description: 'Registrar asistencia de congregados y asociados',
  allowedRoles: [ROLES.ADMIN,], //Ver roles que van aqui
},



];

export function getModulesForRole(role: Role): ModulePermission[] {
  return MODULES.filter(module => module.allowedRoles.includes(role));
}

export function canAccessModule(role: Role, modulePath: string): boolean {
  const module = MODULES.find(m => m.path === modulePath);
  return module ? module.allowedRoles.includes(role) : false;
}

export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.TESORERO]: 'Tesorero',
    [ROLES.PASTOR_GENERAL]: 'Pastor General',
  };
  return roleNames[role] || role;
}
