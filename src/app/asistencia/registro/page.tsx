"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaClipboardCheck, FaHome, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext"; 

type Asociado = {
  id: number;
  nombreCompleto?: string;     
  nombre_completo?: string;    
};

type ApiListResponse<T> =
  | { success?: boolean; data?: T[] }
  | T[];

type ApiPostResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  issues?: { field: string; message: string }[];
};

type RegistroAsistenciaRequest = {
  id_asociado: number;
  id_actividad: number;
  fecha_asistencia: string; // YYYY-MM-DD
};

type AsistenciaResponse = {
  id: number;
  id_asociado: number;
  id_actividad: number;
  fecha_asistencia: string;
  fecha_registro: string;
};

export default function RegistroAsistenciaPage() {
  const router = useRouter();
  const { usuario, loading } = useAuth?.() ?? { usuario: null, loading: false };


  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loadingAsociados, setLoadingAsociados] = useState(true);
  const [errorAsociados, setErrorAsociados] = useState<string | null>(null);

  const today = (() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [form, setForm] = useState<RegistroAsistenciaRequest>({
    id_asociado: 0,
    id_actividad: 1, 
    fecha_asistencia: today,
  });

  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<boolean | null>(null);


  useEffect(() => {
    if (!loading && !usuario) {
      //Para proteger la ruta (Proximamente...)
    }
  }, [loading, usuario, router]);


  useEffect(() => {
    let cancelled = false;
    async function fetchAsociados() {
      setLoadingAsociados(true);
      setErrorAsociados(null);
      try {
        const res = await fetch("/api/asociados", { cache: "no-store" });
        const json: ApiListResponse<Asociado> = await res.json();
        const list = Array.isArray(json) ? json : (json.data ?? []);
        if (!cancelled) {
          setAsociados(list ?? []);
        }
      } catch (e) {
        if (!cancelled) setErrorAsociados("No se pudo cargar la lista de asociados.");
      } finally {
        if (!cancelled) setLoadingAsociados(false);
      }
    }
    fetchAsociados();
    return () => { cancelled = true; };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.id_asociado > 0 &&
      form.id_actividad > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(form.fecha_asistencia)
    );
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setServerMessage(null);
    setServerSuccess(null);

    try {
      const res = await fetch("/api/asistencia/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json: ApiPostResponse<AsistenciaResponse> = await res.json();

      const msg =
        json.message ??
        (json.success ? "Asistencia registrada correctamente." : "No se pudo registrar la asistencia.");

      setServerMessage(msg);
      setServerSuccess(!!json.success);

      if (json.success) {
        setForm((prev) => ({ ...prev, id_asociado: 0, id_actividad: 1 }));
      }
    } catch (err) {
      setServerMessage("Error de red o del servidor al registrar la asistencia.");
      setServerSuccess(false);
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = (a: Asociado) => a.nombreCompleto ?? a.nombre_completo ?? `Asociado ${a.id}`;

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#0f172a]">
      {/* Encabezado tipo “módulo” */}
      <header className="bg-[#003366] text-white">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaClipboardCheck className="text-2xl" />
            <div>
              <h1 className="text-xl font-bold">Registro de Asistencia</h1>
              <p className="text-sm opacity-90">Marca la asistencia de congregados y asociados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-white/60 px-3 py-2 rounded hover:bg-white hover:text-[#003366] transition"
            >
              <FaHome /> Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#003366] hover:underline"
          >
            <FaArrowLeft /> Volver
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto border border-gray-200">
          <h2 className="text-lg font-semibold text-[#003366] mb-1">Nueva asistencia</h2>
          <p className="text-sm text-gray-500 mb-6">
            Completa el formulario y registra la asistencia para una actividad específica.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Asociado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asociado
              </label>

              {loadingAsociados ? (
                <div className="text-gray-600 text-sm">Cargando asociados…</div>
              ) : errorAsociados ? (
                <div className="text-red-600 text-sm">{errorAsociados}</div>
              ) : (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                  value={form.id_asociado}
                  onChange={(e) => setForm((f) => ({ ...f, id_asociado: Number(e.target.value) }))}
                  required
                >
                  <option value={0}>Seleccione un asociado…</option>
                  {asociados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {displayName(a)} (ID: {a.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actividad (por ahora numérica; luego se reemplaza por catálogo) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de Actividad
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                value={form.id_actividad}
                onChange={(e) => setForm((f) => ({ ...f, id_actividad: Number(e.target.value) }))}
                placeholder="Ej. 1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                *En otro sprint podemos mostrar aquí un selector de eventos/actividades.
              </p>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de asistencia
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                value={form.fecha_asistencia}
                onChange={(e) => setForm((f) => ({ ...f, fecha_asistencia: e.target.value }))}
                required
              />
            </div>

            {/* Feedback del servidor */}
            {serverMessage && (
              <div
                className={`px-4 py-3 rounded-md text-sm border ${
                  serverSuccess
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {serverMessage}
              </div>
            )}

            {/* Botón enviar */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={`px-5 py-2 rounded-md text-white transition ${
                  !canSubmit || submitting
                    ? "bg-[#17609c]/50 cursor-not-allowed"
                    : "bg-[#17609c] hover:bg-[#0f4c7a]"
                }`}
              >
                {submitting ? "Registrando…" : "Registrar asistencia"}
              </button>
            </div>
          </form>
        </div>

        {/* Notas técnicas */}
        <div className="max-w-3xl mx-auto mt-6 text-xs text-gray-500">
          <p>
            Esta página consulta <code>/api/asociados</code> y envía el POST a{" "}
            <code>/api/asistencia/registro</code> con el cuerpo:{" "}
            <code>{`{ id_asociado, id_actividad, fecha_asistencia }`}</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
