import React from 'react';
import Link from 'next/link';
import { FaExclamationTriangle, FaHome, FaShieldAlt, FaUser } from 'react-icons/fa';

interface AccessDeniedProps {
  userRole: string;
  moduleName: string;
  requiredRoles?: string[];
  onGoBack?: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  userRole,
  moduleName,
  requiredRoles = [],
  onGoBack
}) => {
  const roleNames: Record<string, string> = {
    'admin': 'Administrador',
    'tesorero': 'Tesorero',
    'pastorGeneral': 'Pastor General'
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600';
      case 'tesorero':
        return 'text-blue-600';
      case 'pastorGeneral':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4f4f4] to-[#e8e8e8] px-4">
      <div className="max-w-md w-full">
        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icono de advertencia */}
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <FaExclamationTriangle className="text-amber-500 text-2xl" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Restringido
          </h1>

          {/* Mensaje principal */}
          <div className="text-gray-600 mb-6 space-y-3">
            <p>
              Lo sentimos, tu rol actual no tiene permisos para acceder a este módulo.
            </p>
            
            {/* Información del usuario */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center justify-center mb-2">
                <FaUser className="text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Tu rol actual:</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(userRole)} bg-gray-100`}>
                <FaShieldAlt className="mr-1 text-xs" />
                {roleNames[userRole] || userRole}
              </span>
            </div>

            {/* Módulo solicitado */}
            <div className="text-sm">
              <span className="font-medium text-gray-700">Módulo solicitado:</span>
              <span className="ml-2 text-gray-900 font-semibold">"{moduleName}"</span>
            </div>

            {/* Roles requeridos */}
            {requiredRoles.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Roles con acceso:</span>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {requiredRoles.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(role)} bg-gray-100`}
                    >
                      {roleNames[role] || role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de contacto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>¿Necesitas acceso?</strong>
              <br />
              Contacta al administrador del sistema para solicitar los permisos necesarios.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span>Volver Atrás</span>
              </button>
            )}
            
            <Link
              href="/consulta-asociados"
              className="w-full bg-[#003366] hover:bg-[#005599] text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <FaHome className="mr-2" />
              Ir al Inicio
            </Link>

            <Link
              href="/login"
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <FaUser className="mr-2" />
              Cambiar Usuario
            </Link>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sistema SCRCR - Iglesia Bíblica Emanuel</p>
          <p>Control de Acceso Basado en Roles</p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;