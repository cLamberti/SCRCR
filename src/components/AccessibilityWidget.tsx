'use client';

import { useState, useRef, useEffect } from 'react';
import { FaUniversalAccess, FaTimes, FaSun, FaMoon, FaFont, FaExternalLinkAlt, FaBook } from 'react-icons/fa';
import { useAccessibility, type DisplayMode, type ScaleLevel } from './AccessibilityProvider';

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { displayMode, setDisplayMode, scaleLevel, setScaleLevel } = useAccessibility();

  /* Cerrar al hacer clic fuera */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const SCALE_OPTIONS: { id: ScaleLevel; label: string; size: string }[] = [
    { id: 'normal',      label: 'Normal',      size: 'text-sm'  },
    { id: 'grande',      label: 'Grande',      size: 'text-base' },
    { id: 'extragrande', label: 'Muy grande',  size: 'text-lg'  },
  ];

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Panel de accesibilidad"
          className="fixed bottom-20 right-4 z-[9999] w-72 rounded-2xl shadow-2xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <FaUniversalAccess className="text-[var(--p)] text-base" />
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Accesibilidad y Ayuda</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition rounded-lg p-1"
              aria-label="Cerrar panel"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          <div className="p-4 space-y-5">

            {/* Modo claro / oscuro */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Modo de visualización
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'light', label: 'Claro',  icon: <FaSun  className="text-amber-400 text-base" /> },
                  { id: 'dark',  label: 'Oscuro', icon: <FaMoon className="text-slate-400 text-base" /> },
                ] as { id: DisplayMode; label: string; icon: React.ReactNode }[]).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setDisplayMode(m.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      displayMode === m.id
                        ? 'border-[var(--p)] bg-[var(--p-subtle)] text-[var(--p)]'
                        : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--p)]/40'
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamaño de fuente */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <FaFont className="text-[10px]" /> Tamaño de texto
              </p>
              <div className="flex gap-2">
                {SCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setScaleLevel(opt.id)}
                    className={`flex-1 py-2 rounded-xl border-2 font-semibold transition-all ${opt.size} ${
                      scaleLevel === opt.id
                        ? 'border-[var(--p)] bg-[var(--p-subtle)] text-[var(--p)]'
                        : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--p)]/40'
                    }`}
                    title={opt.label}
                  >
                    A
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                {SCALE_OPTIONS.find(o => o.id === scaleLevel)?.label}
              </p>
            </div>

            {/* Divisor */}
            <div className="border-t" style={{ borderColor: 'var(--border)' }} />

            {/* Guía de usuario */}
            <a
              href="https://lucychc.github.io/GuiaUsuarioSCRCR/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all group"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--input-bg)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--p)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--p-subtle)' }}
              >
                <FaBook className="text-[var(--p)] text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Guía de Usuario</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Manual completo del sistema</p>
              </div>
              <FaExternalLinkAlt className="text-[var(--text-muted)] text-xs flex-shrink-0 group-hover:text-[var(--p)] transition-colors" />
            </a>

          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        aria-label="Abrir panel de accesibilidad"
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: 'var(--p)' }}
      >
        {open
          ? <FaTimes className="text-white text-lg" />
          : <FaUniversalAccess className="text-white text-xl" />
        }
      </button>
    </>
  );
}
