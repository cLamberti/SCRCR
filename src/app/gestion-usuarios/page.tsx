'use client';

import { withRoleProtection } from '@/components/auth/RoleProtection';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '@/components/Notification';
import { FaUserPlus, FaUsers, FaUserShield, FaEdit, FaTrash, FaEye } from 'react-icons/fa';

function GestionUsuariosComponent() {
  const { 
    notifications, 
    removeNotification, 
    showSuccess,
    showInfo 
  } = useNotifications();

  const handleCreateUser = () => {
    showInfo('Crear Usuario', 'Funcionalidad de creación de usuarios en desarrollo.');
  };

  const handleEditUser = (userId: number) => {
    showInfo('Editar Usuario', `Funcionalidad de edición para usuario ID: ${userId} en desarrollo.`);
  };

  const handleDeleteUser = (userId: number) => {
    showInfo('Eliminar Usuario', `Funcionalidad de eliminación para usuario ID: ${userId} en desarrollo.`);
  };

  const handleViewPermissions = (userId: number) => {
    showSuccess('Ver Permisos', `Mostrando permisos para usuario ID: ${userId}`);
  };

  // Datos de ejemplo para demostración
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@scrcr.com',
      nombreCompleto: 'Administrador del Sistema',
      rol: 'admin',
      estado: 'Activo',
      ultimoAcceso: '2025-11-06 14:30:00'
    },
    {
      id: 2,
      username: 'tesorero1',
      email: 'tesorero@scrcr.com',
      nombreCompleto: 'Juan Pérez',
      rol: 'tesorero',
      estado: 'Activo',
      ultimoAcceso: '2025-11-05 16:45:00'
    },
    {
      id: 3,
      username: 'pastor1',
      email: 'pastor@scrcr.com',
      nombreCompleto: 'María González',
      rol: 'pastorGeneral',
      estado: 'Activo',
      ultimoAcceso: '2025-11-04 09:20:00'
    }
  ];

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'tesorero':
        return 'bg-blue-100 text-blue-800';
      case 'pastorGeneral':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'tesorero':
        return 'Tesorero';
      case 'pastorGeneral':
        return 'Pastor General';
      default:
        return rol;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] to-[#e8e8e8] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaUsers className="text-[#003366]" />
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 mt-2">
                Administra usuarios del sistema, roles y permisos
              </p>
            </div>
            
            <button
              onClick={handleCreateUser}
              className="bg-[#003366] hover:bg-[#005599] text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
            >
              <FaUserPlus />
              Crear Usuario
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{mockUsers.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Administradores</p>
                <p className="text-3xl font-bold text-red-600">
                  {mockUsers.filter(u => u.rol === 'admin').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaUserShield className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Usuarios Activos</p>
                <p className="text-3xl font-bold text-green-600">
                  {mockUsers.filter(u => u.estado === 'Activo').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaUsers className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Usuarios</h2>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona todos los usuarios del sistema
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.nombreCompleto}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.rol)}`}>
                        {getRoleName(user.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.ultimoAcceso).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPermissions(user.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          title="Ver Permisos"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100"
                          title="Editar Usuario"
                        >
                          <FaEdit />
                        </button>
                        {user.rol !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100"
                            title="Eliminar Usuario"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funciones Administrativas */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Funciones Administrativas Disponibles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✅ Gestión de Usuarios</h3>
              <p className="text-sm text-gray-600">
                Crear, editar y eliminar usuarios del sistema
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✅ Control de Roles</h3>
              <p className="text-sm text-gray-600">
                Asignar y modificar roles de usuarios
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✅ Gestión de Permisos</h3>
              <p className="text-sm text-gray-600">
                Configurar permisos específicos por módulo
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✅ Auditoría de Accesos</h3>
              <p className="text-sm text-gray-600">
                Revisar logs de acceso y actividad
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✅ Configuración del Sistema</h3>
              <p className="text-sm text-gray-600">
                Ajustar configuraciones generales
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✅ Backup y Restauración</h3>
              <p className="text-sm text-gray-600">
                Gestionar copias de seguridad
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor de Notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

// Exportar el componente protegido por roles (solo administradores)
const GestionUsuarios = withRoleProtection(GestionUsuariosComponent, {
  requiredRoles: ['admin'],
  moduleName: 'Gestión de Usuarios',
  showAccessDenied: true
});

export default GestionUsuarios;