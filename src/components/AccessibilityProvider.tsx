"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ScaleLevel  = 'normal' | 'grande' | 'extragrande';
export type ColorTheme  = 'navy' | 'sky' | 'green' | 'violet';
export type DisplayMode = 'light' | 'dark';
export type FontFamily  = 'default' | 'serif' | 'mono' | 'dyslexia';

interface PrefsContextProps {
  /* Apariencia */
  colorTheme:   ColorTheme;
  displayMode:  DisplayMode;
  setColorTheme:  (t: ColorTheme)  => void;
  setDisplayMode: (m: DisplayMode) => void;

  /* Accesibilidad */
  scaleLevel:    ScaleLevel;
  fontFamily:    FontFamily;
  highContrast:  boolean;
  reducedMotion: boolean;
  setScaleLevel:    (l: ScaleLevel)  => void;
  setFontFamily:    (f: FontFamily)  => void;
  setHighContrast:  (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
}

const PrefsContext = createContext<PrefsContextProps | undefined>(undefined);

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme,   setColorThemeState]   = useState<ColorTheme>('navy');
  const [displayMode,  setDisplayModeState]  = useState<DisplayMode>('light');
  const [scaleLevel,   setScaleLevelState]   = useState<ScaleLevel>('normal');
  const [fontFamily,   setFontFamilyState]   = useState<FontFamily>('default');
  const [highContrast, setHighContrastState] = useState(false);
  const [reducedMotion, setReducedMotionState] = useState(false);

  /* Load from localStorage once on mount */
  useEffect(() => {
    setColorThemeState(load('pref_color',   'navy'));
    setDisplayModeState(load('pref_mode',   'light'));
    setScaleLevelState(load('pref_scale',   'normal'));
    setFontFamilyState(load('pref_font',    'default'));
    setHighContrastState(load('pref_contrast', false));
    setReducedMotionState(load('pref_motion',  false));
  }, []);

  /* Apply all prefs to <html> whenever they change */
  useEffect(() => {
    const html = document.documentElement;

    /* Color theme */
    if (colorTheme === 'navy') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', colorTheme);

    /* Dark mode */
    if (displayMode === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');

    /* Font size + data-scale attribute */
    html.style.fontSize =
      scaleLevel === 'grande' ? '18px' :
      scaleLevel === 'extragrande' ? '20px' : '16px';
    if (scaleLevel === 'normal') html.removeAttribute('data-scale');
    else html.setAttribute('data-scale', scaleLevel);

    /* Font family */
    if (fontFamily === 'default') html.removeAttribute('data-font');
    else html.setAttribute('data-font', fontFamily);

    /* High contrast */
    if (highContrast) html.setAttribute('data-contrast', 'high');
    else html.removeAttribute('data-contrast');

    /* Reduced motion */
    if (reducedMotion) html.setAttribute('data-motion', 'reduced');
    else html.removeAttribute('data-motion');
  }, [colorTheme, displayMode, scaleLevel, fontFamily, highContrast, reducedMotion]);

  /* Setters that also persist */
  const setColorTheme  = (t: ColorTheme)  => { setColorThemeState(t);  save('pref_color', t); };
  const setDisplayMode = (m: DisplayMode) => { setDisplayModeState(m); save('pref_mode', m); };
  const setScaleLevel  = (l: ScaleLevel)  => { setScaleLevelState(l);  save('pref_scale', l); };
  const setFontFamily  = (f: FontFamily)  => { setFontFamilyState(f);  save('pref_font', f); };
  const setHighContrast  = (v: boolean) => { setHighContrastState(v);  save('pref_contrast', v); };
  const setReducedMotion = (v: boolean) => { setReducedMotionState(v); save('pref_motion', v); };

  return (
    <PrefsContext.Provider value={{
      colorTheme, displayMode, scaleLevel, fontFamily, highContrast, reducedMotion,
      setColorTheme, setDisplayMode, setScaleLevel, setFontFamily, setHighContrast, setReducedMotion,
    }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
