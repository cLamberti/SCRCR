'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/SideBar';
import {
  FaBook, FaPlus, FaUsers, FaFileAlt, FaTimes, FaCheck,
  FaExclamationCircle, FaChevronDown, FaTrash, FaEdit,
  FaExternalLinkAlt, FaUpload, FaSpinner,
} from 'react-icons/fa';

// ── Types ────────────────────────────────────────────────────────────────────

type TipoSesion = 'ordinaria' | 'extraordinaria';
type EstadoAsistencia = 'presente' | 'ausente' | 'justificado';
type TabType = 'asociacion' | 'jd';

interface Acta {
  id: number;
  fecha: string;
  tipoSesion: TipoSesion;
  urlActa: string | null;
  nombreArchivo: string | null;
  createdAt: string;
  totalAsistentes?: number;
  totalAusentes?: number;
}

interface AsistenciaActa {
  id: number;
  actaId: number;
  asociadoId: number;
  nombreAsociado: string;
  estado: EstadoAsistencia;
  justificacion: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

const ESTADO_CONFIG: Record<EstadoAsistencia, { label: string; color: string; icon: React.ReactNode }> = {
  presente: {
    label: 'Presente',
    color: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    icon: <FaCheck className="text-xs" />,
  },
  ausente: {
    label: 'Ausente',
    color: 'bg-red-100 text-red-700 border border-red-200',
    icon: <FaTimes className="text-xs" />,
  },
  justificado: {
    label: 'Justificado',
    color: 'bg-amber-100 text-amber-700 border border-amber-200',
    icon: <FaExclamationCircle className="text-xs" />,
  },
};

// ── Modal: Crear / Editar Acta ────────────────────────────────────────────────

interface ModalActaProps {
  tipo: TabType;
  acta?: Acta | null;
  onClose: () => void;
  onSaved: () => void;
}

function ModalActa({ tipo, acta, onClose, onSaved }: ModalActaProps) {
  const isEdit = !!acta;
  const apiBase = tipo === 'asociacion' ? '/api/actas/asociacion' : '/api/actas/jd';

  const [fecha, setFecha] = useState(acta?.fecha?.split('T')[0] ?? '');
  const [tipoSesion, setTipoSesion] = useState<TipoSesion>(acta?.tipoSesion ?? 'ordinaria');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(acta?.urlActa ?? null);
  const [uploadedName, setUploadedName] = useState<string | null>(acta?.nombreArchivo ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setUploadedUrl(json.url);
      setUploadedName(json.nombreArchivo);
    } catch (err: any) {
      setError(err.message ?? 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha) { setError('La fecha es requerida.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        fecha,
        tipoSesion,
        urlActa: uploadedUrl,
        nombreArchivo: uploadedName,
      };
      const res = await fetch(isEdit ? `${apiBase}/${acta!.id}` : apiBase, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar el acta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800 text-lg">
            {isEdit ? 'Editar Acta' : `Nueva Acta de ${tipo === 'asociacion' ? 'Asociación' : 'Junta Directiva'}`}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
              required
            />
          </div>

          {/* Tipo sesión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sesión *</label>
            <div className="relative">
              <select
                value={tipoSesion}
                onChange={e => setTipoSesion(e.target.value as TipoSesion)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 appearance-none pr-8"
              >
                <option value="ordinaria">Ordinaria</option>
                <option value="extraordinaria">Extraordinaria</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo del Acta</label>
            {uploadedName ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <FaFileAlt className="text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-700 truncate flex-1">{uploadedName}</span>
                <button
                  type="button"
                  onClick={() => { setUploadedUrl(null); setUploadedName(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-emerald-600 hover:text-red-500 transition-colors"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-[#003366]/40 hover:text-[#003366] transition-colors disabled:opacity-60"
              >
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                {uploading ? 'Subiendo...' : 'Seleccionar PDF o imagen'}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFile}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-1">PDF, JPG o PNG · máx. 10 MB</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-2 rounded-lg bg-[#003366] text-white text-sm font-semibold hover:bg-[#004080] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <FaSpinner className="animate-spin text-xs" />}
              {isEdit ? 'Guardar cambios' : 'Crear acta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Asistencia ─────────────────────────────────────────────────────────

interface ModalAsistenciaProps {
  tipo: TabType;
  acta: Acta;
  onClose: () => void;
  onSaved: () => void;
}

function ModalAsistencia({ tipo, acta, onClose, onSaved }: ModalAsistenciaProps) {
  const apiBase = tipo === 'asociacion'
    ? `/api/actas/asociacion/${acta.id}/asistencia`
    : `/api/actas/jd/${acta.id}/asistencia`;

  const [asistencias, setAsistencias] = useState<AsistenciaActa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Map<number, { estado: EstadoAsistencia; justificacion: string | null }>>(new Map());
  const [saving, setSaving] = useState(false);
  const [justModal, setJustModal] = useState<{ asociadoId: number; nombre: string } | null>(null);
  const [justText, setJustText] = useState('');

  useEffect(() => {
    fetch(apiBase)
      .then(r => r.json())
      .then(j => { if (j.success) setAsistencias(j.data); })
      .finally(() => setLoading(false));
  }, [apiBase]);

  function toggleEstado(a: AsistenciaActa, nuevo: EstadoAsistencia) {
    if (nuevo === 'justificado') {
      setJustText(pendingChanges.get(a.asociadoId)?.justificacion ?? a.justificacion ?? '');
      setJustModal({ asociadoId: a.asociadoId, nombre: a.nombreAsociado });
      return;
    }
    setPendingChanges(prev => {
      const next = new Map(prev);
      next.set(a.asociadoId, { estado: nuevo, justificacion: null });
      return next;
    });
  }

  function saveJustificacion() {
    if (!justModal) return;
    setPendingChanges(prev => {
      const next = new Map(prev);
      next.set(justModal.asociadoId, { estado: 'justificado', justificacion: justText || null });
      return next;
    });
    setJustModal(null);
  }

  function getEstado(a: AsistenciaActa): EstadoAsistencia {
    return pendingChanges.get(a.asociadoId)?.estado ?? a.estado;
  }

  async function guardarTodo() {
    if (pendingChanges.size === 0) { onClose(); return; }
    setSaving(true);
    try {
      await Promise.all(
        Array.from(pendingChanges.entries()).map(([asociadoId, { estado, justificacion }]) =>
          fetch(apiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asociadoId, estado, justificacion }),
          }),
        ),
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const presentes = asistencias.filter(a => getEstado(a) === 'presente').length;
  const justificados = asistencias.filter(a => getEstado(a) === 'justificado').length;
  const ausentes = asistencias.filter(a => getEstado(a) === 'ausente').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Asistencia</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatFecha(acta.fecha)} · {acta.tipoSesion === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}
              {acta.urlActa && (
                <a href={`/api/blob-download?url=${encodeURIComponent(acta.urlActa)}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#003366] hover:underline inline-flex items-center gap-1">
                  <FaExternalLinkAlt className="text-[10px]" /> Ver acta
                </a>
              )}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <FaTimes />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 border-b bg-gray-50 flex gap-4 text-sm flex-shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <FaCheck className="text-xs" /> {presentes} presentes
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 font-medium">
            <FaExclamationCircle className="text-xs" /> {justificados} justificados
          </span>
          <span className="flex items-center gap-1.5 text-red-500 font-medium">
            <FaTimes className="text-xs" /> {ausentes} ausentes
          </span>
          {pendingChanges.size > 0 && (
            <span className="ml-auto text-xs text-blue-600 font-medium">{pendingChanges.size} cambio(s) sin guardar</span>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : asistencias.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FaUsers className="text-3xl mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay miembros registrados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {asistencias.map(a => {
                const estado = getEstado(a);
                const cfg = ESTADO_CONFIG[estado];
                const justif = pendingChanges.get(a.asociadoId)?.justificacion ?? a.justificacion;
                return (
                  <div key={a.asociadoId} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.nombreAsociado}</p>
                      {estado === 'justificado' && justif && (
                        <p className="text-xs text-amber-600 truncate mt-0.5">{justif}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {(['presente', 'ausente', 'justificado'] as EstadoAsistencia[]).map(e => (
                        <button
                          key={e}
                          onClick={() => toggleEstado(a, e)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                            estado === e
                              ? cfg.color + ' shadow-sm'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {e === 'presente' && <FaCheck className="text-[10px]" />}
                          {e === 'ausente' && <FaTimes className="text-[10px]" />}
                          {e === 'justificado' && <FaExclamationCircle className="text-[10px]" />}
                          <span className="hidden sm:inline">{ESTADO_CONFIG[e].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardarTodo}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-[#003366] text-white text-sm font-semibold hover:bg-[#004080] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <FaSpinner className="animate-spin text-xs" />}
            Guardar asistencia
          </button>
        </div>
      </div>

      {/* Justificación sub-modal */}
      {justModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Justificación</h3>
            <p className="text-sm text-gray-500">{justModal.nombre}</p>
            <textarea
              value={justText}
              onChange={e => setJustText(e.target.value)}
              placeholder="Motivo de la justificación (opcional)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setJustModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveJustificacion}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ActasPage() {
  const [tab, setTab] = useState<TabType>('asociacion');
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState<Acta | null>(null);
  const [modalAsistencia, setModalAsistencia] = useState<Acta | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Acta | null>(null);

  const apiBase = tab === 'asociacion' ? '/api/actas/asociacion' : '/api/actas/jd';

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      if (json.success) setActas(json.data);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleDelete(acta: Acta) {
    setDeletingId(acta.id);
    try {
      await fetch(`${apiBase}/${acta.id}`, { method: 'DELETE' });
      await cargar();
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="actas" pageTitle="Actas" />

      <main className="flex-1 pt-14 md:pt-0 min-w-0">
        <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003366] flex items-center justify-center flex-shrink-0">
                <FaBook className="text-white text-base" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Actas</h1>
                <p className="text-xs text-gray-500">Registro de sesiones y asistencia</p>
              </div>
            </div>
            <button
              onClick={() => setModalCrear(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#004080] transition-colors shadow-sm"
            >
              <FaPlus className="text-xs" /> Nueva Acta
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-200 p-1 rounded-xl w-fit mb-6">
            {([
              { key: 'asociacion', label: 'Actas de Asociación' },
              { key: 'jd', label: 'Actas de Junta Directiva' },
            ] as { key: TabType; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-white text-[#003366] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-50">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 px-6 flex items-center gap-4">
                    <div className="h-4 w-24 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-4 w-20 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-4 w-28 rounded-full bg-gray-100 animate-pulse" />
                    <div className="ml-auto flex gap-2">
                      <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : actas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaBook className="text-4xl mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No hay actas registradas</p>
                <p className="text-sm mt-1">
                  Crea la primera acta de {tab === 'asociacion' ? 'Asociación' : 'Junta Directiva'}
                </p>
                <button
                  onClick={() => setModalCrear(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#004080] inline-flex items-center gap-2"
                >
                  <FaPlus className="text-xs" /> Nueva Acta
                </button>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_140px_110px_110px_200px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Fecha</span>
                  <span>Tipo</span>
                  <span>Presentes</span>
                  <span>Ausentes</span>
                  <span className="text-right">Acciones</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {actas.map(acta => (
                    <div
                      key={acta.id}
                      className="px-6 py-4 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{formatFecha(acta.fecha)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            acta.tipoSesion === 'ordinaria'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {acta.tipoSesion === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="text-emerald-600 font-medium">✓ {acta.totalAsistentes ?? 0} presentes</span>
                          <span className="text-red-500 font-medium">✗ {acta.totalAusentes ?? 0} ausentes</span>
                          {acta.nombreArchivo && (
                            <a href={`/api/blob-download?url=${encodeURIComponent(acta.urlActa!)}`} target="_blank" rel="noopener noreferrer" className="text-[#003366] flex items-center gap-1">
                              <FaFileAlt className="text-[10px]" /> {acta.nombreArchivo}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setModalAsistencia(acta)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003366]/8 text-[#003366] text-xs font-semibold hover:bg-[#003366]/15 transition-colors"
                          >
                            <FaUsers className="text-[10px]" /> Asistencia
                          </button>
                          <button
                            onClick={() => setModalEditar(acta)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200 transition-colors"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(acta)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs hover:bg-red-100 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid grid-cols-[1fr_140px_110px_110px_200px] gap-4 items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{formatFecha(acta.fecha)}</p>
                          {acta.nombreArchivo && (
                            <a href={`/api/blob-download?url=${encodeURIComponent(acta.urlActa!)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#003366] flex items-center gap-1 mt-0.5 hover:underline">
                              <FaFileAlt className="text-[10px]" />
                              <span className="truncate max-w-[180px]">{acta.nombreArchivo}</span>
                              <FaExternalLinkAlt className="text-[9px] flex-shrink-0" />
                            </a>
                          )}
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                          acta.tipoSesion === 'ordinaria'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {acta.tipoSesion === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}
                        </span>
                        <span className="text-sm text-emerald-600 font-semibold">{acta.totalAsistentes ?? 0}</span>
                        <span className="text-sm text-red-500 font-semibold">{acta.totalAusentes ?? 0}</span>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModalAsistencia(acta)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003366]/8 text-[#003366] text-xs font-semibold hover:bg-[#003366]/15 transition-colors"
                          >
                            <FaUsers className="text-[10px]" /> Asistencia
                          </button>
                          <button
                            onClick={() => setModalEditar(acta)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(acta)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {modalCrear && (
        <ModalActa
          tipo={tab}
          onClose={() => setModalCrear(false)}
          onSaved={() => { setModalCrear(false); cargar(); }}
        />
      )}

      {modalEditar && (
        <ModalActa
          tipo={tab}
          acta={modalEditar}
          onClose={() => setModalEditar(null)}
          onSaved={() => { setModalEditar(null); cargar(); }}
        />
      )}

      {modalAsistencia && (
        <ModalAsistencia
          tipo={tab}
          acta={modalAsistencia}
          onClose={() => setModalAsistencia(null)}
          onSaved={() => { setModalAsistencia(null); cargar(); }}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <FaTrash className="text-red-500 text-lg" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-800 text-lg">¿Eliminar acta?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Acta del {formatFecha(confirmDelete.fecha)} ({confirmDelete.tipoSesion}).
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDelete.id && <FaSpinner className="animate-spin text-xs" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
