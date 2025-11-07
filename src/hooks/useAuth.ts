'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Usuario {
  id: number;
  username: string;
  email?: string;
  nombreCompleto?: string;
  rol?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const router = useRouter();
  
  // Timer para inactividad (15 minutos = 900000 ms) - Recomendación heurística
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  // Mostrar advertencia en los últimos 2 minutos (120 segundos)
  const WARNING_TIME = 2 * 60 * 1000; // 2 minutos

  const checkAuth = async () => {
    try {
      console.log('Verificando autenticación...');
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Respuesta de auth:', data);
        if (data.success && data.user) {
          console.log('Usuario autenticado:', data.user);
          setUser(data.user);
        } else {
          console.log('No hay usuario autenticado');
          setUser(null);
        }
      } else {
        console.log('Error en respuesta de auth:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (showMessage = false) => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      
      if (showMessage) {
        // En lugar de alert, podríamos usar una notificación más elegante
        console.log('Sesión expirada por inactividad');
      }
      
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const requireAuth = () => {
    if (!loading && !user) {
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Efecto para manejar el timeout de inactividad
  useEffect(() => {
    if (!user) {
      setTimeLeft(null);
      return; // Solo aplicar timeout si hay un usuario logueado
    }

    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      setTimeLeft(null);

      // Timer para mostrar advertencia
      warningTimer = setTimeout(() => {
        setTimeLeft(WARNING_TIME / 1000); // 15 segundos en segundos
        
        // Countdown cada segundo
        countdownInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev && prev > 1) {
              return prev - 1;
            }
            return 0;
          });
        }, 1000);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Timer para logout automático
      inactivityTimer = setTimeout(() => {
        logout(true); // Logout con mensaje de expiración
      }, INACTIVITY_TIMEOUT);
    };

    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Agregar listeners para detectar actividad
    activities.forEach(activity => {
      document.addEventListener(activity, resetTimer, true);
    });

    // Iniciar el timer
    resetTimer();

    // Cleanup function
    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      activities.forEach(activity => {
        document.removeEventListener(activity, resetTimer, true);
      });
    };
  }, [user]); // Dependencia en user para reiniciar cuando el usuario cambie

  return {
    user,
    loading,
    logout,
    checkAuth,
    requireAuth,
    isAuthenticated: !!user,
    timeLeft,
  };
};