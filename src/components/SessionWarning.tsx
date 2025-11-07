'use client';

import { useAuth } from '@/hooks/useAuth';
import { FaClock, FaTimes } from 'react-icons/fa';

export const SessionWarning = () => {
  const { timeLeft, logout } = useAuth();

  if (!timeLeft || timeLeft <= 0) return null;

  const extendSession = () => {
    // Cualquier actividad resetea el timer, así que simplemente mover el mouse
    document.dispatchEvent(new Event('mousemove'));
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-black p-4 rounded-lg shadow-lg border-2 border-yellow-600 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FaClock className="text-lg" />
          <div>
            <h3 className="font-bold text-sm">¡Sesión por expirar!</h3>
            <p className="text-xs">
              Su sesión expirará en <strong>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong> por inactividad.
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="ml-2 text-black hover:text-red-600 transition-colors"
          title="Cerrar sesión"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="mt-3 flex gap-2">
        <button
          onClick={extendSession}
          className="bg-black text-yellow-500 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          Extender sesión
        </button>
        <button
          onClick={() => logout()}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Cerrar ahora
        </button>
      </div>
    </div>
  );
};