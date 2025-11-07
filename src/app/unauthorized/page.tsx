'use client';

import { useRouter } from 'next/navigation';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">
            Tu rol de usuario no tiene autorización para ver este contenido.
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-[#003366] hover:bg-[#004488] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FaArrowLeft />
            Volver atrás
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}