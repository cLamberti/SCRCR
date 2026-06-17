"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/SideBar";
import {
  FaUser, FaUniversalAccess, FaSave, FaEye, FaEyeSlash,
  FaPalette, FaMoon, FaSun, FaFont, FaAdjust, FaBolt,
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  useAccessibility,
  type ColorTheme, type DisplayMode, type ScaleLevel, type FontFamily,
} from "@/components/AccessibilityProvider";

type Tab = "perfil" | "apariencia" | "accesibilidad";

// ── Color themes ─────────────────────────────────────────────────────────────

const COLOR_THEMES: { id: ColorTheme; label: string; sidebar: string; accent: string }[] = [
  { id: 'navy',   label: 'Azul Naval',     sidebar: '#003366', accent: '#003366' },
  { id: 'sky',    label: 'Azul Cielo',     sidebar: '#075985', accent: '#0284c7' },
  { id: 'green',  label: 'Verde',          sidebar: '#166534', accent: '#15803d' },
  { id: 'violet', label: 'Violeta',        sidebar: '#5b21b6', accent: '#7c3aed' },
];

// ── Validation helpers ────────────────────────────────────────────────────────

function passwordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Muy débil', color: 'bg-red-500' };
  if (score === 2) return { level: 2, label: 'Débil', color: 'bg-orange-400' };
  if (score === 3) return { level: 3, label: 'Regular', color: 'bg-yellow-400' };
  if (score === 4) return { level: 4, label: 'Fuerte', color: 'bg-emerald-400' };
  return { level: 5, label: 'Muy fuerte', color: 'bg-emerald-600' };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const {
    colorTheme, displayMode, scaleLevel, fontFamily, highContrast, reducedMotion,
    setColorTheme, setDisplayMode, setScaleLevel, setFontFamily, setHighContrast, setReducedMotion,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<Tab>("perfil");

  // Profile
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nombreError, setNombreError] = useState('');
  const [nombreTouched, setNombreTouched] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const pwStrength = passwordStrength(password);

  useEffect(() => {
    fetch("/api/usuarios/me")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setNombreCompleto(json.data.nombreCompleto);
          setEmail(json.data.email);
        }
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = !nombreCompleto.trim() ? 'El nombre completo es obligatorio.' : nombreCompleto.trim().length < 3 ? 'Debe tener al menos 3 caracteres.' : '';
    const pErr = password && password.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : '';
    setNombreError(nErr); setPasswordError(pErr);
    setNombreTouched(true); if (password) setPasswordTouched(true);
    if (nErr || pErr) return;
    if (password && password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/usuarios/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreCompleto, email, ...(password ? { password } : {}) }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        Swal.fire("¡Éxito!", "Perfil actualizado correctamente", "success");
        setPassword(""); setConfirmPassword("");
      } else {
        Swal.fire("Error", json.message || "Error al actualizar", "error");
      }
    } catch { Swal.fire("Error", "No se pudo conectar con el servidor", "error"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
    + " bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text)] focus:ring-[var(--p)]/30";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide mb-1 text-[var(--text-muted)]";
  const sectionCls = "bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm p-4 sm:p-6";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "perfil",        label: "Mi Perfil",     icon: <FaUser className="text-xs" /> },
    { id: "apariencia",    label: "Apariencia",     icon: <FaPalette className="text-xs" /> },
    { id: "accesibilidad", label: "Accesibilidad",  icon: <FaUniversalAccess className="text-xs" /> },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Sidebar pageTitle="Configuración" />

      <div className="flex-1 pt-14 md:pt-0 flex flex-col min-h-screen">
        <header className="hidden md:flex items-center bg-[var(--surface)] border-b border-[var(--border)] px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--p)' }}>
              <FaUser className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">Configuración</h1>
              <p className="text-xs text-[var(--text-muted)]">Administra tu cuenta y preferencias</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 max-w-4xl w-full mx-auto">

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)] mb-6 gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === t.id
                    ? 'border-[var(--p)] text-[var(--p)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Perfil ──────────────────────────────────────────────── */}
          {activeTab === "perfil" && (
            <div className={sectionCls}>
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">Información Personal</h2>
              {loadingProfile ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-10 rounded-lg w-full" style={{ backgroundColor: 'var(--border)' }} />
                  <div className="h-10 rounded-lg w-full" style={{ backgroundColor: 'var(--border)' }} />
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre Completo</label>
                    <input type="text"
                      className={`${inputCls}${nombreTouched && nombreError ? ' border-red-400' : ''}`}
                      value={nombreCompleto}
                      onChange={e => {
                        const v = e.target.value;
                        setNombreCompleto(v);
                        setNombreTouched(true);
                        setNombreError(!v.trim() ? 'El nombre completo es obligatorio.' : v.trim().length < 3 ? 'Debe tener al menos 3 caracteres.' : '');
                      }}
                      onBlur={() => { setNombreTouched(true); setNombreError(!nombreCompleto.trim() ? 'El nombre completo es obligatorio.' : nombreCompleto.trim().length < 3 ? 'Debe tener al menos 3 caracteres.' : ''); }}
                      minLength={3} aria-label="Nombre completo" />
                    {nombreTouched && nombreError && <p className="mt-1 text-xs text-red-500">{nombreError}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Correo Electrónico</label>
                    <input type="email" className={inputCls} value={email}
                      onChange={e => setEmail(e.target.value)} required
                      aria-label="Correo electrónico" />
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Cambiar Contraseña <span className="text-[var(--text-muted)] font-normal">(opcional)</span></h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Nueva Contraseña</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"}
                            className={`${inputCls} pr-10${passwordTouched && passwordError ? ' border-red-400' : ''}`}
                            value={password}
                            onChange={e => {
                              const v = e.target.value;
                              setPassword(v);
                              if (v) { setPasswordTouched(true); setPasswordError(v.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : ''); }
                              else { setPasswordError(''); }
                            }}
                            onBlur={() => { if (password) { setPasswordTouched(true); setPasswordError(password.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : ''); } }}
                            placeholder="Mín. 8 caracteres" aria-label="Nueva contraseña" />
                          <button type="button" onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition">
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {passwordTouched && passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
                        {/* Barra de fortaleza */}
                        {password && !passwordError && (
                          <div className="mt-2">
                            <div className="flex gap-1 h-1.5">
                              {[1,2,3,4,5].map(i => (
                                <div key={i} className={`flex-1 rounded-full transition-colors ${i <= pwStrength.level ? pwStrength.color : 'bg-gray-200'}`} />
                              ))}
                            </div>
                            <p className="text-xs mt-1 text-[var(--text-muted)]">{pwStrength.label}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Confirmar Contraseña</label>
                        <input type={showPassword ? "text" : "password"} className={inputCls}
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Repetir contraseña" aria-label="Confirmar contraseña" />
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-xs mt-1 text-red-500">Las contraseñas no coinciden</p>
                        )}
                        {confirmPassword && password === confirmPassword && password && (
                          <p className="text-xs mt-1 text-emerald-600">✓ Contraseñas coinciden</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50"
                      style={{ backgroundColor: 'var(--p)' }}>
                      <FaSave className="text-xs" />
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Tab: Apariencia ──────────────────────────────────────────── */}
          {activeTab === "apariencia" && (
            <div className="space-y-6">

              {/* Modo claro / oscuro */}
              <div className={sectionCls}>
                <h2 className="text-base font-bold text-[var(--text)] mb-1 flex items-center gap-2">
                  <FaSun className="text-amber-400" /> Modo de Visualización
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">Cambia entre modo claro y oscuro.</p>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  {([
                    { id: 'light', label: 'Claro', icon: <FaSun className="text-amber-400" /> },
                    { id: 'dark',  label: 'Oscuro', icon: <FaMoon className="text-slate-400" /> },
                  ] as { id: DisplayMode; label: string; icon: React.ReactNode }[]).map(m => (
                    <button key={m.id} onClick={() => setDisplayMode(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        displayMode === m.id
                          ? 'border-[var(--p)] bg-[var(--p-subtle)]'
                          : 'border-[var(--border)] hover:border-[var(--p)]/40 bg-[var(--surface)]'
                      }`}>
                      <span className="text-xl">{m.icon}</span>
                      <span className={`text-sm font-semibold ${displayMode === m.id ? 'text-[var(--p)]' : 'text-[var(--text-muted)]'}`}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema de color */}
              <div className={sectionCls}>
                <h2 className="text-base font-bold text-[var(--text)] mb-1 flex items-center gap-2">
                  <FaPalette style={{ color: 'var(--p)' }} /> Color del Sistema
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">Personaliza el color principal del sistema.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {COLOR_THEMES.map(t => (
                    <button key={t.id} onClick={() => setColorTheme(t.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        colorTheme === t.id
                          ? 'border-[var(--p)] bg-[var(--p-subtle)] shadow-sm'
                          : 'border-[var(--border)] hover:border-gray-300 bg-[var(--surface)]'
                      }`}>
                      {/* Color preview */}
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: t.sidebar }} />
                        <div className="w-6 h-6 rounded-full shadow-sm opacity-60" style={{ backgroundColor: t.accent }} />
                      </div>
                      <span className={`text-xs font-semibold ${colorTheme === t.id ? 'text-[var(--p)]' : 'text-[var(--text-muted)]'}`}>
                        {t.label}
                      </span>
                      {colorTheme === t.id && (
                        <span className="text-[10px] font-bold text-[var(--p)] bg-[var(--p-subtle)] px-2 py-0.5 rounded-full">Activo</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vista previa */}
              <div className={sectionCls}>
                <h2 className="text-base font-bold text-[var(--text)] mb-3">Vista Previa</h2>
                <div className="rounded-xl overflow-hidden border border-[var(--border)]">
                  <div className="h-10 flex items-center px-4 gap-3" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                    <div className="w-16 h-2 rounded-full bg-white/30" />
                    <div className="ml-auto w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div className="p-4 flex gap-3" style={{ backgroundColor: 'var(--bg)' }}>
                    <div className="w-20 shrink-0 rounded-lg p-2 space-y-1.5" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
                      {[1,2,3].map(i => (
                        <div key={i} className={`h-2 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/30'}`} />
                      ))}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                      <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                      <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                      <button className="mt-2 px-3 py-1 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: 'var(--p)' }}>
                        Acción
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Accesibilidad ───────────────────────────────────────── */}
          {activeTab === "accesibilidad" && (
            <div className="space-y-6">

              {/* Tamaño de texto */}
              <div className={sectionCls}>
                <h2 className="text-base font-bold text-[var(--text)] mb-1 flex items-center gap-2">
                  <FaFont style={{ color: 'var(--p)' }} /> Tamaño de Texto
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">Ajusta el tamaño global de la interfaz.</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'normal',     label: 'Normal',      size: '16px' },
                    { id: 'grande',     label: 'Grande',      size: '18px' },
                    { id: 'extragrande',label: 'Extra Grande', size: '20px' },
                  ] as { id: ScaleLevel; label: string; size: string }[]).map(s => (
                    <button key={s.id} onClick={() => setScaleLevel(s.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-0 ${
                        scaleLevel === s.id
                          ? 'border-[var(--p)] bg-[var(--p-subtle)]'
                          : 'border-[var(--border)] hover:border-[var(--p)]/40 bg-[var(--surface)]'
                      }`}>
                      <span className="font-bold leading-none" style={{ fontSize: s.size, color: scaleLevel === s.id ? 'var(--p)' : 'var(--text-muted)' }}>Aa</span>
                      <span className={`text-[11px] font-semibold text-center leading-tight ${scaleLevel === s.id ? 'text-[var(--p)]' : 'text-[var(--text-muted)]'}`}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuente */}
              <div className={sectionCls}>
                <h2 className="text-base font-bold text-[var(--text)] mb-1 flex items-center gap-2">
                  <FaFont style={{ color: 'var(--p)' }} /> Tipo de Fuente
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">Elige la familia tipográfica que mejor se adapte a tu lectura.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {([
                    { id: 'default',  label: 'Sistema',    sample: 'Aa Bb Cc', style: 'font-sans' },
                    { id: 'serif',    label: 'Serif',      sample: 'Aa Bb Cc', style: 'font-serif' },
                    { id: 'mono',     label: 'Mono',       sample: 'Aa Bb Cc', style: 'font-mono' },
                    { id: 'dyslexia', label: 'Dislexia',   sample: 'Aa Bb Cc', style: 'font-sans tracking-wider' },
                  ] as { id: FontFamily; label: string; sample: string; style: string }[]).map(f => (
                    <button key={f.id} onClick={() => setFontFamily(f.id)}
                      className={`flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-xl border-2 transition-all min-w-0 ${
                        fontFamily === f.id
                          ? 'border-[var(--p)] bg-[var(--p-subtle)]'
                          : 'border-[var(--border)] hover:border-[var(--p)]/40 bg-[var(--surface)]'
                      }`}>
                      <span className={`text-base ${f.style}`} style={{ color: fontFamily === f.id ? 'var(--p)' : 'var(--text)' }}>{f.sample}</span>
                      <span className={`text-xs font-semibold ${fontFamily === f.id ? 'text-[var(--p)]' : 'text-[var(--text-muted)]'}`}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className={sectionCls}>
                <h2 className="text-base font-bold text-[var(--text)] mb-4">Opciones Adicionales</h2>
                <div className="space-y-4">
                  {/* Alto contraste */}
                  <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--p-subtle)] flex items-center justify-center">
                        <FaAdjust style={{ color: 'var(--p)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">Alto Contraste</p>
                        <p className="text-xs text-[var(--text-muted)]">Aumenta el contraste de bordes y texto</p>
                      </div>
                    </div>
                    <button
                      role="switch" aria-checked={highContrast}
                      onClick={() => setHighContrast(!highContrast)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${highContrast ? 'bg-[var(--p)]' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Reducir movimiento */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--p-subtle)] flex items-center justify-center">
                        <FaBolt style={{ color: 'var(--p)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">Reducir Movimiento</p>
                        <p className="text-xs text-[var(--text-muted)]">Desactiva animaciones y transiciones</p>
                      </div>
                    </div>
                    <button
                      role="switch" aria-checked={reducedMotion}
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${reducedMotion ? 'bg-[var(--p)]' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${reducedMotion ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Restablecer */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setScaleLevel('normal');
                    setFontFamily('default');
                    setHighContrast(false);
                    setReducedMotion(false);
                    setColorTheme('navy');
                    setDisplayMode('light');
                  }}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 transition-colors"
                >
                  Restablecer preferencias por defecto
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
