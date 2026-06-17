export type Rol = 'admin' | 'pastorGeneral' | 'juntaDirectiva' | 'asistenteAdministrativo';

export const ROLES: { key: Rol; label: string }[] = [
  { key: 'admin',                    label: 'Administrador'           },
  { key: 'pastorGeneral',            label: 'Pastor General'          },
  { key: 'juntaDirectiva',           label: 'Junta Directiva'         },
  { key: 'asistenteAdministrativo',  label: 'Asistente Administrativo' },
];

export type ModuloKey =
  | 'inicio'
  | 'listado'
  | 'congregados'
  | 'eventos'
  | 'gestion-usuarios'
  | 'planilla'
  | 'reportes'
  | 'permisos'
  | 'actas'
  | 'configuracion'
  | 'gestion-roles';

export interface ModuloConfig {
  key: ModuloKey;
  label: string;
  descripcion: string;
  bloqueadoPara?: Rol[];
}

export const MODULOS: ModuloConfig[] = [
  { key: 'inicio',           label: 'Inicio',                 descripcion: 'Panel principal del sistema' },
  { key: 'listado',          label: 'Listado de Asociados',   descripcion: 'Consultar y gestionar asociados' },
  { key: 'congregados',      label: 'Congregados',            descripcion: 'Registro de congregados de la iglesia' },
  { key: 'eventos',          label: 'Eventos',                descripcion: 'Gestión de eventos y asistencias' },
  { key: 'gestion-usuarios', label: 'Gestión de Usuarios',    descripcion: 'Administrar cuentas de usuario', bloqueadoPara: ['pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'] },
  { key: 'planilla',         label: 'Planilla',               descripcion: 'Gestión de planilla y empleados' },
  { key: 'reportes',         label: 'Reportes',               descripcion: 'Reportes y estadísticas' },
  { key: 'permisos',         label: 'Permisos',               descripcion: 'Permisos y ausencias generales' },
  { key: 'actas',            label: 'Actas',                  descripcion: 'Actas de asociación y junta directiva' },
  { key: 'configuracion',    label: 'Configuración',          descripcion: 'Ajustes del sistema' },
  { key: 'gestion-roles',    label: 'Gestión de Roles',       descripcion: 'Administrar permisos por rol', bloqueadoPara: ['pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'] },
];

/** Permisos por defecto — usados para seed inicial */
export const PERMISOS_DEFAULT: Record<ModuloKey, Rol[]> = {
  'inicio':           ['admin', 'pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  'listado':          ['admin', 'juntaDirectiva'],
  'congregados':      ['admin', 'pastorGeneral', 'asistenteAdministrativo'],
  'eventos':          ['admin', 'pastorGeneral', 'asistenteAdministrativo'],
  'gestion-usuarios': ['admin'],
  'planilla':         ['admin', 'pastorGeneral'],
  'reportes':         ['admin', 'pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  'permisos':         ['admin', 'pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  'actas':            ['admin', 'pastorGeneral', 'juntaDirectiva'],
  'configuracion':    ['admin', 'pastorGeneral', 'juntaDirectiva', 'asistenteAdministrativo'],
  'gestion-roles':    ['admin'],
};
