'use client';

import { withRoleProtection } from '@/components/auth/RoleProtection';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '@/components/Notification';
import { FaFileAlt, FaDownload, FaChartBar, FaTable } from 'react-icons/fa';

function ReportesComponent() {
  const { 
    notifications, 
    removeNotification, 
    showInfo 
  } = useNotifications();

  const handleGenerateReport = (reportType: string) => {
    showInfo('Generar Reporte', `Generando reporte de ${reportType}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] to-[#e8e8e8] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaFileAlt className="text-[#003366]" />
            Reportes del Sistema
          </h1>
          <p className="text-gray-600 mt-2">
            Genera y consulta reportes administrativos y estadísticas
          </p>
        </div>

        {/* Tipos de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reporte de Asociados</h3>
              <FaTable className="text-blue-600 text-xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Listado completo de todos los asociados registrados
            </p>
            <button
              onClick={() => handleGenerateReport('Asociados')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <FaDownload />
              Generar
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
              <FaChartBar className="text-green-600 text-xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Gráficos y estadísticas de crecimiento
            </p>
            <button
              onClick={() => handleGenerateReport('Estadísticas')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <FaDownload />
              Generar
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actividad</h3>
              <FaFileAlt className="text-purple-600 text-xl" />
            </div>
            <p className="text-gray-600 mb-4">
              Reporte de actividades y cambios
            </p>
            <button
              onClick={() => handleGenerateReport('Actividad')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <FaDownload />
              Generar
            </button>
          </div>
        </div>

        {/* Información */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Módulo de Reportes
          </h2>
          <p className="text-gray-600">
            Este módulo está disponible para usuarios con roles: <strong>Administrador, Tesorero y Pastor General</strong>.
          </p>
        </div>
      </div>

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

// Proteger con roles: admin, tesorero, pastorGeneral
const Reportes = withRoleProtection(ReportesComponent, {
  requiredRoles: ['admin', 'tesorero', 'pastorGeneral'],
  moduleName: 'Reportes',
  showAccessDenied: true
});

export default Reportes;