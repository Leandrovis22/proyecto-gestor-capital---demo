'use client';

import { useState, useEffect, useRef } from 'react';
import Dashboard from '@/components/Dashboard';
import GastosManager from '@/components/GastosManager';
import InversionesManager from '@/components/InversionesManager';
import PagosView from '@/components/PagosView';
import VentasView from '@/components/VentasView';
import DeudoresView from '@/components/DeudoresView';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gastos' | 'inversiones' | 'pagos' | 'ventas' | 'deudores'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncRunning, setSyncRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay token de sesión guardado
    const savedToken = sessionStorage.getItem('sessionToken');
    if (savedToken) {
      setSessionToken(savedToken);
      setIsAuthenticated(true);
      // Cargar estado de sincronización al iniciar si hay token
      fetchSyncStatus(savedToken);
    }
  }, []);

  const handleLogin = (token: string) => {
    setSessionToken(token);
    setIsAuthenticated(true);
    // Cargar estado de sincronización inmediatamente tras login
    fetchSyncStatus(token);
  };

  async function fetchSyncStatus(token: string) {
    try {
      const estadoResponse = await fetch('/api/sync/webhook', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token || ''
        }
      });

      const estadoData = await estadoResponse.json();
      if (estadoData.success && estadoData.estado) {
        setLastUpdate(estadoData.estado.ultimaActualizacion);
        setSyncStatus(estadoData.estado.mensaje);
        const running = estadoData.estado.estado === 'en_progreso';
        setSyncRunning(running);
        console.log('Estado de sincronización (inicial):', estadoData.estado);
        if (!running && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Si no hay estado registrado, limpiar indicadores
        setSyncStatus(null);
        setSyncRunning(false);
      }
    } catch (error) {
      console.error('Error al obtener el estado de sincronización (inicio):', error);
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('sessionToken');
    setSessionToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    return () => {
      // Limpiar el intervalo al desmontar el componente
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
    try {
      setIsRefreshing(true);
      // marcar que la sincronización está en curso (bloquea botones)
      if (forzarTodo) setSyncRunning(true);
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({ forzarTodo })
      });

      const data = await response.json();

      if (data.exito) {
        alert(`✅ Sincronización completada\n\nArchivos actualizados: ${data.archivosActualizados}\nArchivos omitidos: ${data.archivosOmitidos}\nDuración: ${data.duracionSegundos}s`);
        // Refrescar la última actualización y forzar recarga de componentes
        setRefreshKey(prev => prev + 1);
      } else {
        alert('❌ Error en sincronización: ' + data.error);
      }

      if (forzarTodo) {
        // Iniciar polling cada 30 segundos
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(async () => {
          try {
            const estadoResponse = await fetch('/api/sync/webhook', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': sessionToken || ''
              }
            });

            const estadoData = await estadoResponse.json();
            if (estadoData.success && estadoData.estado) {
              setLastUpdate(estadoData.estado.ultimaActualizacion);
              setSyncStatus(estadoData.estado.mensaje);
              const running = estadoData.estado.estado === 'en_progreso';
              setSyncRunning(running);
              console.log('Estado de sincronización:', estadoData.estado);

              // Si terminó, limpiar el intervalo
              if (!running && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          } catch (error) {
            console.error('Error al obtener el estado de sincronización:', error);
          }
        }, 30000);
      }
    } catch (error) {
      alert('❌ Error al sincronizar: ' + error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateFromDashboard = (fecha: string) => {
    setLastUpdate(fecha);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Gestor Capital Julieta Joyas Web 💎
              </h1>
              {lastUpdate && (
                <p className="text-md text-gray-500 mt-2">
                  ⏱️ Última actualización: {formatDateTime(lastUpdate)}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleSync(false)}
                disabled={isRefreshing || syncRunning}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isRefreshing ? '🔄 Sincronizando...' : '🔄 Actualizar Ahora'}
              </button>
              
              <button
                onClick={() => {
                  if (confirm('⚠️ ADVERTENCIA\n\nEsto va a recargar TODOS los datos. Será lento y puede causar corte en el servicio de Google Drive si se utiliza muy seguido.\n\n💡 Se recomienda usar solo 1 vez por semana.\n\n¿Deseas continuar?')) {
                    handleSync(true);
                  }
                }}
                disabled={isRefreshing || syncRunning}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                🔄 Actualizar Todo
              </button>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                title="Cerrar sesión"
              >
                🔓 Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sync Status Display */}
      {syncStatus && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg shadow-md">
            <p className="text-sm font-medium">Estado de sincronización: {syncStatus}</p>
          </div>
        </div>
      )}

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
      <footer className="mt-16 py-8 text-center border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <p className="text-gray-600 text-sm font-medium">💡 Los cálculos de capital consideran pagos y ventas desde el 04/11/2025</p>
        <p className="text-gray-400 text-xs mt-2">© 2025 Gestor Capital por Leandro Viscolungo</p>
      </footer>
    </div>
  );
}
