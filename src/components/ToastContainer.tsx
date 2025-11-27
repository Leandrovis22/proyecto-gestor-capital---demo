'use client';

import React, { useEffect, useRef } from 'react';

type Toast = {
  id: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
};

export default function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void; }) {
  // Mantener referencias a timers para limpiar si cambia la lista
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Para cada toast nuevo, crear un timer que lo cierre en 10s
    toasts.forEach((t) => {
      if (!timersRef.current.has(t.id)) {
        const timer = window.setTimeout(() => {
          onDismiss(t.id);
        }, 10000); // 10 segundos
        timersRef.current.set(t.id, timer);
      }
    });

    // Limpiar timers de toasts que ya no existen
    const existingIds = new Set(toasts.map((t) => t.id));
    for (const [id, timer] of Array.from(timersRef.current.entries())) {
      if (!existingIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }

    // Cleanup general al desmontar
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [toasts, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-sm w-full border rounded-lg shadow-md px-4 py-3 bg-white flex items-start gap-3 ${t.type === 'error' ? 'border-red-300' : t.type === 'success' ? 'border-green-300' : 'border-gray-200'}`}>
          <div className="flex-1">
            {t.title && <div className="text-sm font-semibold text-gray-800">{t.title}</div>}
            <div className="text-sm text-gray-700 mt-1">{t.message}</div>
          </div>
          <button aria-label="Cerrar" onClick={() => onDismiss(t.id)} className="text-gray-400 hover:text-gray-700 ml-2">
            ✖
          </button>
        </div>
      ))}
    </div>
  );
}
