"use client";

import { useEffect, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useRouter } from "next/navigation";
import {
  FaUsers, FaUserPlus, FaChevronLeft, FaChevronRight,
  FaEye, FaEyeSlash, FaSearch, FaFilter, FaTrash
} from "react-icons/fa";
import Sidebar from "@/components/SideBar";
import Swal from "sweetalert2";

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
  rol: "admin" | "pastorGeneral" | "juntaDirectiva" | "asistenteAdministrativo";
};

const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  pastorGeneral: "Pastor General",
  juntaDirectiva: "Junta Directiva",
  asistenteAdministrativo: "Asistente Administrativo",
};

const ROL_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  pastorGeneral: "bg-amber-100 text-amber-800",
  juntaDirectiva: "bg-blue-100 text-blue-800",
  asistenteAdministrativo: "bg-emerald-100 text-emerald-800",
};

type FormErrors = {
  nombreCompleto?: string;
  username?: string;
  email?: string;
  password?: string;
};

function validarCampo(campo: keyof FormErrors, valor: string): string | undefined {
  switch (campo) {
    case "nombreCompleto":
      if (!valor.trim()) return "El nombre completo es obligatorio.";
      if (valor.trim().length < 3) return "Debe tener al menos 3 caracteres.";
      if (valor.length > 255) return "No puede superar los 255 caracteres.";
      return undefined;
    case "username":
      if (!valor.trim()) return "El nombre de usuario es obligatorio.";
      if (valor.trim().length < 3) return "Debe tener al menos 3 caracteres.";
      if (valor.length > 50) return "No puede superar los 50 caracteres.";
      if (!/^[a-zA-Z0-9_]+$/.test(valor)) return "Solo se permiten letras, números y guión bajo ( _ ).";
      return undefined;
    case "email":
      if (!valor.trim()) return "El correo electrónico es obligatorio.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return "Ingresa un correo válido, por ejemplo: nombre@correo.com";
      if (valor.length > 255) return "El correo es demasiado largo.";
      return undefined;
    case "password":
      if (!valor) return "La contraseña es obligatoria.";
      if (valor.length < 6) return "Debe tener al menos 6 caracteres.";
      return undefined;
  }
}

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
    nombreCompleto: "", username: "", email: "", password: "", rol: "juntaDirectiva",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [enviando, setEnviando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    setMensaje("");
    try {
      const res = await fetch('/api/usuarios');
      const json = await res.json();
      if (!res.ok || !json.success) { setMensaje(json.message || "No se pudo cargar la lista de usuarios."); setMensajeOk(false); return; }
      setUsuarios(json.data || []);
    } catch { setMensaje("No hay conexión con el servidor. Intenta de nuevo."); setMensajeOk(false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);
  useAutoRefresh(cargarUsuarios);

  // Marca el campo como tocado y valida en cada tecla
  const handleChange = (campo: keyof FormErrors, valor: string) => {
    setFormState(p => ({ ...p, [campo]: valor }));
    setTouched(p => ({ ...p, [campo]: true }));
    setFormErrors(p => ({ ...p, [campo]: validarCampo(campo, valor) }));
  };

  // Marca como tocado al salir (captura campos que el usuario dejó vacíos sin escribir)
  const handleBlur = (campo: keyof FormErrors) => {
    setTouched(p => ({ ...p, [campo]: true }));
    setFormErrors(p => ({ ...p, [campo]: validarCampo(campo, formState[campo]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar todos los campos y marcarlos como tocados
    const campos: (keyof FormErrors)[] = ["nombreCompleto", "username", "email", "password"];
    const errores: FormErrors = {};
    campos.forEach(c => { errores[c] = validarCampo(c, formState[c]); });
    setFormErrors(errores);
    setTouched({ nombreCompleto: true, username: true, email: true, password: true });
    if (Object.values(errores).some(Boolean)) return;

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
        // Mapear errores del servidor a mensajes amigables
        const serverMsg: string = json.message || "";
        let msgFriendly = "Ocurrió un problema al crear el usuario. Intenta de nuevo.";
        if (serverMsg.includes("username") || serverMsg.toLowerCase().includes("usuario")) {
          msgFriendly = "Ese nombre de usuario ya está en uso. Elige otro.";
        } else if (serverMsg.includes("email") || serverMsg.toLowerCase().includes("correo")) {
          msgFriendly = "Ese correo electrónico ya está registrado. Usa otro.";
        }
        setMensaje(msgFriendly); setMensajeOk(false); return;
      }
      setMensaje("¡Usuario creado correctamente!"); setMensajeOk(true);
      setFormState({ nombreCompleto: "", username: "", email: "", password: "", rol: "juntaDirectiva" });
      setFormErrors({});
      setTouched({});
      setShowForm(false);
      setCurrentPage(1);
      await cargarUsuarios();
    } catch { setMensaje("No hay conexión con el servidor. Intenta de nuevo."); setMensajeOk(false); }
    finally { setEnviando(false); }
  };

  const handleEliminar = (id: number, nombre: string) => {
    Swal.fire({
      title: 'Eliminar Usuario',
      text: `¿Qué deseas hacer con el usuario ${nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#d33',
      denyButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar Permanentemente',
      denyButtonText: 'Desactivar (Soft Delete)',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed || result.isDenied) {
        const isHardDelete = result.isConfirmed;
        try {
          const res = await fetch(`/api/usuarios/${id}?hardDelete=${isHardDelete}`, {
            method: "DELETE"
          });
          const json = await res.json();
          if (res.ok && json.success) {
            Swal.fire('¡Listo!', json.message, 'success');
            cargarUsuarios();
          } else {
            Swal.fire('Error', json.message || 'Error al eliminar el usuario', 'error');
          }
        } catch (error) {
          Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
        }
      }
    });
  };

  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || u.nombreCompleto.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRol = !rolFiltro || u.rol === rolFiltro;
    return matchQ && matchRol;
  });

  const totalPages = Math.max(1, Math.ceil(filtrados.length / itemsPerPage));
  const paginaActual = Math.min(currentPage, totalPages);
  const paginados = filtrados.slice((paginaActual - 1) * itemsPerPage, paginaActual * itemsPerPage);

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
                <button onClick={() => { setShowForm(false); setFormErrors({}); setTouched({}); }} className="text-white/70 hover:text-white transition text-sm">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre completo *</label>
                  <input
                    type="text"
                    value={formState.nombreCompleto}
                    onChange={e => handleChange("nombreCompleto", e.target.value)}
                    onBlur={() => handleBlur("nombreCompleto")}
                    className={inputCls + (touched.nombreCompleto && formErrors.nombreCompleto ? " border-red-400 focus:ring-red-300 focus:border-red-400" : "")}
                    maxLength={255}
                    placeholder="Juan Pérez López"
                  />
                  {touched.nombreCompleto && formErrors.nombreCompleto && <p className="mt-1 text-xs text-red-600">{formErrors.nombreCompleto}</p>}
                </div>
                <div>
                  <label className={labelCls}>Nombre de usuario *</label>
                  <input
                    type="text"
                    value={formState.username}
                    onChange={e => handleChange("username", e.target.value)}
                    onBlur={() => handleBlur("username")}
                    className={inputCls + (touched.username && formErrors.username ? " border-red-400 focus:ring-red-300 focus:border-red-400" : "")}
                    maxLength={50}
                    placeholder="juan_perez"
                  />
                  {touched.username && formErrors.username && <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>}
                </div>
                <div>
                  <label className={labelCls}>Correo electrónico *</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={e => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={inputCls + (touched.email && formErrors.email ? " border-red-400 focus:ring-red-300 focus:border-red-400" : "")}
                    maxLength={255}
                    placeholder="juan@ejemplo.com"
                  />
                  {touched.email && formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
                </div>
                <div>
                  <label className={labelCls}>Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formState.password}
                      onChange={e => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      className={inputCls + " pr-10" + (touched.password && formErrors.password ? " border-red-400 focus:ring-red-300 focus:border-red-400" : "")}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                  {touched.password && formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Rol *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["juntaDirectiva", "pastorGeneral", "asistenteAdministrativo", "admin"] as const).map(r => (
                      <label key={r} className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition ${formState.rol === r ? "border-[#003366] bg-[#003366]/5" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="rol" value={r} checked={formState.rol === r} onChange={() => setFormState(p => ({ ...p, rol: r }))} className="sr-only" />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROL_COLORS[r]}`}>{ROL_LABELS[r]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); setTouched({}); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
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
                <input type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }} placeholder="Buscar por nombre, usuario o correo…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17609c]" />
              </div>
              <select value={rolFiltro} onChange={e => { setRolFiltro(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#17609c]">
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="pastorGeneral">Pastor General</option>
                <option value="juntaDirectiva">Junta Directiva</option>
                <option value="asistenteAdministrativo">Asistente Administrativo</option>
              </select>
              <div className="flex items-center gap-2">
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} aria-label="Filas por página" className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}/pág.</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total", value: usuarios.length, color: "bg-[#003366]" },
              { label: "Admins", value: usuarios.filter(u => u.rol === "admin").length, color: "bg-purple-600" },
              { label: "Pastores", value: usuarios.filter(u => u.rol === "pastorGeneral").length, color: "bg-amber-500" },
              { label: "Junta Directiva", value: usuarios.filter(u => u.rol === "juntaDirectiva").length, color: "bg-blue-500" },
              { label: "Asistentes", value: usuarios.filter(u => u.rol === "asistenteAdministrativo").length, color: "bg-emerald-500" },
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
              {!loading && filtrados.length > 0 && <span className="text-xs text-gray-400 font-normal ml-1">(pág. {paginaActual}/{totalPages})</span>}
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
                        {["ID", "Nombre completo", "Usuario", "Correo", "Rol", "Estado", "Acciones"].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginados.map(u => (
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
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleEliminar(u.id, u.nombreCompleto)} 
                              className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-colors shadow-sm" 
                              title="Eliminar usuario"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginados.map(u => (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{u.nombreCompleto}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">@{u.username}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.estado === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {u.estado === 1 ? "Activo" : "Inactivo"}
                          </span>
                          <button 
                            onClick={() => handleEliminar(u.id, u.nombreCompleto)} 
                            className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-colors shadow-sm"
                            title="Eliminar usuario"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
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
            {!loading && filtrados.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Mostrando {Math.min((paginaActual - 1) * itemsPerPage + 1, filtrados.length)}–{Math.min(paginaActual * itemsPerPage, filtrados.length)} de {filtrados.length} usuarios
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">Página {paginaActual} de {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={paginaActual === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
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