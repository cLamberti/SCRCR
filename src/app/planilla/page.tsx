'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { FaFileExcel, FaPlus, FaLock, FaTrash, FaEye, FaUserTie, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Sidebar from '@/components/SideBar';

type Empleado = {
  id: number; nombre: string; cedula: string;
  puesto: string; salarioBase: number; cuentaBancaria?: string; estado: number;
};

type LineaForm = {
  empleadoId: number; diasAusentes: number; diasVacaciones: number; diasIncapacidad: number;
};

type PlanillaResumen = {
  id: number; mes: number; anio: number; estado: string; fechaGeneracion: string; totalAPagar: number;
};

type LineaDetalle = {
  empleadoNombre: string; empleadoCedula: string; empleadoPuesto: string;
  empleadoCuentaBancaria?: string; salarioBase: number;
  diasTrabajados: number; diasAusentes: number; diasVacaciones: number;
  diasIncapacidad: number; montoAPagar: number;
};

type PlanillaDetalle = PlanillaResumen & { lineas: LineaDetalle[] };

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition';

export default function PlanillaPage() {
  const [tab, setTab] = useState<'historial' | 'empleados'>('historial');

  // Empleados
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', cedula: '', puesto: '', salarioBase: '', cuentaBancaria: '' });
  const [showFormEmp, setShowFormEmp] = useState(false);
  const [editandoEmp, setEditandoEmp] = useState<Empleado | null>(null);
  const [enviandoEmp, setEnviandoEmp] = useState(false);
  const [mensajeEmp, setMensajeEmp] = useState('');
  const [mensajeEmpOk, setMensajeEmpOk] = useState(true);
  const [empErrors, setEmpErrors] = useState<Record<string, string>>({});
  const [empTouched, setEmpTouched] = useState<Record<string, boolean>>({});

  // Planillas
  const [planillas, setPlanillas] = useState<PlanillaResumen[]>([]);
  const [loadingPlanillas, setLoadingPlanillas] = useState(true);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [detalle, setDetalle] = useState<PlanillaDetalle | null>(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  // Generar planilla
  const [modalGenerar, setModalGenerar] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [generando, setGenerando] = useState(false);
  const [mensajePlan, setMensajePlan] = useState('');

  const cargarEmpleados = useCallback(async () => {
    setLoadingEmpleados(true);
    try {
      const res = await fetch('/api/empleados');
      const json = await res.json();
      if (json.success) setEmpleados(json.data);
    } finally { setLoadingEmpleados(false); }
  }, []);

  const cargarPlanillas = useCallback(async () => {
    setLoadingPlanillas(true);
    try {
      const res = await fetch('/api/planilla');
      const json = await res.json();
      if (json.success) setPlanillas(json.data);
    } finally { setLoadingPlanillas(false); }
  }, []);

  useEffect(() => { cargarEmpleados(); cargarPlanillas(); }, [cargarEmpleados, cargarPlanillas]);
  useAutoRefresh(useCallback(() => { cargarEmpleados(); cargarPlanillas(); }, [cargarEmpleados, cargarPlanillas]));

  // Inicializar líneas cuando se abre el modal de generar
  const abrirModalGenerar = () => {
    const activos = empleados.filter(e => e.estado === 1);
    setLineas(activos.map(e => ({ empleadoId: e.id, diasAusentes: 0, diasVacaciones: 0, diasIncapacidad: 0 })));
    setMensajePlan('');
    setModalGenerar(true);
  };

  const actualizarLinea = (empleadoId: number, campo: keyof Omit<LineaForm, 'empleadoId'>, valor: number) => {
    setLineas(prev => prev.map(l => l.empleadoId === empleadoId ? { ...l, [campo]: Math.max(0, valor) } : l));
  };

  const generarPlanilla = async () => {
    setGenerando(true); setMensajePlan('');
    try {
      const res = await fetch('/api/planilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes, anio, lineas }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setMensajePlan(json.message || 'Error al generar la planilla.'); return; }
      setModalGenerar(false);
      await cargarPlanillas();
      Swal.fire('¡Éxito!', 'Planilla generada exitosamente.', 'success');
    } catch { setMensajePlan('Error de conexión.'); }
    finally { setGenerando(false); }
  };

  const verDetalle = async (id: number) => {
    const res = await fetch(`/api/planilla/${id}`);
    const json = await res.json();
    if (json.success) { setDetalle(json.data); setModalDetalle(true); }
  };

  const exportar = (id: number) => {
    window.location.href = `/api/planilla/${id}/exportar`;
  };

  const cerrarPlanilla = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Cerrar planilla?', text: 'Una vez cerrada no se puede modificar.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#003366', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Cerrar', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    await fetch(`/api/planilla/${id}`, { method: 'PATCH' });
    await cargarPlanillas();
    if (detalle?.id === id) setDetalle(prev => prev ? { ...prev, estado: 'cerrado' } : prev);
  };

  // Empleados CRUD
  function validarCampoEmp(campo: string, valor: string): string {
    switch (campo) {
      case 'nombre': return !valor.trim() ? 'El nombre es obligatorio.' : '';
      case 'cedula': return !valor.trim() ? 'La cédula es obligatoria.' : '';
      case 'puesto': return !valor.trim() ? 'El puesto es obligatorio.' : '';
      case 'salarioBase':
        if (!valor) return 'El salario base es obligatorio.';
        if (isNaN(Number(valor)) || Number(valor) <= 0) return 'Ingresa un salario válido mayor a 0.';
        return '';
      default: return '';
    }
  }

  const handleEmpChange = (campo: string, valor: string) => {
    setFormEmp(p => ({ ...p, [campo]: valor }));
    setEmpTouched(p => ({ ...p, [campo]: true }));
    setEmpErrors(p => ({ ...p, [campo]: validarCampoEmp(campo, valor) }));
  };

  // Solo valida al perder foco — NO reescribe el valor
  const handleEmpBlur = (campo: string) => {
    setEmpTouched(p => ({ ...p, [campo]: true }));
    setEmpErrors(p => ({ ...p, [campo]: validarCampoEmp(campo, (formEmp as any)[campo] ?? '') }));
  };

  const abrirFormEmp = (emp?: Empleado) => {
    setEditandoEmp(emp || null);
    setFormEmp(emp
      ? { nombre: emp.nombre, cedula: emp.cedula, puesto: emp.puesto, salarioBase: String(emp.salarioBase), cuentaBancaria: emp.cuentaBancaria || '' }
      : { nombre: '', cedula: '', puesto: '', salarioBase: '', cuentaBancaria: '' }
    );
    setMensajeEmp('');
    setEmpErrors({}); setEmpTouched({});
    setShowFormEmp(true);
  };

  const guardarEmpleado = async () => {
    const campos = ['nombre', 'cedula', 'puesto', 'salarioBase'];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    for (const campo of campos) {
      newTouched[campo] = true;
      const err = validarCampoEmp(campo, (formEmp as any)[campo]);
      if (err) newErrors[campo] = err;
    }
    setEmpTouched(prev => ({ ...prev, ...newTouched }));
    setEmpErrors(prev => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;
    setEnviandoEmp(true); setMensajeEmp('');
    try {
      const body = { ...formEmp, salarioBase: Number(formEmp.salarioBase) };
      const url = editandoEmp ? `/api/empleados/${editandoEmp.id}` : '/api/empleados';
      const method = editandoEmp ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !json.success) { setMensajeEmp(json.message || 'Error.'); setMensajeEmpOk(false); return; }
      setMensajeEmp(editandoEmp ? 'Empleado actualizado.' : 'Empleado creado.'); setMensajeEmpOk(true);
      setShowFormEmp(false); setEditandoEmp(null);
      await cargarEmpleados();
    } catch { setMensajeEmp('Error de conexión.'); setMensajeEmpOk(false); }
    finally { setEnviandoEmp(false); }
  };

  const eliminarEmpleado = async (emp: Empleado) => {
    const confirm = await Swal.fire({
      title: `¿Desactivar a ${emp.nombre}?`, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Desactivar', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    await fetch(`/api/empleados/${emp.id}`, { method: 'DELETE' });
    await cargarEmpleados();
  };

  const diasTrabajados = (l: LineaForm) => Math.max(0, 30 - l.diasAusentes - l.diasVacaciones - l.diasIncapacidad);
  const montoEstimado = (l: LineaForm, emp: Empleado) => Math.max(0, emp.salarioBase - l.diasAusentes * (emp.salarioBase / 30));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar pageTitle="Planilla" />

      <div className="flex-1 pt-14 md:pt-0 flex flex-col min-h-screen">
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center">
              <FaFileExcel className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Generación de Planilla</h1>
              <p className="text-xs text-gray-400">Gestión de empleados y planillas mensuales</p>
            </div>
          </div>
          <button onClick={abrirModalGenerar}
            className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <FaPlus className="text-xs" /> Nueva Planilla
          </button>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-5">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {(['historial', 'empleados'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition border-b-2 -mb-px ${tab === t ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t === 'historial' ? 'Historial de Planillas' : 'Empleados'}
              </button>
            ))}
          </div>

          {/* ── TAB HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loadingPlanillas ? (
                <div className="divide-y divide-gray-50">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="px-6 py-4 flex gap-6 items-center" style={{ opacity: 1 - i * 0.2 }}>
                      <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                      <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                      <div className="h-4 w-28 rounded bg-gray-200 animate-pulse ml-auto" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
                        <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : planillas.length === 0 ? (
                <div className="p-12 text-center">
                  <FaFileExcel className="mx-auto text-gray-300 text-3xl mb-3" />
                  <p className="text-gray-500 text-sm">No hay planillas generadas aún.</p>
                  <button onClick={abrirModalGenerar}
                    className="mt-4 inline-flex items-center gap-2 bg-[#003366] text-white text-sm font-semibold px-4 py-2 rounded-lg">
                    <FaPlus /> Generar primera planilla
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Período', 'Estado', 'Fecha Generación', 'Total a Pagar', 'Acciones'].map(h => (
                            <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {planillas.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{MESES[p.mes - 1]} {p.anio}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.estado === 'cerrado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {p.estado === 'cerrado' ? 'Cerrada' : 'Borrador'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">{new Date(p.fechaGeneracion).toLocaleDateString('es-CR')}</td>
                            <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                              ₡{p.totalAPagar?.toLocaleString('es-CR', { minimumFractionDigits: 2 }) ?? '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => verDetalle(p.id)} title="Ver detalle"
                                  className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition">
                                  <FaEye className="text-xs" />
                                </button>
                                <button onClick={() => exportar(p.id)} title="Exportar Excel"
                                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 transition">
                                  <FaFileExcel className="text-xs" />
                                </button>
                                {p.estado !== 'cerrado' && (
                                  <button onClick={() => cerrarPlanilla(p.id)} title="Cerrar planilla"
                                    className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white border border-gray-200 transition">
                                    <FaLock className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {planillas.map(p => (
                      <div key={p.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{MESES[p.mes - 1]} {p.anio}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(p.fechaGeneracion).toLocaleDateString('es-CR')}</p>
                          </div>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.estado === 'cerrado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {p.estado === 'cerrado' ? 'Cerrada' : 'Borrador'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-3">
                          ₡{p.totalAPagar?.toLocaleString('es-CR', { minimumFractionDigits: 2 }) ?? '—'}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => verDetalle(p.id)}
                            className="flex-1 py-2 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-600 hover:text-white transition">
                            <FaEye /> Ver detalle
                          </button>
                          <button onClick={() => exportar(p.id)}
                            className="flex-1 py-2 text-xs font-semibold text-green-600 border border-green-200 bg-green-50 rounded-lg flex items-center justify-center gap-1.5 hover:bg-green-600 hover:text-white transition">
                            <FaFileExcel /> Exportar
                          </button>
                          {p.estado !== 'cerrado' && (
                            <button onClick={() => cerrarPlanilla(p.id)}
                              className="py-2 px-3 text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-600 hover:text-white transition">
                              <FaLock />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB EMPLEADOS ── */}
          {tab === 'empleados' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => abrirFormEmp()}
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  <FaPlus className="text-xs" /> Nuevo Empleado
                </button>
              </div>

              {mensajeEmp && !showFormEmp && (
                <div className={`rounded-lg px-4 py-3 text-sm border ${mensajeEmpOk ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                  {mensajeEmp}
                </div>
              )}

              {showFormEmp && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaUserTie className="text-white text-sm" />
                      <h2 className="text-white font-semibold text-sm">{editandoEmp ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
                    </div>
                    <button onClick={() => setShowFormEmp(false)} className="text-white/70 hover:text-white text-sm">✕</button>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mensajeEmp && (
                      <div className={`sm:col-span-2 rounded-lg px-4 py-3 text-sm border ${mensajeEmpOk ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {mensajeEmp}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre *</label>
                      <input
                        className={`${inputCls}${empTouched.nombre && empErrors.nombre ? ' border-red-400 bg-red-50/30' : ''}`}
                        value={formEmp.nombre}
                        onChange={e => handleEmpChange('nombre', e.target.value)}
                        onBlur={() => handleEmpBlur('nombre')}
                        placeholder="Juan Pérez" />
                      {empTouched.nombre && empErrors.nombre && <p className="mt-1 text-xs text-red-600">{empErrors.nombre}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cédula *</label>
                      <input
                        className={`${inputCls}${empTouched.cedula && empErrors.cedula ? ' border-red-400 bg-red-50/30' : ''}`}
                        value={formEmp.cedula}
                        onChange={e => handleEmpChange('cedula', e.target.value)}
                        onBlur={() => handleEmpBlur('cedula')}
                        placeholder="1-0000-0000" />
                      {empTouched.cedula && empErrors.cedula && <p className="mt-1 text-xs text-red-600">{empErrors.cedula}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Puesto *</label>
                      <input
                        className={`${inputCls}${empTouched.puesto && empErrors.puesto ? ' border-red-400 bg-red-50/30' : ''}`}
                        value={formEmp.puesto}
                        onChange={e => handleEmpChange('puesto', e.target.value)}
                        onBlur={() => handleEmpBlur('puesto')}
                        placeholder="Guarda de Seguridad" />
                      {empTouched.puesto && empErrors.puesto && <p className="mt-1 text-xs text-red-600">{empErrors.puesto}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Salario Base (₡) *</label>
                      <input
                        type="number"
                        className={`${inputCls}${empTouched.salarioBase && empErrors.salarioBase ? ' border-red-400 bg-red-50/30' : ''}`}
                        value={formEmp.salarioBase}
                        onChange={e => handleEmpChange('salarioBase', e.target.value)}
                        onBlur={() => handleEmpBlur('salarioBase')}
                        placeholder="500000" min="1" />
                      {empTouched.salarioBase && empErrors.salarioBase && <p className="mt-1 text-xs text-red-600">{empErrors.salarioBase}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cuenta Bancaria</label>
                      <input className={inputCls} value={formEmp.cuentaBancaria} onChange={e => setFormEmp(p => ({ ...p, cuentaBancaria: e.target.value }))} placeholder="CR00 0000 0000 0000 0000 00" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3">
                      <button onClick={() => setShowFormEmp(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                      <button onClick={guardarEmpleado} disabled={enviandoEmp}
                        className="px-5 py-2 text-sm font-semibold text-white bg-[#003366] hover:bg-[#004488] disabled:opacity-50 rounded-lg transition">
                        {enviandoEmp ? 'Guardando...' : (editandoEmp ? 'Actualizar' : 'Crear')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loadingEmpleados ? (
                  <div className="divide-y divide-gray-50">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="px-6 py-4 flex gap-6 items-center" style={{ opacity: 1 - i * 0.25 }}>
                        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                        <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                        <div className="h-3 w-28 rounded bg-gray-100 animate-pulse" />
                        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse ml-auto" />
                        <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : empleados.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaUserTie className="mx-auto text-gray-300 text-3xl mb-3" />
                    <p className="text-gray-500 text-sm">No hay empleados registrados.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Nombre', 'Cédula', 'Puesto', 'Salario Base', 'Cuenta Bancaria', 'Estado', 'Acciones'].map(h => (
                              <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {empleados.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{e.nombre}</td>
                              <td className="px-6 py-4 text-gray-600 font-mono text-xs whitespace-nowrap">{e.cedula}</td>
                              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{e.puesto}</td>
                              <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">₡{e.salarioBase.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-gray-500 text-xs">{e.cuentaBancaria || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${e.estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {e.estado === 1 ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => abrirFormEmp(e)} title="Editar"
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition">
                                    <FaEye className="text-xs" />
                                  </button>
                                  {e.estado === 1 && (
                                    <button onClick={() => eliminarEmpleado(e)} title="Desactivar"
                                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition">
                                      <FaTrash className="text-xs" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {empleados.map(e => (
                        <div key={e.id} className="p-4">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-semibold text-gray-900 text-sm truncate">{e.nombre}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{e.cedula} · {e.puesto}</p>
                            </div>
                            <span className={`flex-shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${e.estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {e.estado === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900 mt-2">₡{e.salarioBase.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</p>
                          {e.cuentaBancaria && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{e.cuentaBancaria}</p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => abrirFormEmp(e)}
                              className="flex-1 py-2 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition">
                              Editar
                            </button>
                            {e.estado === 1 && (
                              <button onClick={() => eliminarEmpleado(e)}
                                className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition">
                                Desactivar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL GENERAR PLANILLA ── */}
      {modalGenerar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
            <div className="bg-[#003366] px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-white font-bold text-base">Nueva Planilla</h2>
              <button onClick={() => setModalGenerar(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {mensajePlan && (
                <div className="rounded-lg px-4 py-3 text-sm border bg-red-50 text-red-800 border-red-200">{mensajePlan}</div>
              )}

              {/* Mes y Año */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mes *</label>
                  <select className={inputCls} value={mes} onChange={e => setMes(Number(e.target.value))}>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Año *</label>
                  <input type="number" className={inputCls} value={anio} onChange={e => setAnio(Number(e.target.value))} min="2000" max="2100" />
                </div>
              </div>

              {/* Tabla de empleados */}
              {lineas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay empleados activos. Registra empleados primero.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Empleado', 'Salario Base', 'Días Ausentes', 'Días Vacaciones', 'Días Incapacidad', 'Días Trabaj.', 'Monto Est.'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineas.map(l => {
                        const emp = empleados.find(e => e.id === l.empleadoId)!;
                        return (
                          <tr key={l.empleadoId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900 text-xs">{emp?.nombre}</td>
                            <td className="px-3 py-2 text-gray-600 text-xs">₡{emp?.salarioBase.toLocaleString('es-CR')}</td>
                            {(['diasAusentes', 'diasVacaciones', 'diasIncapacidad'] as const).map(campo => (
                              <td key={campo} className="px-3 py-2">
                                <input type="number" min="0" max="30" value={l[campo]}
                                  onChange={e => actualizarLinea(l.empleadoId, campo, Number(e.target.value))}
                                  className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#003366]" />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold text-gray-700 text-xs">{diasTrabajados(l)}</td>
                            <td className="px-3 py-2 font-semibold text-green-700 text-xs">₡{montoEstimado(l, emp).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total</td>
                        <td className="px-3 py-2 font-bold text-green-700 text-xs">
                          ₡{lineas.reduce((sum, l) => sum + montoEstimado(l, empleados.find(e => e.id === l.empleadoId)!), 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={() => setModalGenerar(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={generarPlanilla} disabled={generando || lineas.length === 0}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#003366] hover:bg-[#004488] disabled:opacity-50 rounded-lg transition">
                  {generando ? 'Generando...' : 'Generar Planilla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE ── */}
      {modalDetalle && detalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4">
            <div className="bg-[#003366] px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-white font-bold text-base">
                Planilla {MESES[detalle.mes - 1]} {detalle.anio}
                <span className={`ml-3 text-xs font-normal px-2 py-0.5 rounded-full ${detalle.estado === 'cerrado' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'}`}>
                  {detalle.estado === 'cerrado' ? 'Cerrada' : 'Borrador'}
                </span>
              </h2>
              <button onClick={() => setModalDetalle(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Nombre', 'Cédula', 'Puesto', 'Cuenta Bancaria', 'Sal. Base', 'Trabaj.', 'Ausentes', 'Vacac.', 'Incap.', 'Monto'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalle.lineas.map((l, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900 text-xs">{l.empleadoNombre}</td>
                        <td className="px-3 py-2 text-gray-500 font-mono text-xs">{l.empleadoCedula}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{l.empleadoPuesto}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{l.empleadoCuentaBancaria || '-'}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">₡{l.salarioBase.toLocaleString('es-CR')}</td>
                        <td className="px-3 py-2 text-center text-xs">{l.diasTrabajados}</td>
                        <td className="px-3 py-2 text-center text-xs text-red-600">{l.diasAusentes}</td>
                        <td className="px-3 py-2 text-center text-xs text-blue-600">{l.diasVacaciones}</td>
                        <td className="px-3 py-2 text-center text-xs text-orange-600">{l.diasIncapacidad}</td>
                        <td className="px-3 py-2 font-bold text-green-700 text-xs">₡{l.montoAPagar.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total a Pagar</td>
                      <td className="px-3 py-2 font-bold text-green-700 text-xs">₡{detalle.totalAPagar.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                {detalle.estado !== 'cerrado' && (
                  <button onClick={() => cerrarPlanilla(detalle.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <FaLock className="text-xs" /> Cerrar Planilla
                  </button>
                )}
                <button onClick={() => exportar(detalle.id)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition">
                  <FaFileExcel className="text-xs" /> Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
