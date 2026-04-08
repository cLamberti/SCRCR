'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/SideBar';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Link from 'next/link';

const inputClass =
  'shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 text-sm leading-tight ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] border-gray-300 transition-colors';

export default function RegistroPermisoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    documentoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', isError: false });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ text: 'El archivo no debe superar los 5MB', isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, documentoUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje({ text: '', isError: false });
    
    // Validación básica
    if (!formData.fechaInicio || !formData.fechaFin || !formData.motivo) {
      setMensaje({ text: 'Todos los campos son requeridos', isError: true });
      return;
    }

    if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
      setMensaje({ text: 'La fecha de fin no puede ser menor a la fecha de inicio', isError: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/permisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al solicitar el permiso');
      }

      setMensaje({ text: 'Permiso solicitado con éxito', isError: false });
      setTimeout(() => {
        router.push('/permisos');
      }, 1500);
    } catch (error: any) {
      setMensaje({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#f2f2f2] min-h-screen">
      <Sidebar activeItem="permisos" pageTitle="Solicitar Permiso" />

      <div className="flex-grow p-4 pt-16 md:pt-4 min-w-0 flex justify-center">
        <div className="max-w-2xl w-full">
          
          <div className="mb-4">
            <Link href="/permisos" className="inline-flex items-center gap-2 text-[#003366] hover:underline text-sm font-semibold">
              <FaArrowLeft /> Regresar a Permisos
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-[#003366] px-6 py-4">
              <h1 className="text-white font-bold text-xl">Solicitar Permiso de Ausencia</h1>
              <p className="text-white/70 text-xs mt-1">Completa los datos para solicitar un permiso.</p>
            </div>

            <div className="p-6">
              {mensaje.text && (
                <div className={`mb-6 p-4 rounded-lg text-sm border font-medium ${
                  mensaje.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {mensaje.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Inicio *</label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Fin *</label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Motivo / Justificación *</label>
                  <textarea
                    rows={4}
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className={inputClass}
                    placeholder="Describe brevemente el motivo de tu ausencia..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1.5">Documento Adjunto (Opcional)</label>
                  <input
                    type="file"
                    accept=".pdf, image/jpeg, image/png, image/jpg"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#003366]/10 file:text-[#003366] hover:file:bg-[#003366]/20 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">Formatos permitidos: PDF, JPG, PNG. Máx 5MB.</p>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaSave /> {loading ? 'Enviando...' : 'Solicitar Permiso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
