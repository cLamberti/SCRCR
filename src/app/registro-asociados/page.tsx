
"use client"; 

import Image from 'next/image';
import { FaHome, FaUserPlus, FaUsers, FaList, FaCog, FaSignOutAlt } from 'react-icons/fa';


// Componente para el menú lateral (sidebar)
const Sidebar = () => (
  <div className="w-[220px] bg-[#003366] text-white min-h-screen pt-[30px] flex flex-col">
    <h4 className="text-center mb-[30px]">Bienvenido</h4>

    <a href="../index.html" className="text-white no-underline block py-3 px-5 transition-colors hover:bg-[#005599]">
      <FaHome className="inline mr-2" />Inicio
    </a>
    <a href="/registro-asociados" className="text-white no-underline block py-3 px-5 transition-colors hover:bg-[#005599]">
      <FaUserPlus className="inline mr-2" />Registro de Asociados
    </a>
    <a href="../register-congregado/register-congregado.html" className="text-white no-underline block py-3 px-5 transition-colors hover:bg-[#005599]">
      <FaUsers className="inline mr-2" />Registro de Congregados
    </a>
    <a href="#" className="text-white no-underline block py-3 px-5 transition-colors hover:bg-[#005599]">
      <FaList className="inline mr-2" />Listado General
    </a>
    <a href="#" className="text-white no-underline block py-3 px-5 transition-colors hover:bg-[#005599]">
      <FaCog className="inline mr-2" />Configuración
    </a>
    <a href="#" className="text-white no-underline block py-3 px-5 transition-colors hover:bg-[#005599]">
      <FaSignOutAlt className="inline mr-2" />Cerrar Sesión
    </a>
  </div>
);

// Componente principal de la página de registro
export default function RegistroAsociadosPage() {
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
            className="object-contain" // Mantiene la relación de aspecto dentro del contenedor.
            sizes="130px" // Ayuda a Next.js a optimizar el tamaño.
            priority // Carga prioritaria del logo
        />
    </div>
</div>
            
            {/* Formulario */}
            <form>
                
              {/* Fila 1: Nombre Completo y Cédula */}
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/2 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Nombre Completo</label>
                  <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Ej: Juan Pérez" />
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Cédula</label>
                  <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Ej: 2-4038-6583" />
                </div>
              </div>

              {/* Fila 2: Fecha de Ingreso y Correo */}
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/2 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Fecha de Ingreso</label>
                  <input type="date" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Correo</label>
                  <input type="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="correo@ejemplo.com" />
                </div>
              </div>

              {/* Fila 3: Celular y Ministerio asignado */}
              <div className="flex flex-wrap -mx-3 mb-3">
                <div className="w-full md:w-1/2 px-3 mb-3 md:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Celular</label>
                  <input type="tel" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="8888-8888" />
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Ministerio asignado</label>
                  <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Ej. Evangelismo" />
                </div>
              </div>

              {/* Dirección */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Dirección</label>
                <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Ej: Barrio Los Cerros, Liberia" />
              </div>

              {/* Subir Foto */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Subir Foto</label>
                <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#003366] hover:file:bg-blue-100" />
              </div>

              {/* Botón de Registro */}
              <button 
                type="submit" 
                className="bg-[#003366] hover:bg-[#005599] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              >
                Registrar asociado
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}