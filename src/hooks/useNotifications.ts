'use client';

import { useState, useCallback } from 'react';
import { NotificationType } from '@/components/Notification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: NotificationItem = {
      id,
      type,
      title,
      message,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after some time as backup
    setTimeout(() => {
      removeNotification(id);
    }, type === 'error' ? 10000 : 7000);

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Métodos de conveniencia
  const showSuccess = useCallback((title: string, message: string) => {
    return addNotification('success', title, message);
  }, [addNotification]);

  const showError = useCallback((title: string, message: string) => {
    return addNotification('error', title, message);
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    return addNotification('warning', title, message);
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    return addNotification('info', title, message);
  }, [addNotification]);

  // Métodos específicos para errores de login y acceso
  const showLoginError = useCallback((error: string) => {
    const errorMessages: Record<string, { title: string; message: string }> = {
      'Credenciales inválidas': {
        title: 'Error de Autenticación',
        message: 'El usuario o contraseña son incorrectos. Por favor, verifica tus datos e intenta de nuevo.'
      },
      'Usuario temporalmente bloqueado': {
        title: 'Cuenta Bloqueada',
        message: 'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Intenta de nuevo en unos minutos.'
      },
      'Error de conexión': {
        title: 'Problema de Conexión',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.'
      },
      'Token expirado': {
        title: 'Sesión Expirada',
        message: 'Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.'
      },
      'Sesión inválida': {
        title: 'Sesión Inválida',
        message: 'Tu sesión no es válida. Por favor, inicia sesión nuevamente.'
      }
    };

    const errorData = errorMessages[error] || {
      title: 'Error de Inicio de Sesión',
      message: error || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
    };

    return showError(errorData.title, errorData.message);
  }, [showError]);

  const showAccessDenied = useCallback((module: string, userRole: string) => {
    const roleNames: Record<string, string> = {
      'admin': 'Administrador',
      'tesorero': 'Tesorero',
      'pastorGeneral': 'Pastor General'
    };

    return showWarning(
      'Acceso Restringido',
      `Lo sentimos, tu rol de ${roleNames[userRole] || userRole} no tiene permisos para acceder al módulo "${module}". Contacta al administrador si necesitas acceso.`
    );
  }, [showWarning]);

  const showLoginSuccess = useCallback((userName: string) => {
    return showSuccess(
      '¡Bienvenido!',
      `Hola ${userName}, has iniciado sesión exitosamente. Redirigiendo...`
    );
  }, [showSuccess]);

  const showLogoutSuccess = useCallback(() => {
    return showInfo(
      'Sesión Cerrada',
      'Has cerrado sesión correctamente. ¡Hasta pronto!'
    );
  }, [showInfo]);

  const showSessionWarning = useCallback((timeLeft: number) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return showWarning(
      'Sesión por Expirar',
      `Tu sesión expirará en ${minutes}:${seconds.toString().padStart(2, '0')}. Realiza alguna acción para mantenerla activa.`
    );
  }, [showWarning]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoginError,
    showAccessDenied,
    showLoginSuccess,
    showLogoutSuccess,
    showSessionWarning
  };
};