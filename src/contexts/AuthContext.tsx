'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Usuario {
  id: number;
  nombreCompleto: string;
  username: string;
  email: string;
  rol: string;
  modulosPermitidos: string[];
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verificarSesion: () => Promise<void>;
  refrescarPermisos: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const verificarSesion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        credentials: 'include',
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
      setLoading(false);
    }
  }, []);

  const refrescarPermisos = useCallback(async () => {
    if (!usuario) return;
    try {
      const res = await fetch('/api/auth/verify', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUsuario(data.data);
      }
    } catch {}
  }, [usuario]);

  useEffect(() => { verificarSesion(); }, [verificarSesion]);

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Error al iniciar sesión');

    // After login, fetch full user data including modulosPermitidos
    const verifyRes = await fetch('/api/auth/verify', { credentials: 'include', cache: 'no-store' });
    const verifyData = await verifyRes.json();
    setUsuario(verifyData.success ? verifyData.data : data.data);
    setLoading(false);

    router.push('/');
    router.refresh();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    finally {
      setUsuario(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, verificarSesion, refrescarPermisos }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
}
