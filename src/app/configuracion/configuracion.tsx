"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/SideBar";
import { FaUser, FaUniversalAccess, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import { useAccessibility } from "@/components/AccessibilityProvider";

export default function ConfiguracionPage() {
  const { scaleLevel, setScaleLevel } = useAccessibility();
  const [activeTab, setActiveTab] = useState<"perfil" | "accesibilidad">("perfil");

  // Profile Form State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/usuarios/me");
        const json = await res.json();
        if (res.ok && json.success) {
          setNombreCompleto(json.data.nombreCompleto);
          setEmail(json.data.email);
        } else {
          Swal.fire("Error", "No se pudo cargar el perfil", "error");
        }
      } catch (error) {
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/usuarios/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto,
          email,
          ...(password ? { password } : {}),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        Swal.fire("¡Éxito!", "Perfil actualizado correctamente", "success");
        setPassword("");
        setConfirmPassword("");
      } else {
        Swal.fire("Error", json.message || "Error al actualizar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#17609c] focus:border-transparent transition";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar pageTitle="Configuración" />

      <div className="flex-1 pt-14 md:pt-0 flex flex-col min-h-screen">
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center">
              <FaUser className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Configuración</h1>
              <p className="text-xs text-gray-400">Administra tu cuenta y preferencias visuales</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 max-w-4xl w-full mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("perfil")}
              className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "perfil"
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaUser className="inline-block mr-2" />
              Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab("accesibilidad")}
              className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "accesibilidad"
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaUniversalAccess className="inline-block mr-2" />
              Accesibilidad
            </button>
          </div>

          {activeTab === "perfil" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Información Personal</h2>
              {loading ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre Completo</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Correo Electrónico</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-gray-800 mb-4">Cambiar Contraseña (Opcional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Nueva Contraseña</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className={inputCls + " pr-10"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Dejar en blanco para no cambiar"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Confirmar Contraseña</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={inputCls}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirmar nueva contraseña"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004488] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                    >
                      <FaSave />
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "accesibilidad" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Tamaño de la Interfaz</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ajusta el tamaño global de los textos y elementos para facilitar la lectura. Los cambios se aplican al instante y se guardan en tu navegador.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["normal", "grande", "extragrande"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setScaleLevel(level)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                      scaleLevel === level
                        ? "border-[#003366] bg-[#003366]/5 shadow-sm"
                        : "border-gray-200 hover:border-[#003366]/30 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`font-bold mb-2 ${
                        scaleLevel === level ? "text-[#003366]" : "text-gray-700"
                      }`}
                      style={{
                        fontSize: level === "normal" ? "16px" : level === "grande" ? "18px" : "20px",
                      }}
                    >
                      Aa
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        scaleLevel === level ? "text-[#003366]" : "text-gray-500"
                      }`}
                    >
                      {level === "normal" ? "Normal" : level === "grande" ? "Grande" : "Extra Grande"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
