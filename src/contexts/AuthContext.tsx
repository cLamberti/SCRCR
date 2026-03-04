'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Usuario {
  id: number;
  nombreCompleto: string;
  username: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verificarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Empieza en true: no sabemos si hay sesión hasta que verifiquemos
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const verificarSesion = useCallback(async () => {
    // No resetear loading si ya está en true para evitar flashes
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        credentials: 'include',
        // Evita que el browser use una respuesta cacheada
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        setUsuario(data.success ? data.data : null);
      } else {
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    } finally {
      // Solo aquí se libera el loading
      setLoading(false);
    }
  }, []);

  // Verificar sesión una sola vez al montar el provider
  useEffect(() => {
    verificarSesion();
  }, [verificarSesion]);

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    // Setear el usuario ANTES de navegar para que el sidebar
    // ya tenga el rol disponible cuando la nueva página monte
    setUsuario(data.data);
    setLoading(false);

    router.push('/');
    router.refresh();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Continuar aunque falle el endpoint
    } finally {
      setUsuario(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, verificarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}