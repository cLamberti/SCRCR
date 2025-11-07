'use client';

import Link from 'next/link';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[#003366] mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#003366] hover:bg-[#005599] text-white font-bold py-2 px-6 rounded transition duration-300"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}