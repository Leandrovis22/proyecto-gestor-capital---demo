'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import GastosManager from '@/components/GastosManager';
import InversionesManager from '@/components/InversionesManager';
import PagosView from '@/components/PagosView';
import VentasView from '@/components/VentasView';
import DeudoresView from '@/components/DeudoresView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gastos' | 'inversiones' | 'pagos' | 'ventas' | 'deudores'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSync = async (forzarTodo: boolean) => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4781a3a659d818c7bf991cba7bea990dad253d7765c6094172f76fb036be1ad7'
        },
        body: JSON.stringify({ forzarTodo })
      });

      const data = await response.json();
      
      if (data.exito) {
        alert(`✅ Sincronización completada\n\nArchivos actualizados: ${data.archivosActualizados}\nArchivos omitidos: ${data.archivosOmitidos}\nDuración: ${data.duracionSegundos}s`);
        window.location.reload();
      } else {
        alert('❌ Error en sincronización: ' + data.error);
      }
    } catch (error) {
      alert('❌ Error al sincronizar: ' + error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              💰 Gestor de Capital
            </h1>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleSync(false)}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-md"
              >
                {isRefreshing ? '🔄 Sincronizando...' : '🔄 Actualizar Ahora'}
              </button>
              
              <button
                onClick={() => {
                  if (confirm('⚠️ Esto sincronizará TODOS los archivos y puede tardar varios minutos.\n\n¿Continuar?')) {
                    handleSync(true);
                  }
                }}
                disabled={isRefreshing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-md"
              >
                🔄 Actualizar Todo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-md p-1 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'pagos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            💰 Pagos
          </button>
          <button
            onClick={() => setActiveTab('ventas')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'ventas'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🛒 Ventas
          </button>
          <button
            onClick={() => setActiveTab('deudores')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'deudores'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            👥 Deudores
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'gastos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            💸 Gastos
          </button>
          <button
            onClick={() => setActiveTab('inversiones')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'inversiones'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📈 Inversiones
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pagos' && <PagosView />}
        {activeTab === 'ventas' && <VentasView />}
        {activeTab === 'deudores' && <DeudoresView />}
        {activeTab === 'gastos' && <GastosManager />}
        {activeTab === 'inversiones' && <InversionesManager />}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-600 text-sm">
        <p>💡 Nota: Los cálculos de capital consideran pagos y ventas desde el 04/11/2025</p>
      </footer>
    </div>
  );
}
