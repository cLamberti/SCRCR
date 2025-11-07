"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaClipboardCheck, FaHome, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

type Evento = {
  id: number;
  nombre: string;
  fecha: string;        
  hora?: string | null;
  activo?: boolean;
};

type Persona = {
  id: number;
  nombreCompleto?: string;
  nombre_completo?: string;
};

type ApiList<T> =
  | { success?: boolean; data?: T[]; pagination?: any }
  | T[];

type ApiPost<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  issues?: { field: string; message: string }[];
};

type BulkResponse = {
  success: boolean;
  message?: string;
  inserted?: number;
  duplicated?: number;
  errors?: string[];
};

function fmtFecha(fechaISO: string) {
  try {
    const [y, m, d] = fechaISO.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString();
  } catch {
    return fechaISO;
  }
}
const todayYMD = (() => {
  const t = new Date();
  const yyyy = t.getFullYear();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
})();

export default function RegistroAsistenciaPage() {
  const router = useRouter();
  const { usuario, loading } = useAuth?.() ?? { usuario: null, loading: false };

  // Eventos activos
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState<string | null>(null);
  const [eventoId, setEventoId] = useState<number>(0);

  // Personas  para checkboxes
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [errorPersonas, setErrorPersonas] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  // Envío y feedback
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  // Implementar proteccion de ruta
  useEffect(() => {
    if (!loading && !usuario) {
    }
  }, [loading, usuario, router]);


  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingEventos(true);
        setErrorEventos(null);
        const res = await fetch("/api/eventos?activo=true&page=1&limit=200", {
          cache: "no-store",
        });
        const json: ApiList<Evento> = await res.json();
        const list = Array.isArray(json) ? json : (json.data ?? []);
        if (!cancel) setEventos(list ?? []);
      } catch (e) {
        if (!cancel) setErrorEventos("No se pudo obtener la lista de eventos.");
      } finally {
        if (!cancel) setLoadingEventos(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);


  useEffect(() => {
    let cancel = false;

    async function fetchFrom(url: string) {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j: ApiList<Persona> = await r.json();
      return Array.isArray(j) ? j : (j.data ?? []);
    }

    (async () => {
      try {
        setLoadingPersonas(true);
        setErrorPersonas(null);

        let list: Persona[] = [];
        try {
          list = await fetchFrom("/api/congregados");
        } catch {
          list = await fetchFrom("/api/asociados");
        }

        if (!cancel) setPersonas(list ?? []);
      } catch (e) {
        if (!cancel)
          setErrorPersonas("No se pudo cargar la lista de personas.");
      } finally {
        if (!cancel) setLoadingPersonas(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);


  const canSubmit = useMemo(
    () => eventoId > 0 && seleccionados.size > 0,
    [eventoId, seleccionados]
  );

  const personasFiltradas = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return personas;
    return personas.filter((p) =>
      (p.nombreCompleto ?? p.nombre_completo ?? "")
        .toLowerCase()
        .includes(f)
    );
  }, [filtro, personas]);


  function togglePersona(id: number) {
    setSeleccionados((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function toggleAllVisible(check: boolean) {
    setSeleccionados((prev) => {
      const copy = new Set(prev);
      for (const p of personasFiltradas) {
        if (check) copy.add(p.id);
        else copy.delete(p.id);
      }
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setServerMsg(null);
    setServerOk(null);

    const persona_ids = Array.from(seleccionados);
    const fecha = todayYMD;

    try {
  
      const bulkRes = await fetch("/api/asistencia/registro-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento_id: eventoId,
          persona_ids,
          fecha,
        }),
      });

      if (bulkRes.ok) {
        const bulkJson: BulkResponse = await bulkRes.json();
        setServerOk(true);
        setServerMsg(
          bulkJson.message ||
            `Asistencia registrada: ${bulkJson.inserted ?? persona_ids.length
            } persona(s).`
        );
        setSeleccionados(new Set());
        return;
      }

      if (bulkRes.status === 404) {
        let okCount = 0;
        let dupCount = 0;
        let errCount = 0;

        for (const pid of persona_ids) {
          const r = await fetch("/api/asistencia/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_asociado: pid, 
              id_actividad: eventoId,  
              fecha_asistencia: fecha,
            }),
          });

          if (r.ok) okCount++;
          else if (r.status === 409) dupCount++;
          else errCount++;
        }

        setServerOk(errCount === 0);
        setServerMsg(
          `Resultado: ${okCount} registrados, ${dupCount} duplicados, ${errCount} con error.`
        );
        if (okCount > 0) setSeleccionados(new Set());
        return;
      }

 
      const errJson = (await bulkRes.json().catch(() => ({}))) as any;
      const msg =
        errJson?.errors?.join(" | ") ||
        errJson?.message ||
        "No se pudo registrar la asistencia.";
      setServerOk(false);
      setServerMsg(msg);
    } catch (err) {
      setServerOk(false);
      setServerMsg("Error de red o del servidor al registrar la asistencia.");
    } finally {
      setSubmitting(false);
    }
  }

  const nombrePersona = (p: Persona) =>
    p.nombreCompleto ?? p.nombre_completo ?? "Sin nombre";

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#0f172a]">
      {/* Header */}
      <header className="bg-[#003366] text-white">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaClipboardCheck className="text-2xl" />
            <div>
              <h1 className="text-xl font-bold">Registro de Asistencia</h1>
              <p className="text-sm opacity-90">
                Selecciona un evento y marca los asistentes
              </p>
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

      {/* Body */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#003366] hover:underline"
          >
            <FaArrowLeft /> Volver
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#003366] mb-1">
            Registrar asistencia por evento
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Elige el evento y marca los congregados que asistieron.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evento
              </label>
              {loadingEventos ? (
                <div className="text-gray-600 text-sm">Cargando eventos…</div>
              ) : errorEventos ? (
                <div className="text-red-600 text-sm">{errorEventos}</div>
              ) : (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
                  value={eventoId}
                  onChange={(e) => setEventoId(Number(e.target.value))}
                  required
                >
                  <option value={0}>Seleccione un evento…</option>
                  {eventos.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.nombre} — {fmtFecha(ev.fecha)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Buscador de personas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar por nombre…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
              />
            </div>

            {/* Lista de checkboxes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Congregados
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    className="underline text-[#17609c]"
                    onClick={() => toggleAllVisible(true)}
                  >
                    Seleccionar visibles
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    className="underline text-[#17609c]"
                    onClick={() => toggleAllVisible(false)}
                  >
                    Quitar visibles
                  </button>
                </div>
              </div>

              {loadingPersonas ? (
                <div className="text-gray-600 text-sm">Cargando lista…</div>
              ) : errorPersonas ? (
                <div className="text-red-600 text-sm">{errorPersonas}</div>
              ) : (
                <div className="max-h-80 overflow-auto border rounded-md p-3">
                  {personasFiltradas.length === 0 ? (
                    <div className="text-sm text-gray-500">Sin resultados.</div>
                  ) : (
                    <ul className="space-y-2">
                      {personasFiltradas.map((p) => {
                        const checked = seleccionados.has(p.id);
                        return (
                          <li key={p.id} className="flex items-center gap-3">
                            <input
                              id={`p-${p.id}`}
                              type="checkbox"
                              className="h-4 w-4"
                              checked={checked}
                              onChange={() => togglePersona(p.id)}
                            />
                            <label
                              htmlFor={`p-${p.id}`}
                              className="text-sm text-gray-800 select-none"
                            >
                              {nombrePersona(p)}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Feedback */}
            {serverMsg && (
              <div
                className={`px-4 py-3 rounded-md text-sm border ${
                  serverOk
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {serverMsg}
              </div>
            )}

            {/* Submit */}
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
      </main>
    </div>
  );
}
