'use client';

import { withRoleProtection } from '@/components/auth/RoleProtection';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '@/components/Notification';
import { FaCog, FaDatabase, FaShieldAlt, FaServer } from 'react-icons/fa';

function ConfiguracionComponent() {
  const { 
    notifications, 
    removeNotification, 
    showInfo 
  } = useNotifications();

  const handleConfigChange = (configType: string) => {
    showInfo('Configuración', `Accediendo a configuración de ${configType}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] to-[#e8e8e8] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaCog className="text-[#003366]" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Panel de administración avanzado - Solo Administradores
          </p>
        </div>

        {/* Advertencia de Acceso Restringido */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-red-600 text-xl" />
            <div>
              <h3 className="text-red-800 font-semibold">Módulo Altamente Restringido</h3>
              <p className="text-red-700 text-sm">
                Solo usuarios con rol de <strong>Administrador</strong> pueden acceder a esta sección.
              </p>
            </div>
          </div>
        </div>

        {/* Opciones de Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Base de Datos</h3>
              <FaDatabase className="text-blue-600 text-2xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Configuración de conexiones y respaldos de base de datos
            </p>
            <button
              onClick={() => handleConfigChange('Base de Datos')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Acceder
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
              <FaShieldAlt className="text-red-600 text-2xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Configuración de políticas de seguridad y acceso
            </p>
            <button
              onClick={() => handleConfigChange('Seguridad')}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Acceder
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Servidor</h3>
              <FaServer className="text-green-600 text-2xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Configuración del servidor y variables de entorno
            </p>
            <button
              onClick={() => handleConfigChange('Servidor')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Acceder
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sistema</h3>
              <FaCog className="text-purple-600 text-2xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Configuraciones generales del sistema
            </p>
            <button
              onClick={() => handleConfigChange('Sistema')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Acceder
            </button>
          </div>
        </div>

        {/* Información de Acceso */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Control de Acceso Estricto
          </h2>
          <p className="text-gray-600 mb-4">
            Este módulo de configuración está diseñado exclusivamente para administradores del sistema.
            Intentar acceder sin los permisos adecuados resultará en un bloqueo automático.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Funciones Administrativas:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Gestión completa de usuarios y roles</li>
              <li>• Configuración de políticas de seguridad</li>
              <li>• Acceso a logs del sistema y auditoría</li>
              <li>• Configuración de base de datos</li>
              <li>• Gestión de copias de seguridad</li>
              <li>• Configuración de variables del sistema</li>
            </ul>
          </div>
        </div>
      </div>

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

// Proteger SOLO para administradores
const Configuracion = withRoleProtection(ConfiguracionComponent, {
  requiredRoles: ['admin'],
  moduleName: 'Configuración del Sistema',
  showAccessDenied: true
});

export default Configuracion;