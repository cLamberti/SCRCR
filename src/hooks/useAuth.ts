
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('=== useAuth: Verificando autenticación ===');
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Usuario autenticado:', data.user?.username);
        setUser(data.user);
      } else {
        console.log('No autenticado o token inválido');
        setUser(null);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('=== Cerrando sesión ===');
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    checkAuth,
  };
}
