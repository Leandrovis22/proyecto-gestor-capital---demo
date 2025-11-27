'use client';

import React from 'react';

type Toast = {
  id: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
};

export default function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void; }) {
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
