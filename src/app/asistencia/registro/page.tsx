"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaCalendarCheck,
  FaHome,
  FaArrowLeft,
  FaSearch,
  FaCheckSquare,
  FaRegSquare,
} from "react-icons/fa";

type Evento = {
  id: number;
  nombre: string;
};

type Persona = {
  id: number;
  nombreCompleto?: string;
  nombre_completo?: string;
};

type ApiListResponse<T> = { success?: boolean; data?: T[] } | T[];

type AsistenciaResponse = {
  id: number;
  id_asociado: number;
  id_actividad: number;
  fecha_asistencia: string;
  fecha_registro: string;
};

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
}

export default function RegistroAsistenciaPage() {
  const router = useRouter();

  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState<number>(0);
  const [cargandoEventos, setCargandoEventos] = useState(true);


  const [personas, setPersonas] = useState<Persona[]>([]);
  const [cargandoPersonas, setCargandoPersonas] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  // Eventos, vacio por ahora
  useEffect(() => {
    let cancel = false;
    (async () => {
      setCargandoEventos(true);
      try {
        const list: Evento[] = []; 
        if (!cancel) setEventos(list);
      } catch {
        if (!cancel) setEventos([]);
      } finally {
        if (!cancel) setCargandoEventos(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);


  useEffect(() => {
    let cancel = false;
    (async () => {
      setCargandoPersonas(true);
      setErrorCarga(null);
      try {
        let res = await fetch("/api/congregados", { cache: "no-store" });
        if (!res.ok) throw new Error("fallback");
        let json: ApiListResponse<Persona> = await res.json();
        let list = Array.isArray(json) ? json : (json.data ?? []);
        if (!list || list.length === 0) throw new Error("fallback");
        if (!cancel) setPersonas(list);
      } catch {
        try {
          const res2 = await fetch("/api/asociados", { cache: "no-store" });
          const json2: ApiListResponse<Persona> = await res2.json();
          const list2 = Array.isArray(json2) ? json2 : (json2.data ?? []);
          if (!cancel) setPersonas(list2 ?? []);
        } catch {
          if (!cancel) {
            setErrorCarga("No se pudo cargar la lista de congregados.");
            setPersonas([]);
          }
        }
      } finally {
        if (!cancel) setCargandoPersonas(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const nombrePersona = (p: Persona) =>
    p.nombreCompleto ?? p.nombre_completo ?? "";

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter((p) => nombrePersona(p).toLowerCase().includes(q));
  }, [busqueda, personas]);

  const totalSeleccionados = seleccionados.size;

  function toggleUno(id: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (totalSeleccionados === filtrados.length) {
      setSeleccionados((prev) => {
        const idsVisibles = new Set(filtrados.map((p) => p.id));
        const next = new Set(prev);
        idsVisibles.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        filtrados.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);

    if (!eventoId) {
      setMsg("Selecciona un evento para registrar asistencia.");
      setOk(false);
      return;
    }
    if (seleccionados.size === 0) {
      setMsg("Selecciona al menos un congregado.");
      setOk(false);
      return;
    }

    setEnviando(true);
    const fecha = todayStr();
    const ids = Array.from(seleccionados);

    try {
      const results = await Promise.allSettled(
        ids.map((id_asociado) =>
          fetch("/api/asistencia/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_asociado,
              id_actividad: eventoId,
              fecha_asistencia: fecha,
            }),
          }).then(async (r) => {
            const js = (await r.json()) as { success?: boolean; message?: string };
            return { ok: r.ok, status: r.status, body: js };
          })
        )
      );

      const okCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok
      ).length;
      const dupCount = results.filter(
        (r) =>
          r.status === "fulfilled" &&
          !r.value.ok &&
          r.value.status === 409
      ).length;
      const failCount = ids.length - okCount - dupCount;

      let resumen = `Registrados: ${okCount}`;
      if (dupCount) resumen += ` | Duplicados: ${dupCount}`;
      if (failCount) resumen += ` | Fallidos: ${failCount}`;

      setMsg(`Registro completado. ${resumen}`);
      setOk(okCount > 0 && failCount === 0);
      if (okCount === ids.length) setSeleccionados(new Set());
    } catch {
      setMsg("Error de red/servidor al registrar asistencias.");
      setOk(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#0f172a]">
      {/* Header */}
      <header className="bg-[#003366] text-white">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCalendarCheck className="text-2xl" />
            <div>
              <h1 className="text-xl font-bold">Registro de Asistencia</h1>
              <p className="text-sm opacity-90">
                Selecciona un evento y marca los congregados que asistieron
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-white/60 px-3 py-2 rounded hover:bg-white hover:text-[#003366] transition"
          >
            <FaHome /> Inicio
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[#003366] hover:underline mb-6"
        >
          <FaArrowLeft /> Volver
        </button>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        >
          {/* Evento */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evento
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
              value={eventoId}
              onChange={(e) => setEventoId(Number(e.target.value))}
              disabled={cargandoEventos || eventos.length === 0}
            >
              <option value={0}>
                {cargandoEventos
                  ? "Cargando eventos…"
                  : eventos.length === 0
                  ? "No hay eventos disponibles"
                  : "Seleccione un evento…"}
              </option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda y Seleccionar todos */}
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar congregado…"
                className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]"
              />
            </div>
            <button
              type="button"
              onClick={toggleTodos}
              className="inline-flex items-center gap-2 text-sm border px-3 py-2 rounded hover:bg-gray-50"
              disabled={cargandoPersonas || personas.length === 0}
            >
              {filtrados.length > 0 && totalSeleccionados === filtrados.length ? (
                <FaCheckSquare />
              ) : (
                <FaRegSquare />
              )}
              {filtrados.length > 0 && totalSeleccionados === filtrados.length
                ? "Deseleccionar"
                : "Seleccionar"}{" "}
              {filtrados.length > 0 ? `(${filtrados.length})` : ""}
            </button>
          </div>

          {/* Lista de congregados */}
          <div className="rounded border border-gray-200 max-h-[420px] overflow-auto">
            {cargandoPersonas ? (
              <div className="p-4 text-gray-600 text-sm">
                Cargando congregados…
              </div>
            ) : errorCarga ? (
              <div className="p-4 text-red-600 text-sm">{errorCarga}</div>
            ) : filtrados.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">
                {personas.length === 0
                  ? "No hay congregados para listar."
                  : "No hay coincidencias para la búsqueda."}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtrados.map((p) => {
                  const checked = seleccionados.has(p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between p-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() => toggleUno(p.id)}
                        />
                        <span className="text-sm">{nombrePersona(p)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* feedback */}
          {msg && (
            <div
              className={`mt-4 px-4 py-3 rounded-md text-sm border ${
                ok
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-yellow-50 text-yellow-800 border-yellow-200"
              }`}
            >
              {msg}
            </div>
          )}

          {/* acciones */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={enviando || eventoId === 0 || seleccionados.size === 0}
              className={`px-5 py-2 rounded-md text-white transition ${
                enviando || eventoId === 0 || seleccionados.size === 0
                  ? "bg-[#17609c]/50 cursor-not-allowed"
                  : "bg-[#17609c] hover:bg-[#0f4c7a]"
              }`}
            >
              {enviando ? "Registrando…" : "Registrar asistencia"}
            </button>
          </div>
        </form>

      </main>
    </div>
  );
}
