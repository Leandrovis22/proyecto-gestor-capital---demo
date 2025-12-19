"use client";

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import GastosManager from '@/components/GastosManager';
import InversionesManager from '@/components/InversionesManager';
import PagosView from '@/components/PagosView';
import VentasView from '@/components/VentasView';
import DeudoresView from '@/components/DeudoresView';
import toast from 'react-hot-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gastos' | 'inversiones' | 'pagos' | 'ventas' | 'deudores'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Establecer fecha de actualización inicial
    setLastUpdate(new Date().toISOString());

  }, []);

  const handleUpdateFromDashboard = (fecha: string) => {
    setLastUpdate(fecha);
  };

  const handleLogout = () => {
    // En modo demo, el botón de logout no hace nada
    toast('ℹ️ Modo demo: los cambios se perderán al cerrar la página', {
      icon: '💡',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSync = async (forzarTodo: boolean) => {
    // En modo demo, simular sincronización exitosa
    setIsRefreshing(true);
    
    // Simular un pequeño delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('✅ Sincronización exitosa (modo demo)');
    setLastUpdate(new Date().toISOString());
    setRefreshKey(prev => prev + 1);
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Desktop title + info */}
            <div className="hidden sm:block">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Gestor Capital Demo
              </h1>
              {lastUpdate && (
                <p className="text-md text-gray-500 mt-2">
                  ⏱️ Última actualización: {formatDateTime(lastUpdate)}
                </p>
              )}
              <p className="text-sm text-blue-600 mt-1">
                💡 Modo demo: Los cambios se perderán al cerrar la página
              </p>
            </div>

            {/* Mobile compact info */}
            <div className="sm:hidden w-full flex items-center justify-between">
              <div className='pl-2'>
                {lastUpdate && (
                  <p className="text-sm text-gray-700">⏱️ Última actualización: <br />{formatDateTime(lastUpdate)}</p>
                )}
                <p className="text-xs text-blue-600 mt-1">💡 Modo demo</p>
              </div>
              <div className='px-2'>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Abrir menú"
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleSync(true)}
                disabled={isRefreshing}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                🔄 Actualizar Todo
              </button>

              <button
                onClick={() => handleSync(false)}
                disabled={isRefreshing}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isRefreshing ? '🔄 Sincronizando...' : '🔄 Actualizar Solo Cambios'}
              </button>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                title="Cerrar sesión"
              >
                🔓 Salir
              </button>
            </div>

            {/* Mobile menu panel */}
            {mobileMenuOpen && (
              <div className="sm:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="font-bold text-md text-center">Gestor Capital Demo</h2>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        handleSync(true);
                        setMobileMenuOpen(false);
                      }}
                      disabled={isRefreshing}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
                    >
                      🔄 Actualizar Todo
                    </button>
                    <button
                      onClick={() => { 
                        handleSync(false);
                        setTimeout(() => setMobileMenuOpen(false), 100);
                      }}
                      disabled={isRefreshing}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
                    >
                      {isRefreshing ? '🔄 Sincronizando...' : '🔄 Actualizar Solo Cambios'}
                    </button>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold text-sm"
                    >
                      🔓 Salir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-xl shadow-lg p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'pagos'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            💰 Pagos
          </button>
          <button
            onClick={() => setActiveTab('ventas')}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'ventas'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            🛒 Ventas
          </button>
          <button
            onClick={() => setActiveTab('deudores')}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'deudores'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            👥 Deudores
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'gastos'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            💸 Gastos
          </button>
          <button
            onClick={() => setActiveTab('inversiones')}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'inversiones'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            📈 Inversiones
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard refreshKey={refreshKey} onUpdate={handleUpdateFromDashboard} />}
        {activeTab === 'pagos' && <PagosView refreshKey={refreshKey} />}
        {activeTab === 'ventas' && <VentasView refreshKey={refreshKey} />}
        {activeTab === 'deudores' && <DeudoresView refreshKey={refreshKey} />}
        {activeTab === 'gastos' && <GastosManager refreshKey={refreshKey} />}
        {activeTab === 'inversiones' && <InversionesManager refreshKey={refreshKey} />}
      </main>

      {/* Footer */}
      <footer className="py-5 text-center border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <p className="text-gray-600 text-sm font-medium">💡 Los cálculos de capital consideran pagos y ventas desde el 04/11/2025</p>
        <p className="text-gray-400 text-xs mt-2">© 2025 Gestor Capital por Leandro Viscolungo</p>
      </footer>
    </div>
  );
}
