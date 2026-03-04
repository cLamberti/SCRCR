"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUsers, FaUserPlus, FaChevronLeft, FaChevronRight,
  FaEye, FaEyeSlash, FaSearch, FaFilter,
} from "react-icons/fa";
import Sidebar from "@/components/SideBar";

type UsuarioRow = {
  id: number;
  nombreCompleto: string;
  username: string;
  email: string;
  rol: string;
  estado: number;
};

type FormState = {
  nombreCompleto: string;
  username: string;
  email: string;
  password: string;
  rol: "admin" | "tesorero" | "pastorGeneral";
};

const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  tesorero: "Tesorero",
  pastorGeneral: "Pastor General",
};

const ROL_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  tesorero: "bg-blue-100 text-blue-800",
  pastorGeneral: "bg-amber-100 text-amber-800",
};

export default function GestionUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeOk, setMensajeOk] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");

  const [formState, setFormState] = useState<FormState>({
    nombreCompleto: "", username: "", email: "", password: "", rol: "tesorero",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const cargarUsuarios = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    setMensaje("");
    try {
      const res = await fetch(`/api/usuarios?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (!res.ok || !json.success) { setMensaje(json.message || "Error al obtener usuarios"); setMensajeOk(false); return; }
      setUsuarios(json.data || []);
      if (json.pagination) { setCurrentPage(json.pagination.page); setTotalPages(json.pagination.totalPages); setTotalItems(json.pagination.total); }
    } catch { setMensaje("Error de conexión."); setMensajeOk(false); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarUsuarios(); }, []);
  useEffect(() => { cargarUsuarios(currentPage, itemsPerPage); }, [currentPage, itemsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.errors ? Object.values(json.errors).flat().join(" ") : json.message || "Error al crear el usuario";
        setMensaje(String(errMsg)); setMensajeOk(false); return;
      }
      setMensaje("Usuario creado exitosamente."); setMensajeOk(true);
      setFormState({ nombreCompleto: "", username: "", email: "", password: "", rol: "tesorero" });
      setShowForm(false);
      setCurrentPage(1);
      await cargarUsuarios(1, itemsPerPage);
    } catch { setMensaje("Error de conexión."); setMensajeOk(false); }
    finally { setEnviando(false); }
  };

  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || u.nombreCompleto.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRol = !rolFiltro || u.rol === rolFiltro;
    return matchQ && matchRol;
  });

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#17609c] focus:border-transparent transition";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar pageTitle="Gestión de Usuarios" />

      <div className="flex-1 pt-14 md:pt-0 flex flex-col min-h-screen">
        {/* Header */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center">
              <FaUsers className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-xs text-gray-400">Administra los accesos al sistema</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setMensaje(""); }}
            className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <FaUserPlus className="text-xs" />
            Nuevo usuario
          </button>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-5">
          {/* Mensaje */}
          {mensaje && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${mensajeOk ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
              {mensaje}
            </div>
          )}

          {/* Form crear */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaUserPlus className="text-white text-sm" />
                  <h2 className="text-white font-semibold text-sm">Nuevo usuario</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white transition text-sm">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre completo *</label>
                  <input type="text" value={formState.nombreCompleto} onChange={e => setFormState(p => ({ ...p, nombreCompleto: e.target.value }))} className={inputCls} required placeholder="Juan Pérez López" />
                </div>
                <div>
                  <label className={labelCls}>Nombre de usuario *</label>
                  <input type="text" value={formState.username} onChange={e => setFormState(p => ({ ...p, username: e.target.value }))} className={inputCls} required placeholder="juan_perez" />
                </div>
                <div>
                  <label className={labelCls}>Correo electrónico *</label>
                  <input type="email" value={formState.email} onChange={e => setFormState(p => ({ ...p, email: e.target.value }))} className={inputCls} required placeholder="juan@ejemplo.com" />
                </div>
                <div>
                  <label className={labelCls}>Contraseña *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={formState.password} onChange={e => setFormState(p => ({ ...p, password: e.target.value }))} className={inputCls + " pr-10"} required placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Rol *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["tesorero", "pastorGeneral", "admin"] as const).map(r => (
                      <label key={r} className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition ${formState.rol === r ? "border-[#003366] bg-[#003366]/5" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="rol" value={r} checked={formState.rol === r} onChange={() => setFormState(p => ({ ...p, rol: r }))} className="sr-only" />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROL_COLORS[r]}`}>{ROL_LABELS[r]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                  <button type="submit" disabled={enviando} className="px-5 py-2 text-sm font-semibold text-white bg-[#17609c] hover:bg-[#0f4c7a] disabled:opacity-50 rounded-lg transition">
                    {enviando ? "Creando..." : "Crear usuario"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, usuario o correo…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17609c]" />
              </div>
              <select value={rolFiltro} onChange={e => setRolFiltro(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]">
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="tesorero">Tesorero</option>
                <option value="pastorGeneral">Pastor General</option>
              </select>
              <div className="flex items-center gap-2">
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}/pág.</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: totalItems, color: "bg-[#003366]" },
              { label: "Admins", value: usuarios.filter(u => u.rol === "admin").length, color: "bg-purple-600" },
              { label: "Pastores", value: usuarios.filter(u => u.rol === "pastorGeneral").length, color: "bg-amber-500" },
              { label: "Tesoreros", value: usuarios.filter(u => u.rol === "tesorero").length, color: "bg-blue-500" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`w-8 h-1 ${stat.color} rounded-full mb-2`} />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">
                {loading ? "Cargando..." : `${filtrados.length} usuario${filtrados.length !== 1 ? "s" : ""}`}
              </span>
              <button onClick={() => { setShowForm(v => !v); setMensaje(""); }} className="md:hidden inline-flex items-center gap-1.5 bg-[#003366] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <FaUserPlus /> Nuevo
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Cargando usuarios...</div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center">
                <FaUsers className="mx-auto text-gray-300 text-3xl mb-3" />
                <p className="text-gray-500 text-sm">No hay usuarios para mostrar.</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["ID", "Nombre completo", "Usuario", "Correo", "Rol", "Estado"].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtrados.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-gray-400 text-xs font-mono">{u.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{u.nombreCompleto}</td>
                          <td className="px-6 py-4 text-gray-600 font-mono text-xs">@{u.username}</td>
                          <td className="px-6 py-4 text-gray-600 text-xs">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROL_COLORS[u.rol] || "bg-gray-100 text-gray-600"}`}>
                              {ROL_LABELS[u.rol] || u.rol}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.estado === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.estado === 1 ? "bg-green-500" : "bg-red-500"}`} />
                              {u.estado === 1 ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filtrados.map(u => (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{u.nombreCompleto}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">@{u.username}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.estado === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {u.estado === 1 ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{u.email}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROL_COLORS[u.rol] || "bg-gray-100 text-gray-600"}`}>
                        {ROL_LABELS[u.rol] || u.rol}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Paginación */}
            {!loading && totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Mostrando {filtrados.length} de {totalItems} usuarios
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">Página {currentPage} de {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}