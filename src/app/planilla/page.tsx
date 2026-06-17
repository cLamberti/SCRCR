'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { FaFileExcel, FaFilePdf, FaPlus, FaLock, FaTrash, FaEye, FaUserTie, FaSpinner, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Sidebar from '@/components/SideBar';

type Empleado = {
  id: number; nombre: string; cedula: string;
  puesto: string; salarioBase: number; cuentaBancaria?: string; estado: number;
  diasVacacionesDisponibles: number;
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

type VacacionRow = {
  id: number; empleadoId: number;
  empleado: { nombre: string; cedula: string; puesto: string };
  fechaInicio: string; fechaFin: string; cantidadDias: number;
  documentoUrl?: string; estado: string; observaciones?: string;
  createdAt: string;
};

type PermisoEmpRow = {
  id: number; empleadoId: number;
  empleado: { nombre: string; cedula: string; puesto: string };
  fechaInicio: string; fechaFin: string; justificacion: string;
  documentoUrl?: string; estado: string; createdAt: string;
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition';

export default function PlanillaPage() {
  const [tab, setTab] = useState<'historial' | 'empleados' | 'vacaciones' | 'permisos'>('historial');

  // Empleados
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', cedula: '', puesto: '', salarioBase: '', cuentaBancaria: '', diasVacacionesDisponibles: '12' });
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

  // Vacaciones
  const [vacaciones, setVacaciones] = useState<VacacionRow[]>([]);
  const [loadingVac, setLoadingVac] = useState(true);
  const [showFormVac, setShowFormVac] = useState(false);
  const [enviandoVac, setEnviandoVac] = useState(false);
  const [mensajeVac, setMensajeVac] = useState('');
  const [mensajeVacOk, setMensajeVacOk] = useState(true);
  const [formVac, setFormVac] = useState({ empleadoId: '', fechaInicio: '', fechaFin: '', cantidadDias: '', observaciones: '', documentoUrl: '' });
  const [archivoVac, setArchivoVac] = useState<File | null>(null);
  const [subiendoVac, setSubiendoVac] = useState(false);

  // Permisos empleados
  const [permisosEmp, setPermisosEmp] = useState<PermisoEmpRow[]>([]);
  const [loadingPerm, setLoadingPerm] = useState(true);
  const [showFormPerm, setShowFormPerm] = useState(false);
  const [enviandoPerm, setEnviandoPerm] = useState(false);
  const [mensajePerm, setMensajePerm] = useState('');
  const [mensajePermOk, setMensajePermOk] = useState(true);
  const [formPerm, setFormPerm] = useState({ empleadoId: '', fechaInicio: '', fechaFin: '', justificacion: '', documentoUrl: '' });
  const [archivoPerm, setArchivoPerm] = useState<File | null>(null);
  const [subiendoPerm, setSubiendoPerm] = useState(false);

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

  const cargarVacaciones = useCallback(async () => {
    setLoadingVac(true);
    try {
      const res = await fetch('/api/empleados/vacaciones');
      const json = await res.json();
      if (json.success) setVacaciones(json.data);
    } finally { setLoadingVac(false); }
  }, []);

  const cargarPermisosEmp = useCallback(async () => {
    setLoadingPerm(true);
    try {
      const res = await fetch('/api/empleados/permisos');
      const json = await res.json();
      if (json.success) setPermisosEmp(json.data);
    } finally { setLoadingPerm(false); }
  }, []);

  useEffect(() => { cargarEmpleados(); cargarPlanillas(); cargarVacaciones(); cargarPermisosEmp(); }, [cargarEmpleados, cargarPlanillas, cargarVacaciones, cargarPermisosEmp]);
  useAutoRefresh(useCallback(() => { cargarEmpleados(); cargarPlanillas(); cargarVacaciones(); cargarPermisosEmp(); }, [cargarEmpleados, cargarPlanillas, cargarVacaciones, cargarPermisosEmp]));

  // Días de vacaciones usados por empleado (excluyendo rechazados)
  const diasVacUsadosPorEmp = useMemo(() => {
    const map: Record<number, number> = {};
    vacaciones.filter(v => v.estado !== 'RECHAZADO').forEach(v => {
      map[v.empleadoId] = (map[v.empleadoId] || 0) + v.cantidadDias;
    });
    return map;
  }, [vacaciones]);

  // Cerrar modales con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (modalGenerar) setModalGenerar(false);
      else if (modalDetalle) setModalDetalle(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalGenerar, modalDetalle]);

  // Recalcular días de vacaciones en el modal de generar planilla cuando cambia mes/año
  useEffect(() => {
    if (!modalGenerar) return;
    const vacMes = vacaciones.filter(v => {
      const f = new Date(v.fechaInicio);
      return f.getMonth() + 1 === mes && f.getFullYear() === anio && v.estado !== 'RECHAZADO';
    });
    const vacPorEmp: Record<number, number> = {};
    vacMes.forEach(v => { vacPorEmp[v.empleadoId] = (vacPorEmp[v.empleadoId] || 0) + v.cantidadDias; });
    setLineas(prev => prev.map(l => ({ ...l, diasVacaciones: vacPorEmp[l.empleadoId] || 0 })));
  }, [mes, anio, modalGenerar, vacaciones]);

  // Inicializar líneas cuando se abre el modal de generar
  const abrirModalGenerar = () => {
    const activos = empleados.filter(e => e.estado === 1);
    const vacMes = vacaciones.filter(v => {
      const f = new Date(v.fechaInicio);
      return f.getMonth() + 1 === mes && f.getFullYear() === anio && v.estado !== 'RECHAZADO';
    });
    const vacPorEmp: Record<number, number> = {};
    vacMes.forEach(v => { vacPorEmp[v.empleadoId] = (vacPorEmp[v.empleadoId] || 0) + v.cantidadDias; });
    setLineas(activos.map(e => ({ empleadoId: e.id, diasAusentes: 0, diasVacaciones: vacPorEmp[e.id] || 0, diasIncapacidad: 0 })));
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
      ? { nombre: emp.nombre, cedula: emp.cedula, puesto: emp.puesto, salarioBase: String(emp.salarioBase), cuentaBancaria: emp.cuentaBancaria || '', diasVacacionesDisponibles: String(emp.diasVacacionesDisponibles ?? 12) }
      : { nombre: '', cedula: '', puesto: '', salarioBase: '', cuentaBancaria: '', diasVacacionesDisponibles: '12' }
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
      const body = { ...formEmp, salarioBase: Number(formEmp.salarioBase), diasVacacionesDisponibles: Number(formEmp.diasVacacionesDisponibles) || 12 };
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

  // ─── Upload helper ────────────────────────────────────────────────────────
  const subirDocumento = async (file: File, folder: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/documentos/upload', { method: 'POST', body: fd });
    const json = await res.json();
    return json.success ? json.url : null;
  };

  // ─── Vacaciones handlers ──────────────────────────────────────────────────
  const guardarVacacion = async () => {
    if (!formVac.empleadoId || !formVac.fechaInicio || !formVac.fechaFin || !formVac.cantidadDias) {
      setMensajeVac('Empleado, fechas y cantidad de días son obligatorios.'); setMensajeVacOk(false); return;
    }
    const empSelVac = empleados.find(e => e.id === Number(formVac.empleadoId));
    const diasUsadosEmp = diasVacUsadosPorEmp[Number(formVac.empleadoId)] || 0;
    const diasDisponiblesEmp = (empSelVac?.diasVacacionesDisponibles ?? 12) - diasUsadosEmp;
    if (Number(formVac.cantidadDias) > diasDisponiblesEmp) {
      setMensajeVac(`Días insuficientes. Disponibles: ${diasDisponiblesEmp}, Solicitados: ${formVac.cantidadDias}.`); setMensajeVacOk(false); return;
    }
    setEnviandoVac(true); setMensajeVac('');
    try {
      let docUrl = formVac.documentoUrl;
      if (archivoVac) {
        setSubiendoVac(true);
        const url = await subirDocumento(archivoVac, 'vacaciones');
        setSubiendoVac(false);
        if (!url) { setMensajeVac('Error al subir el documento.'); setMensajeVacOk(false); return; }
        docUrl = url;
      }
      const res = await fetch('/api/empleados/vacaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formVac, empleadoId: Number(formVac.empleadoId), cantidadDias: Number(formVac.cantidadDias), documentoUrl: docUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setMensajeVac(json.message || 'Error.'); setMensajeVacOk(false); return; }
      setMensajeVac('Vacación registrada exitosamente.'); setMensajeVacOk(true);
      setShowFormVac(false);
      setFormVac({ empleadoId: '', fechaInicio: '', fechaFin: '', cantidadDias: '', observaciones: '', documentoUrl: '' });
      setArchivoVac(null);
      await cargarVacaciones();
    } catch { setMensajeVac('Error de conexión.'); setMensajeVacOk(false); }
    finally { setEnviandoVac(false); setSubiendoVac(false); }
  };

  // ─── Permisos empleados handlers ─────────────────────────────────────────
  const guardarPermisoEmp = async () => {
    if (!formPerm.empleadoId || !formPerm.fechaInicio || !formPerm.fechaFin || !formPerm.justificacion.trim()) {
      setMensajePerm('Empleado, fechas y justificación son obligatorios.'); setMensajePermOk(false); return;
    }
    setEnviandoPerm(true); setMensajePerm('');
    try {
      let docUrl = formPerm.documentoUrl;
      if (archivoPerm) {
        setSubiendoPerm(true);
        const url = await subirDocumento(archivoPerm, 'permisos-emp');
        setSubiendoPerm(false);
        if (!url) { setMensajePerm('Error al subir el documento.'); setMensajePermOk(false); return; }
        docUrl = url;
      }
      const res = await fetch('/api/empleados/permisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formPerm, empleadoId: Number(formPerm.empleadoId), documentoUrl: docUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setMensajePerm(json.message || 'Error.'); setMensajePermOk(false); return; }
      setMensajePerm('Permiso registrado exitosamente.'); setMensajePermOk(true);
      setShowFormPerm(false);
      setFormPerm({ empleadoId: '', fechaInicio: '', fechaFin: '', justificacion: '', documentoUrl: '' });
      setArchivoPerm(null);
      await cargarPermisosEmp();
    } catch { setMensajePerm('Error de conexión.'); setMensajePermOk(false); }
    finally { setEnviandoPerm(false); setSubiendoPerm(false); }
  };

  // ─── Export empleados ────────────────────────────────────────────────────
  const exportarEmpleadosExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const filas = empleados.map((e, i) => ({
      '#': i + 1, 'Nombre': e.nombre, 'Cédula': e.cedula, 'Puesto': e.puesto,
      'Salario Base (₡)': e.salarioBase, 'Cuenta Bancaria': e.cuentaBancaria || '-',
      'Estado': e.estado === 1 ? 'Activo' : 'Inactivo',
    }));
    const ws = utils.json_to_sheet(filas);
    ws['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 26 }, { wch: 10 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Empleados');
    writeFile(wb, 'listado_empleados.xlsx');
  };

  const exportarEmpleadosPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Listado de Empleados', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CR')}  · Total: ${empleados.length}`, 14, 22);
    autoTable(doc, {
      startY: 27,
      head: [['#', 'Nombre', 'Cédula', 'Puesto', 'Salario Base (₡)', 'Cuenta Bancaria', 'Estado']],
      body: empleados.map((e, i) => [
        i + 1, e.nombre, e.cedula, e.puesto,
        e.salarioBase.toLocaleString('es-CR', { minimumFractionDigits: 2 }),
        e.cuentaBancaria || '-', e.estado === 1 ? 'Activo' : 'Inactivo',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 51, 102] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save('listado_empleados.pdf');
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
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {([
              { id: 'historial', label: 'Historial de Planillas', icon: FaFileExcel },
              { id: 'empleados', label: 'Empleados', icon: FaUserTie },
              { id: 'vacaciones', label: 'Vacaciones', icon: FaCalendarAlt },
              { id: 'permisos', label: 'Permisos', icon: FaClipboardList },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px ${tab === t.id ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <t.icon className="text-xs" />{t.label}
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
                              <FaLock /> Cerrar
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
              <div className="flex justify-end gap-2 flex-wrap">
                <button onClick={exportarEmpleadosExcel} title="Exportar Excel"
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
                  <FaFileExcel className="text-xs" /> Excel
                </button>
                <button onClick={exportarEmpleadosPDF} title="Exportar PDF"
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
                  <FaFilePdf className="text-xs" /> PDF
                </button>
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
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cuenta Bancaria</label>
                      <input className={inputCls} value={formEmp.cuentaBancaria} onChange={e => setFormEmp(p => ({ ...p, cuentaBancaria: e.target.value }))} placeholder="CR00 0000 0000 0000 0000 00" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Días de Vacaciones Disponibles</label>
                      <input type="number" min="0" className={inputCls} value={formEmp.diasVacacionesDisponibles}
                        onChange={e => setFormEmp(p => ({ ...p, diasVacacionesDisponibles: e.target.value }))} placeholder="12" />
                      <p className="mt-1 text-xs text-gray-400">12 días por cada 56 semanas laboradas</p>
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
                            {['Nombre', 'Cédula', 'Puesto', 'Salario Base', 'Cuenta Bancaria', 'Días Vac.', 'Estado', 'Acciones'].map(h => (
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
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                  {(e.diasVacacionesDisponibles ?? 12) - (diasVacUsadosPorEmp[e.id] || 0)} / {e.diasVacacionesDisponibles ?? 12}
                                </span>
                              </td>
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

          {/* ── TAB VACACIONES ── */}
          {tab === 'vacaciones' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setShowFormVac(true); setMensajeVac(''); }}
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  <FaPlus className="text-xs" /> Registrar Vacación
                </button>
              </div>

              {mensajeVac && !showFormVac && (
                <div className={`rounded-lg px-4 py-3 text-sm border ${mensajeVacOk ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                  {mensajeVac}
                </div>
              )}

              {showFormVac && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-white text-sm" />
                      <h2 className="text-white font-semibold text-sm">Registrar Vacaciones</h2>
                    </div>
                    <button onClick={() => setShowFormVac(false)} className="text-white/70 hover:text-white text-sm">✕</button>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mensajeVac && (
                      <div className={`sm:col-span-2 rounded-lg px-4 py-3 text-sm border ${mensajeVacOk ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {mensajeVac}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Empleado *</label>
                      <select className={inputCls} value={formVac.empleadoId} onChange={e => setFormVac(p => ({ ...p, empleadoId: e.target.value }))}>
                        <option value="">-- Seleccionar empleado --</option>
                        {empleados.filter(e => e.estado === 1).map(e => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cantidad de Días *</label>
                      <input type="number" min="1" className={inputCls} value={formVac.cantidadDias}
                        onChange={e => setFormVac(p => ({ ...p, cantidadDias: e.target.value }))} placeholder="0" />
                    </div>
                    {formVac.empleadoId && (() => {
                      const empSel = empleados.find(e => e.id === Number(formVac.empleadoId));
                      if (!empSel) return null;
                      const usados = diasVacUsadosPorEmp[empSel.id] || 0;
                      const disponibles = empSel.diasVacacionesDisponibles - usados;
                      return (
                        <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm flex flex-wrap items-center gap-3">
                          <span className={`font-semibold ${disponibles <= 0 ? 'text-red-700' : 'text-blue-800'}`}>
                            {disponibles} día{disponibles !== 1 ? 's' : ''} disponible{disponibles !== 1 ? 's' : ''}
                          </span>
                          <span className="text-blue-500 text-xs">({usados} usados de {empSel.diasVacacionesDisponibles} asignados · 12 días / 56 semanas)</span>
                        </div>
                      );
                    })()}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha Inicial *</label>
                      <input type="date" className={inputCls} value={formVac.fechaInicio}
                        onChange={e => {
                          const inicio = e.target.value;
                          const fin = formVac.fechaFin;
                          let dias = formVac.cantidadDias;
                          if (inicio && fin && fin >= inicio) {
                            dias = String(Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 86400000) + 1);
                          }
                          setFormVac(p => ({ ...p, fechaInicio: inicio, cantidadDias: dias }));
                        }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha Final *</label>
                      <input type="date" className={inputCls} value={formVac.fechaFin}
                        onChange={e => {
                          const fin = e.target.value;
                          const inicio = formVac.fechaInicio;
                          let dias = formVac.cantidadDias;
                          if (inicio && fin && fin >= inicio) {
                            dias = String(Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 86400000) + 1);
                          }
                          setFormVac(p => ({ ...p, fechaFin: fin, cantidadDias: dias }));
                        }} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Observaciones</label>
                      <textarea className={inputCls} rows={2} value={formVac.observaciones}
                        onChange={e => setFormVac(p => ({ ...p, observaciones: e.target.value }))} placeholder="Observaciones opcionales..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Boleta de Vacaciones (PDF)</label>
                      <input type="file" accept=".pdf,image/*" className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#003366] file:text-white hover:file:bg-[#004488]"
                        onChange={e => setArchivoVac(e.target.files?.[0] ?? null)} />
                      {archivoVac && <p className="mt-1 text-xs text-gray-500 truncate">{archivoVac.name}</p>}
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3">
                      <button onClick={() => setShowFormVac(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                      <button onClick={guardarVacacion} disabled={enviandoVac || subiendoVac}
                        className="px-5 py-2 text-sm font-semibold text-white bg-[#003366] hover:bg-[#004488] disabled:opacity-50 rounded-lg transition inline-flex items-center gap-2">
                        {(enviandoVac || subiendoVac) && <FaSpinner className="animate-spin text-xs" />}
                        {enviandoVac ? 'Guardando...' : subiendoVac ? 'Subiendo...' : 'Registrar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loadingVac ? (
                  <div className="p-8 text-center"><FaSpinner className="animate-spin text-gray-400 text-2xl mx-auto" /></div>
                ) : vacaciones.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaCalendarAlt className="mx-auto text-gray-300 text-3xl mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No hay vacaciones registradas.</p>
                    <button onClick={() => { setShowFormVac(true); setMensajeVac(''); }}
                      className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                      <FaPlus className="text-xs" /> Registrar Vacación
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Empleado', 'Puesto', 'Fecha Inicio', 'Fecha Fin', 'Días', 'Estado', 'Boleta'].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {vacaciones.map(v => (
                          <tr key={v.id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{v.empleado.nombre}</td>
                            <td className="px-5 py-4 text-gray-500 text-xs">{v.empleado.puesto}</td>
                            <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{new Date(v.fechaInicio).toLocaleDateString('es-CR')}</td>
                            <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{new Date(v.fechaFin).toLocaleDateString('es-CR')}</td>
                            <td className="px-5 py-4 text-center font-semibold text-gray-900">{v.cantidadDias}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${v.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : v.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {v.estado}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {v.documentoUrl ? (
                                <a href={v.documentoUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  <FaEye className="text-xs" /> Ver
                                </a>
                              ) : <span className="text-gray-400 text-xs">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB PERMISOS EMPLEADOS ── */}
          {tab === 'permisos' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setShowFormPerm(true); setMensajePerm(''); }}
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  <FaPlus className="text-xs" /> Registrar Permiso
                </button>
              </div>

              {mensajePerm && !showFormPerm && (
                <div className={`rounded-lg px-4 py-3 text-sm border ${mensajePermOk ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                  {mensajePerm}
                </div>
              )}

              {showFormPerm && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaClipboardList className="text-white text-sm" />
                      <h2 className="text-white font-semibold text-sm">Registrar Permiso de Empleado</h2>
                    </div>
                    <button onClick={() => setShowFormPerm(false)} className="text-white/70 hover:text-white text-sm">✕</button>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mensajePerm && (
                      <div className={`sm:col-span-2 rounded-lg px-4 py-3 text-sm border ${mensajePermOk ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {mensajePerm}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Empleado *</label>
                      <select className={inputCls} value={formPerm.empleadoId} onChange={e => setFormPerm(p => ({ ...p, empleadoId: e.target.value }))}>
                        <option value="">-- Seleccionar empleado --</option>
                        {empleados.filter(e => e.estado === 1).map(e => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha Inicial *</label>
                      <input type="date" className={inputCls} value={formPerm.fechaInicio}
                        onChange={e => setFormPerm(p => ({ ...p, fechaInicio: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha Final *</label>
                      <input type="date" className={inputCls} value={formPerm.fechaFin}
                        onChange={e => setFormPerm(p => ({ ...p, fechaFin: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Justificación *</label>
                      <textarea className={inputCls} rows={3} value={formPerm.justificacion}
                        onChange={e => setFormPerm(p => ({ ...p, justificacion: e.target.value }))} placeholder="Describa el motivo del permiso..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Documento de Respaldo (PDF)</label>
                      <input type="file" accept=".pdf,image/*" className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#003366] file:text-white hover:file:bg-[#004488]"
                        onChange={e => setArchivoPerm(e.target.files?.[0] ?? null)} />
                      {archivoPerm && <p className="mt-1 text-xs text-gray-500 truncate">{archivoPerm.name}</p>}
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3">
                      <button onClick={() => setShowFormPerm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                      <button onClick={guardarPermisoEmp} disabled={enviandoPerm || subiendoPerm}
                        className="px-5 py-2 text-sm font-semibold text-white bg-[#003366] hover:bg-[#004488] disabled:opacity-50 rounded-lg transition inline-flex items-center gap-2">
                        {(enviandoPerm || subiendoPerm) && <FaSpinner className="animate-spin text-xs" />}
                        {enviandoPerm ? 'Guardando...' : subiendoPerm ? 'Subiendo...' : 'Registrar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loadingPerm ? (
                  <div className="p-8 text-center"><FaSpinner className="animate-spin text-gray-400 text-2xl mx-auto" /></div>
                ) : permisosEmp.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaClipboardList className="mx-auto text-gray-300 text-3xl mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No hay permisos registrados.</p>
                    <button onClick={() => { setShowFormPerm(true); setMensajePerm(''); }}
                      className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                      <FaPlus className="text-xs" /> Registrar Permiso
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Empleado', 'Puesto', 'Fecha Inicio', 'Fecha Fin', 'Justificación', 'Estado', 'Documento'].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {permisosEmp.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{p.empleado.nombre}</td>
                            <td className="px-5 py-4 text-gray-500 text-xs">{p.empleado.puesto}</td>
                            <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{new Date(p.fechaInicio).toLocaleDateString('es-CR')}</td>
                            <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{new Date(p.fechaFin).toLocaleDateString('es-CR')}</td>
                            <td className="px-5 py-4 text-gray-700 text-xs max-w-[200px] truncate" title={p.justificacion}>{p.justificacion}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : p.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {p.estado}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {p.documentoUrl ? (
                                <a href={p.documentoUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  <FaEye className="text-xs" /> Ver
                                </a>
                              ) : <span className="text-gray-400 text-xs">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL GENERAR PLANILLA ── */}
      {modalGenerar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={() => setModalGenerar(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
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
                        {['Empleado', 'Salario Base', 'Días Ausentes', 'Días Incapacidad', 'Días Trabaj.', 'Monto Est.'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                        <th className="px-3 py-2 text-left text-xs font-semibold text-blue-600 uppercase whitespace-nowrap">
                          Días Vac. <span className="normal-case text-[10px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-medium ml-1">auto</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineas.map(l => {
                        const emp = empleados.find(e => e.id === l.empleadoId)!;
                        return (
                          <tr key={l.empleadoId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900 text-xs">{emp?.nombre}</td>
                            <td className="px-3 py-2 text-gray-600 text-xs">₡{emp?.salarioBase.toLocaleString('es-CR')}</td>
                            {(['diasAusentes', 'diasIncapacidad'] as const).map(campo => (
                              <td key={campo} className="px-3 py-2">
                                <input type="number" min="0" max="30" value={l[campo]}
                                  onChange={e => actualizarLinea(l.empleadoId, campo, Number(e.target.value))}
                                  className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#003366]" />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center justify-center w-16 h-7 rounded border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 select-none" title="Auto-calculado de vacaciones registradas">
                                {l.diasVacaciones}
                              </span>
                            </td>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={() => setModalDetalle(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
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
