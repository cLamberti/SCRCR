"use client";

import Image from 'next/image';
import { useState } from 'react';
import { FaUserPlus, FaList, FaTrash, FaSignOutAlt, FaHome, FaCalendarAlt } from 'react-icons/fa';
import Sidebar from '@/components/SideBar';

const menuItems = [
  { id: 'inicio', href: '/', icon: FaHome, label: 'Inicio' },
  { id: 'registro-asociados', href: '/registro-asociados', icon: FaUserPlus, label: 'Registro de Asociados' },
  { id: 'listado', href: '/consulta-asociados', icon: FaList, label: 'Listado General' },
  { id: 'cerrar', href: '#', icon: FaSignOutAlt, label: 'Cerrar Sesión' },
];

const inputBase = 'shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 transition-colors';
const inputNormal = `${inputBase} border-gray-300 focus:ring-[#003366]/30 focus:border-[#003366]`;
const inputFilled = `${inputBase} border-green-500 focus:ring-green-200`;
const inputError = `${inputBase} border-red-400 focus:ring-red-200`;

export default function RegistroAsociadosPage() {
  const [formData, setFormData] = useState({
    nombreCompleto: '', cedula: '', correo: '', telefono: '',
    ministerio: '', direccion: '', fechaIngreso: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'nombreCompleto':
        if (!value.trim()) { newErrors[name] = 'El nombre completo es requerido'; break; }
        if (value.length > 100) { newErrors[name] = 'Máximo 100 caracteres'; break; }
        const palabras = value.trim().split(/\s+/).filter(p => p.length > 0);
        if (palabras.length < 2) { newErrors[name] = 'Debe incluir al menos nombre y apellido'; break; }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) { newErrors[name] = 'Solo letras y espacios'; break; }
        delete newErrors[name]; break;
      case 'cedula':
        if (!value) { newErrors[name] = 'La cédula es requerida'; break; }
        if (!/^[0-9-]+$/.test(value)) { newErrors[name] = 'Solo números y guiones'; break; }
        if (value.length < 9) { newErrors[name] = 'Mínimo 9 caracteres'; break; }
        delete newErrors[name]; break;
      case 'correo':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[name] = 'Formato de correo inválido';
        } else { delete newErrors[name]; }
        break;
      case 'telefono':
        if (!value) { newErrors[name] = 'El celular es requerido'; break; }
        const clean = value.replace(/[\s\-+()]/g, '');
        if (!/^[\d\s\-+()]+$/.test(value)) { newErrors[name] = 'Caracteres no válidos'; break; }
        if (clean.length < 8) { newErrors[name] = 'Mínimo 8 dígitos'; break; }
        delete newErrors[name]; break;
      default: break;
    }
    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTimeout(() => validateField(name, value), 400);
  };

  const convertDateFormat = (d: string) => {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [day, month, year] = d.split('/');
      return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    }
    return d;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMensaje('');
    try {
      const res = await fetch('/api/asociados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, fechaIngreso: convertDateFormat(formData.fechaIngreso) }),
      });
      const result = await res.json();
      if (result.success) {
        setMensaje('¡Asociado registrado exitosamente!');
        setFormData({ nombreCompleto: '', cedula: '', correo: '', telefono: '', ministerio: '', direccion: '', fechaIngreso: '' });
        setErrors({});
      } else {
        setMensaje(`Error: ${result.message}`);
      }
    } catch {
      setMensaje('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (field: string) => {
    if (errors[field]) return inputError;
    if (formData[field as keyof typeof formData]) return inputFilled;
    return inputNormal;
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="registro-asociados" menuItems={menuItems} />

      {/* Spacer móvil para el botón hamburguesa */}
      <div className="flex-grow p-4 pt-16 md:pt-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6 my-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#003366]">Registro de Asociados</h1>
                <div className="w-16 h-1 bg-[#003366] rounded mt-1" />
              </div>
              <div className="relative w-[100px] h-[70px] hidden sm:block">
                <Image src="/logo-iglesia.png" alt="Logo Iglesia" fill className="object-contain" sizes="100px" priority />
              </div>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border-l-4 border-gray-300 mb-5">
              Los campos con <span className="text-red-600 font-semibold">*</span> son obligatorios.
            </p>

            {mensaje && (
              <div className={`mb-5 p-3.5 rounded-lg text-sm border ${mensaje.includes('exitosamente') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {mensaje}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fila 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required
                    className={getInputClass('nombreCompleto')} placeholder="Ej: Juan Carlos Pérez López" />
                  {errors.nombreCompleto && <p className="text-red-500 text-xs mt-1">{errors.nombreCompleto}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                    Cédula <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required
                    className={getInputClass('cedula')} placeholder="Ej: 2-4038-6583" />
                  {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>}
                </div>
              </div>

              {/* Fila 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">Fecha de Ingreso</label>
                  <div className="relative">
                    <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange}
                      className={`${getInputClass('fechaIngreso')} pr-10`} />
                    <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  </div>
                  {errors.fechaIngreso && <p className="text-red-500 text-xs mt-1">{errors.fechaIngreso}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">Correo Electrónico</label>
                  <input type="email" name="correo" value={formData.correo} onChange={handleChange}
                    className={getInputClass('correo')} placeholder="correo@ejemplo.com" />
                  {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
                </div>
              </div>

              {/* Fila 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required
                    className={getInputClass('telefono')} placeholder="Ej: 8888-8888" />
                  {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">Ministerio Asignado</label>
                  <input type="text" name="ministerio" value={formData.ministerio} onChange={handleChange}
                    className={getInputClass('ministerio')} placeholder="Ej: Evangelismo" />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1.5">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                  className={getInputClass('direccion')} placeholder="Ej: Barrio Los Cerros, Liberia" />
              </div>

              {/* Foto */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1.5">Subir Foto</label>
                <input type="file" accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#003366]/10 file:text-[#003366] hover:file:bg-[#003366]/20 transition-colors" />
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF — Máx. 5MB</p>
              </div>

              {/* Botón */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm
                    ${loading || Object.keys(errors).length > 0
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-[#003366] hover:bg-[#004488] text-white'}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    <><FaUserPlus className="text-sm" /> Registrar Asociado</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}