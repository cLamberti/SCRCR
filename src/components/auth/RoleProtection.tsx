'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import AccessDenied from '@/components/AccessDenied';

interface RolePermissions {
  [key: string]: string[]; // module: allowedRoles[]
}

// Configuración de permisos por módulo
const MODULE_PERMISSIONS: RolePermissions = {
  'consulta-asociados': ['admin', 'tesorero', 'pastorGeneral'],
  'registro-asociados': ['admin', 'tesorero'],
  'eliminar-asociados': ['admin'],
  'reportes': ['admin', 'tesorero', 'pastorGeneral'],
  'configuracion': ['admin'],
  'usuarios': ['admin'],
  'auditoria': ['admin']
};

interface WithRoleProtectionOptions {
  requiredRoles?: string[];
  moduleName?: string;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export function withRoleProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithRoleProtectionOptions = {}
) {
  const {
    requiredRoles = [],
    moduleName = 'este módulo',
    redirectTo,
    showAccessDenied = true
  } = options;

  return function ProtectedComponent(props: P) {
    const { user, loading, isAuthenticated } = useAuth();
    const { showAccessDenied: showAccessDeniedNotification } = useNotifications();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
      if (loading) return;

      if (!isAuthenticated || !user) {
        // Usuario no autenticado - esto debería ser manejado por ProtectedRoute
        setHasAccess(false);
        return;
      }

      // Si no se especifican roles requeridos, permitir acceso
      if (requiredRoles.length === 0) {
        setHasAccess(true);
        return;
      }

      // Verificar si el usuario tiene alguno de los roles requeridos
      const userHasAccess = requiredRoles.includes(user.rol || '');
      
      if (!userHasAccess) {
        // Mostrar notificación de acceso denegado
        showAccessDeniedNotification(moduleName, user.rol || 'unknown');
      }

      setHasAccess(userHasAccess);
    }, [user, loading, isAuthenticated, requiredRoles, moduleName, showAccessDeniedNotification]);

    // Mostrar loading mientras se verifica
    if (loading || hasAccess === null) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
        </div>
      );
    }

    // Usuario no tiene acceso
    if (!hasAccess) {
      if (showAccessDenied && user) {
        return (
          <AccessDenied
            userRole={user.rol || 'unknown'}
            moduleName={moduleName}
            requiredRoles={requiredRoles}
            onGoBack={() => window.history.back()}
          />
        );
      }
      
      // Si no se debe mostrar la página de acceso denegado, redirigir
      if (redirectTo) {
        window.location.href = redirectTo;
        return null;
      }
      
      // Por defecto, redirigir al inicio
      window.location.href = '/consulta-asociados';
      return null;
    }

    // Usuario tiene acceso, renderizar componente
    return <WrappedComponent {...props} />;
  };
}

// Hook para verificar permisos en tiempo real
export function useRolePermissions() {
  const { user } = useAuth();
  const { showAccessDenied } = useNotifications();

  const hasPermission = (requiredRoles: string[]): boolean => {
    if (!user || !user.rol) return false;
    return requiredRoles.includes(user.rol);
  };

  const hasModuleAccess = (moduleName: string): boolean => {
    const allowedRoles = MODULE_PERMISSIONS[moduleName];
    if (!allowedRoles) return true; // Si no está definido, permitir acceso
    return hasPermission(allowedRoles);
  };

  const checkAccessAndNotify = (requiredRoles: string[], moduleName: string): boolean => {
    const access = hasPermission(requiredRoles);
    if (!access && user) {
      showAccessDenied(moduleName, user.rol || 'unknown');
    }
    return access;
  };

  const getUserRoleInfo = () => {
    if (!user) return null;
    
    const roleNames: Record<string, string> = {
      'admin': 'Administrador',
      'tesorero': 'Tesorero',
      'pastorGeneral': 'Pastor General'
    };

    return {
      role: user.rol || 'unknown',
      roleName: roleNames[user.rol || ''] || user.rol || 'Desconocido',
      permissions: Object.entries(MODULE_PERMISSIONS)
        .filter(([, allowedRoles]) => allowedRoles.includes(user.rol || ''))
        .map(([module]) => module)
    };
  };

  return {
    hasPermission,
    hasModuleAccess,
    checkAccessAndNotify,
    getUserRoleInfo,
    currentRole: user?.rol || null,
    MODULE_PERMISSIONS
  };
}

export default withRoleProtection;