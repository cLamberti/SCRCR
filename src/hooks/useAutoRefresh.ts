import { useEffect, useRef } from 'react';

/**
 * Llama a `refresh` automáticamente:
 *  - Al montar (primera carga)
 *  - Cada `intervalMs` milisegundos mientras el tab está visible
 *  - Inmediatamente cuando el tab vuelve a ser visible (visibilitychange)
 *  - Inmediatamente cuando la ventana recupera el foco (focus)
 *
 * Pausa el polling cuando `paused` es true (p.ej. modal abierto).
 */
export function useAutoRefresh(
  refresh: () => void,
  intervalMs = 30_000,
  paused = false,
) {
  // Ref estable para no reiniciar el efecto si `refresh` cambia referencia
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  useEffect(() => {
    if (paused) return;

    // Polling periódico — solo mientras el tab está visible
    const tick = () => {
      if (document.visibilityState === 'visible') {
        refreshRef.current();
      }
    };

    const id = setInterval(tick, intervalMs);

    // Refresh al volver a ver el tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };
    const onFocus = () => refreshRef.current();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [intervalMs, paused]);
}
