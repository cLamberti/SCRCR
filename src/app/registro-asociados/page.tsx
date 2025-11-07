
"use client"; 

import Image from 'next/image';
import { useState } from 'react';
import { FaHome, FaUserPlus, FaUsers, FaList, FaCog, FaSignOutAlt, FaCalendarAlt, FaTrash } from 'react-icons/fa';


// Componente para el menú lateral (sidebar) mejorado
const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('registro-asociados');

  const menuItems = [
    { id: 'inicio', href: '/', icon: FaHome, label: 'Inicio' },
    { id: 'registro-asociados', href: '/registro-asociados', icon: FaUserPlus, label: 'Registro de Asociados' },
    { id: 'listado', href: '/consulta-asociados', icon: FaList, label: 'Listado General' },
    { id: 'eliminar-asociado', href: '/eliminar-asociados', icon: FaTrash, label: 'Eliminar Asociados' },
    { id: 'cerrar', href: '#', icon: FaSignOutAlt, label: 'Cerrar Sesión' }
  ];

  return (
    <div className="w-[220px] bg-[#003366] text-white min-h-screen pt-[30px] flex flex-col shadow-lg">
      <div className="px-5 mb-8">
        <h4 className="text-center text-lg font-semibold">Bienvenido a Gestion de asociados</h4>
        <div className="w-full h-px bg-[#005599] mt-2"></div>
      </div>

      <nav className="flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setActiveItem(item.id)}
              className={`
                text-white no-underline flex items-center py-3 px-5 transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-[#005599] border-r-4 border-white shadow-inner' 
                  : 'hover:bg-[#004488] hover:pl-6'
                }
              `}
            >
              <Icon className={`
                mr-3 transition-all duration-200
                ${isActive ? 'text-white scale-110' : 'text-gray-300 group-hover:text-white'}
              `} />
              <span className={`
                transition-all duration-200
                ${isActive ? 'font-semibold' : 'font-normal'}
              `}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
};

// Componente principal de la página de registro
export default function RegistroAsociadosPage() {
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    cedula: '',
    correo: '',
    telefono: '',
    ministerio: '',
    direccion: '',
    fechaIngreso: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Función de validación de campos
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'nombreCompleto':
        if (!value || value.trim().length === 0) {
          newErrors[name] = 'El nombre completo es requerido';
        } else if (value.length > 100) {
          newErrors[name] = 'El nombre no puede exceder 100 caracteres';
        } else {
          // Validar que tenga al menos nombre y apellido
          const palabras = value.trim().split(/\s+/).filter(palabra => palabra.length > 0);
          
          if (palabras.length < 2) {
            newErrors[name] = 'Debe incluir al menos nombre y apellido';
          } else if (palabras.some(palabra => palabra.length < 2)) {
            newErrors[name] = 'Cada nombre y apellido debe tener al menos 2 caracteres';
          } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
            newErrors[name] = 'El nombre solo puede contener letras y espacios';
          } else {
            delete newErrors[name];
          }
        }
        break;
      
      case 'cedula':
        const cedulaRegex = /^[0-9-]+$/;
        if (!value) {
          newErrors[name] = 'La cédula es requerida';
        } else if (!cedulaRegex.test(value)) {
          newErrors[name] = 'La cédula solo puede contener números y guiones';
        } else if (value.length < 9) {
          newErrors[name] = 'La cédula debe tener al menos 9 caracteres';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'correo':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          newErrors[name] = 'Formato de correo inválido';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'telefono':
        if (!value) {
          newErrors[name] = 'El número de celular es requerido';
        } else {
          // Limpiar el número para validación (solo dígitos)
          const cleanNumber = value.replace(/[\s\-+()]/g, '');
          
          // Validar que solo contenga números y algunos caracteres permitidos
          const phoneRegex = /^[\d\s\-+()]+$/;
          
          if (!phoneRegex.test(value)) {
            newErrors[name] = 'El teléfono contiene caracteres no válidos';
          } else if (cleanNumber.length < 8) {
            newErrors[name] = 'El número debe tener al menos 8 dígitos';
          } else if (cleanNumber.length > 15) {
            newErrors[name] = 'El número no puede tener más de 15 dígitos';
          } else {
            delete newErrors[name];
          }
        }
        break;
      
      case 'fechaIngreso':
        if (value) {
          // Validar formato DD/MM/YYYY o YYYY-MM-DD
          const dateRegex1 = /^\d{2}\/\d{2}\/\d{4}$/; // DD/MM/YYYY
          const dateRegex2 = /^\d{4}-\d{2}-\d{2}$/;   // YYYY-MM-DD
          
          if (!dateRegex1.test(value) && !dateRegex2.test(value)) {
            newErrors[name] = 'Formato: DD/MM/AAAA o use el calendario';
          } else {
            // Validar que sea una fecha válida
            let dateToCheck;
            if (dateRegex1.test(value)) {
              const [day, month, year] = value.split('/');
              dateToCheck = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              dateToCheck = new Date(value);
            }
            
            if (isNaN(dateToCheck.getTime())) {
              newErrors[name] = 'Fecha inválida';
            } else {
              delete newErrors[name];
            }
          }
        } else {
          delete newErrors[name];
        }
        break;
      
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  // Manejar cambios en los inputs con validación
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validar el campo después de un breve delay
    setTimeout(() => validateField(name, value), 500);
  };

  // Función para convertir fecha
  const convertDateFormat = (dateStr: string): string => {
    // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
    const dateRegex1 = /^\d{2}\/\d{2}\/\d{4}$/;
    if (dateRegex1.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr; // Ya está en formato correcto o vacío
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    try {
      // Preparar datos con fecha convertida
      const dataToSend = {
        ...formData,
        fechaIngreso: convertDateFormat(formData.fechaIngreso)
      };

      const response = await fetch('/api/asociados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (result.success) {
        setMensaje('¡Asociado registrado exitosamente!');
        // Limpiar formulario
        setFormData({
          nombreCompleto: '',
          cedula: '',
          correo: '',
          telefono: '',
          ministerio: '',
          direccion: '',
          fechaIngreso: ''
        });
        setErrors({});
      } else {
        setMensaje(`Error: ${result.message}`);
      }
    } catch (error) {
      setMensaje('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el calendario
  const openCalendar = () => {
    const input = document.querySelector('input[name="fechaIngreso"]') as HTMLInputElement;
    if (input) {
      input.type = 'date';
      input.focus();
      input.showPicker && input.showPicker();
    }
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen font-['Segoe_UI',sans-serif]">
      
      {/* Menú lateral */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-grow p-4">
        <div className="max-w-6xl mx-auto"> 

          <div className="p-[30px] bg-white rounded-lg my-[30px] shadow-md">
            
            {/* Encabezado del Formulario */}
            <div className="flex items-start justify-between">
              <div className="text-2xl font-bold border-b-2 border-gray-300 pb-2 mb-[30px] text-[#003366]">
                Registro de asociados
              </div>
              
              {/* Contenedor que establece el tamaño máximo del logo (130x90px) */}
              <div className="relative w-[130px] h-[90px] min-w-[90px]">
                <Image 
                  id="logo" 
                  src="/logo-iglesia.png" 
                  alt="Logo de la Iglesia" 
                  fill 
                  className="object-contain"
                  sizes="130px"
                  priority
                />
              </div>
            </div>
            
            {/* Nota informativa pequeña */}
            <div className="mb-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border-l-4 border-gray-300">
              <span className="font-medium"></span> Los campos con <span className="text-red-600 font-semibold">*</span> son obligatorios.
            </div>
            
            {/* Mensaje de estado */}
            {mensaje && (
              <div className={`mb-4 p-4 rounded ${
                mensaje.includes('exitosamente') 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {mensaje}
              </div>
            )}
            
            {/* Formulario */}
            <form onSubmit={handleSubmit}>
                
              {/* Fila 1: Nombre Completo y Cédula */}
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/2 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    required 
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                      errors.nombreCompleto 
                        ? 'border-red-500 focus:ring-red-200' 
                        : formData.nombreCompleto 
                        ? 'border-green-500 focus:ring-green-200'
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="Ej: Juan Carlos Pérez López" 
                  />
                  {errors.nombreCompleto && (
                    <p className="text-red-500 text-xs mt-1">{errors.nombreCompleto}</p>
                  )}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Cédula <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    required 
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                      errors.cedula 
                        ? 'border-red-500 focus:ring-red-200' 
                        : formData.cedula 
                        ? 'border-green-500 focus:ring-green-200'
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="Ej: 2-4038-6583" 
                  />
                  {errors.cedula && (
                    <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>
                  )}
                </div>
              </div>

              {/* Fila 2: Fecha de Ingreso y Correo */}
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/2 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Fecha de Ingreso</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="fechaIngreso"
                      value={formData.fechaIngreso}
                      onChange={handleChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                        errors.fechaIngreso 
                          ? 'border-red-500 focus:ring-red-200' 
                          : formData.fechaIngreso 
                          ? 'border-green-500 focus:ring-green-200'
                          : 'border-gray-300 focus:ring-blue-200'
                      }`}
                      placeholder="DD/MM/AAAA" 
                    />
                    <button
                      type="button"
                      onClick={openCalendar}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <FaCalendarAlt />
                    </button>
                  </div>
                  {errors.fechaIngreso && (
                    <p className="text-red-500 text-xs mt-1">{errors.fechaIngreso}</p>
                  )}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Correo</label>
                  <input 
                    type="email" 
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                      errors.correo 
                        ? 'border-red-500 focus:ring-red-200' 
                        : formData.correo 
                        ? 'border-green-500 focus:ring-green-200'
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="correo@ejemplo.com" 
                  />
                  {errors.correo && (
                    <p className="text-red-500 text-xs mt-1">{errors.correo}</p>
                  )}
                </div>
              </div>

              {/* Fila 3: Celular y Ministerio asignado */}
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/2 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                      errors.telefono 
                        ? 'border-red-500 focus:ring-red-200' 
                        : formData.telefono 
                        ? 'border-green-500 focus:ring-green-200'
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="Ej: 8888-8888 o +505 8888-8888" 
                  />
                  {errors.telefono && (
                    <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                  )}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Ministerio asignado</label>
                  <input 
                    type="text" 
                    name="ministerio"
                    value={formData.ministerio}
                    onChange={handleChange}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                      formData.ministerio 
                        ? 'border-green-500 focus:ring-green-200'
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="Ej. Evangelismo" 
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Dirección</label>
                <input 
                  type="text" 
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-colors ${
                    formData.direccion 
                      ? 'border-green-500 focus:ring-green-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                  placeholder="Ej: Barrio Los Cerros, Liberia" 
                />
              </div>

              {/* Subir Foto */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Subir Foto</label>
                <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#003366] hover:file:bg-blue-100" />
                <p className="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, GIF (Max: 5MB)</p>
              </div>

              {/* Botón de Registro */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6">
                <button 
                  type="submit" 
                  disabled={loading || Object.keys(errors).length > 0}
                  className={`
                    relative lg:w-auto min-w-[180px] px-6 py-3 rounded-lg font-semibold text-base
                    transition-all duration-200 transform hover:scale-102 active:scale-98
                    shadow-md hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-offset-1
                    ${
                      loading || Object.keys(errors).length > 0
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed text-gray-200'
                        : 'bg-gradient-to-r from-[#003366] to-[#005599] hover:from-[#004477] hover:to-[#0066aa] text-white focus:ring-blue-300'
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="text-sm" />
                        Registrar asociado
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}