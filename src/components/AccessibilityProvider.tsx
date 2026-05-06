"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type ScaleLevel = 'normal' | 'grande' | 'extragrande';

interface AccessibilityContextProps {
  scaleLevel: ScaleLevel;
  setScaleLevel: (level: ScaleLevel) => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [scaleLevel, setScaleLevel] = useState<ScaleLevel>('normal');

  // Load initial scale from localStorage
  useEffect(() => {
    const savedScale = localStorage.getItem('ui_scale') as ScaleLevel;
    if (savedScale && ['normal', 'grande', 'extragrande'].includes(savedScale)) {
      setScaleLevel(savedScale);
    }
  }, []);

  // Apply scale to HTML element instantly
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (scaleLevel === 'normal') {
      htmlElement.style.fontSize = '16px';
    } else if (scaleLevel === 'grande') {
      htmlElement.style.fontSize = '18px';
    } else if (scaleLevel === 'extragrande') {
      htmlElement.style.fontSize = '20px';
    }
    localStorage.setItem('ui_scale', scaleLevel);
  }, [scaleLevel]);

  return (
    <AccessibilityContext.Provider value={{ scaleLevel, setScaleLevel }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
