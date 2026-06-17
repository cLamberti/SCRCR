'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/SideBar';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import Link from 'next/link';

const inputBase =
  'shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 text-sm leading-tight ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-colors';
const inputClass = inputBase + ' border-gray-300';
const inputClassErr = inputBase + ' border-red-400 bg-red-50/30';

export default function RegistroPermisoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', isError: false });
  const [traslapeAviso, setTraslapeAviso] = useState('');
  const [validandoTraslape, setValidandoTraslape] = useState(false);
  const [errFechaInicio, setErrFechaInicio] = useState('');
  const [errFechaFin, setErrFechaFin] = useState('');
  const [errMotivo, setErrMotivo] = useState('');
  const [touchedFechaInicio, setTouchedFechaInicio] = useState(false);
  const [touchedFechaFin, setTouchedFechaFin] = useState(false);
  const [touchedMotivo, setTouchedMotivo] = useState(false);

  const validarTraslape = async (fechaInicio: string, fechaFin: string) => {
    if (!fechaInicio || !fechaFin) {
      setTraslapeAviso('');
      return;
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setTraslapeAviso('');
      return;
    }

    try {
      setValidandoTraslape(true);
      const res = await fetch(
        `/api/permisos/traslape?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`
      );
      const data = await res.json();
      if (res.ok && data.success && data.hasOverlap) {
        setTraslapeAviso('Advertencia: ya tienes un permiso pendiente o aprobado que se traslapa con estas fechas.');
        return;
      }
      setTraslapeAviso('');
    } catch {
      setTraslapeAviso('');
    } finally {
      setValidandoTraslape(false);
    }
  };



  const validateFechaInicio = (val: string, fin: string) => {
    if (!val) return 'La fecha de inicio es obligatoria.';
    if (fin && new Date(val) > new Date(fin)) return 'La fecha de inicio no puede ser posterior a la fecha de fin.';
    return '';
  };
  const validateFechaFin = (val: string, inicio: string) => {
    if (!val) return 'La fecha de fin es obligatoria.';
    if (inicio && new Date(inicio) > new Date(val)) return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    return '';
  };
  const validateMotivo = (val: string) => {
    if (!val.trim()) return 'El motivo es obligatorio.';
    if (val.trim().length < 10) return 'El motivo debe tener al menos 10 caracteres.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eI = validateFechaInicio(formData.fechaInicio, formData.fechaFin);
    const eF = validateFechaFin(formData.fechaFin, formData.fechaInicio);
    const eM = validateMotivo(formData.motivo);
    setErrFechaInicio(eI); setErrFechaFin(eF); setErrMotivo(eM);
    setTouchedFechaInicio(true); setTouchedFechaFin(true); setTouchedMotivo(true);
    if (eI || eF || eM) return;
    setMensaje({ text: '', isError: false });

    setLoading(true);
    try {
      const res = await fetch('/api/permisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        const issueMsg = Array.isArray(data.errors) && data.errors.length > 0
          ? data.errors.map((i: { message: string }) => i.message).join(' ')
          : null;
        throw new Error(issueMsg || data.message || 'Error al solicitar el permiso');
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
                <div className={`mb-6 p-4 rounded-lg text-sm border font-medium ${mensaje.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                  {mensaje.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fechaInicio" className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Inicio *</label>
                    <input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => {
                        const next = { ...formData, fechaInicio: e.target.value };
                        setFormData(next);
                        setTouchedFechaInicio(true);
                        setErrFechaInicio(validateFechaInicio(e.target.value, next.fechaFin));
                        if (next.fechaFin) setErrFechaFin(validateFechaFin(next.fechaFin, e.target.value));
                        void validarTraslape(next.fechaInicio, next.fechaFin);
                      }}
                      onBlur={() => { setTouchedFechaInicio(true); setErrFechaInicio(validateFechaInicio(formData.fechaInicio, formData.fechaFin)); }}
                      className={touchedFechaInicio && errFechaInicio ? inputClassErr : inputClass}
                      disabled={loading}
                    />
                    {touchedFechaInicio && errFechaInicio && <p className="mt-1 text-xs text-red-600">{errFechaInicio}</p>}
                  </div>
                  <div>
                    <label htmlFor="fechaFin" className="block text-gray-700 text-xs font-semibold mb-1.5">Fecha de Fin *</label>
                    <input
                      id="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => {
                        const next = { ...formData, fechaFin: e.target.value };
                        setFormData(next);
                        setTouchedFechaFin(true);
                        setErrFechaFin(validateFechaFin(e.target.value, next.fechaInicio));
                        if (next.fechaInicio) setErrFechaInicio(validateFechaInicio(next.fechaInicio, e.target.value));
                        void validarTraslape(next.fechaInicio, next.fechaFin);
                      }}
                      onBlur={() => { setTouchedFechaFin(true); setErrFechaFin(validateFechaFin(formData.fechaFin, formData.fechaInicio)); }}
                      className={touchedFechaFin && errFechaFin ? inputClassErr : inputClass}
                      disabled={loading}
                    />
                    {touchedFechaFin && errFechaFin && <p className="mt-1 text-xs text-red-600">{errFechaFin}</p>}
                  </div>
                </div>
                {validandoTraslape && (
                  <p className="text-xs text-gray-400 -mt-2">Validando traslape...</p>
                )}
                {traslapeAviso && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    {traslapeAviso}
                  </div>
                )}

                <div>
                  <label htmlFor="motivo" className="block text-gray-700 text-xs font-semibold mb-1.5">Motivo / Justificación *</label>
                  <textarea
                    id="motivo"
                    rows={4}
                    value={formData.motivo}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({ ...formData, motivo: v });
                      setTouchedMotivo(true);
                      setErrMotivo(validateMotivo(v));
                    }}
                    onBlur={() => { setTouchedMotivo(true); setErrMotivo(validateMotivo(formData.motivo)); }}
                    className={touchedMotivo && errMotivo ? inputClassErr : inputClass}
                    placeholder="Describe brevemente el motivo de tu ausencia..."
                    disabled={loading}
                  />
                  {touchedMotivo && errMotivo && <p className="mt-1 text-xs text-red-600">{errMotivo}</p>}
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
