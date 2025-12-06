"use client";

import { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/lib/auth';
import Dashboard from '@/components/Dashboard';
import GastosManager from '@/components/GastosManager';
import InversionesManager from '@/components/InversionesManager';
import PagosView from '@/components/PagosView';
import VentasView from '@/components/VentasView';
import DeudoresView from '@/components/DeudoresView';
import LoginForm from '@/components/LoginForm';
import toast from 'react-hot-toast';

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
  const [lastSyncSummary, setLastSyncSummary] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Flag para prevenir race conditions durante login
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const loginInProgressRef = useRef(false);

  useEffect(() => {
    // Verificar si hay token de sesión guardado
    const savedToken = sessionStorage.getItem('sessionToken');
    const savedLastUpdate = sessionStorage.getItem('lastUpdate');

    if (savedLastUpdate) {
      setLastUpdate(savedLastUpdate);
    }

    if (savedToken) {
      setSessionToken(savedToken);
      setIsAuthenticated(true);
      // Cargar estado de sincronización al iniciar si hay token
      fetchSyncStatus(savedToken);
    }
  
    // Marcar verificación de auth como completa inmediatamente
    setIsCheckingAuth(false);
    
    // Marcar como inicializado después de un momento
    setTimeout(() => setIsInitializing(false), 150);
  }, []);

  // Escuchar evento global cuando la sesión expire (emitted desde authFetch)
  useEffect(() => {
    const handler = () => {
      // Solo procesar si realmente estamos autenticados
      // Ignorar eventos durante el proceso de login
      if (!isAuthenticated || loginInProgressRef.current) {
        console.log('Evento sessionExpired ignorado: usuario no autenticado o login en progreso');
        return;
      }
      
      // Remover token y actualizar estado sin recargar la página
      sessionStorage.removeItem('sessionToken');
      setSessionToken(null);
      setIsAuthenticated(false);
      toast.error('🔒 Sesión expirada. Por favor inicia sesión de nuevo.');
    };
    window.addEventListener('sessionExpired', handler as EventListener);
    return () => window.removeEventListener('sessionExpired', handler as EventListener);
  }, [isAuthenticated]);

  const handleLogin = (token: string) => {
    // Prevenir llamadas concurrentes
    if (loginInProgressRef.current) {
      console.log('Login ya en progreso, ignorando llamada duplicada');
      return;
    }

    loginInProgressRef.current = true;

    // CRÍTICO: Marcar en auth.ts que estamos en proceso de login DE FORMA SÍNCRONA
    // Esto evita que 401s transitorios cierren la sesión
    const { setLoginInProgress } = require('@/lib/auth');
    setLoginInProgress(true);

    // Token ya está guardado en sessionStorage por LoginForm
    setSessionToken(token);
    setIsAuthenticated(true);

    toast.success('✅ Sesión iniciada correctamente');

    // Esperar un poco más antes de hacer peticiones
    setTimeout(() => {
      const tokenVerificado = sessionStorage.getItem('sessionToken');
      if (tokenVerificado === token) {
        fetchSyncStatus(token).catch(err => {
          console.log('Error cargando sync status (no crítico):', err);
        });
      }

      // Desmarcar flag de login después de 2 segundos completos para dar tiempo a cargar todo
      setTimeout(() => {
        const { setLoginInProgress } = require('@/lib/auth');
        setLoginInProgress(false);
        loginInProgressRef.current = false;
      }, 2000);
    }, 400);
  };

  const handleUpdateFromDashboard = (fecha: string) => {
    setLastUpdate(fecha);
    sessionStorage.setItem('lastUpdate', fecha); // Persistir la última actualización desde el Dashboard
  };

  async function fetchSyncStatus(token: string) {
    if (!token) return;
    try {
      // Usar silentFail=true porque esto se llama durante login y polling
      const estadoResponse = await authFetch('/api/sync/webhook', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        }
      }, true);

      if (!estadoResponse.ok) {
        console.log('No se pudo obtener estado de sincronización');
        return;
      }

      const estadoData = await estadoResponse.json();
      if (estadoData.success && estadoData.estado) {
        try {
          const incoming = new Date(estadoData.estado.ultimaActualizacion).getTime();
          const stored = sessionStorage.getItem('lastUpdate') || lastUpdate || null;
          const current = stored ? new Date(stored).getTime() : 0;
          if (incoming > current) {
            setLastUpdate(estadoData.estado.ultimaActualizacion);
            sessionStorage.setItem('lastUpdate', estadoData.estado.ultimaActualizacion);
          }
        } catch (e) {
          if (!sessionStorage.getItem('lastUpdate') && !lastUpdate) {
            setLastUpdate(estadoData.estado.ultimaActualizacion);
            sessionStorage.setItem('lastUpdate', estadoData.estado.ultimaActualizacion);
          }
        }
        setSyncStatus(estadoData.estado.mensaje);
        if (estadoData.estado.estado === 'completado') {
          setLastSyncSummary(`✅ Sincronización completada: ${estadoData.estado.archivosActualizados || 0} archivos actualizados`);
        } else if (estadoData.estado.estado === 'en_progreso') {
          setLastSyncSummary(`🔄 Sincronizando: ${estadoData.estado.mensaje || 'Procesando...'}`);
        }
        const running = estadoData.estado.estado === 'en_progreso';
        setSyncRunning(running);
        if (!running && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setSyncStatus(null);
        setSyncRunning(false);
        setLastSyncSummary(null);
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
      const response = await authFetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forzarTodo })
      });

      const data = await response.json();

      if (data.exito) {
        // Si el resultado indica que ya completó, mostrar resumen
        if (data.estado === 'completado' || data.mensaje?.toLowerCase().includes('completada')) {
          toast.success(`✅ Sincronización completada\nArchivos actualizados: ${data.archivosActualizados || 0}\nArchivos omitidos: ${data.archivosOmitidos || 0}\nDuración: ${data.duracionSegundos || 'n/a'}s`);
          setRefreshKey(prev => prev + 1);
          setLastSyncSummary(`✅ Sincronización completada: ${data.archivosActualizados || 0} archivos actualizados`);
        } else {
          // La sincronización quedó en progreso (procesamiento por lotes). No mostrar alerta de completado.
          setSyncRunning(true);
          // Informar que se inició y se monitoreará
          toast('🔔 Sincronización iniciada y en progreso. Te avisará cuando termine.');

          // Iniciar polling (si no existe) para detectar cuando el webhook reporte completado
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          intervalRef.current = setInterval(async () => {
            try {
              const estadoResponse = await authFetch('/api/sync/webhook', { method: 'GET' }, true);
              const estadoData = await estadoResponse.json();
              if (estadoData.success && estadoData.estado) {
                setSyncStatus(estadoData.estado.mensaje);
                const runningNow = estadoData.estado.estado === 'en_progreso';
                setSyncRunning(runningNow);
                if (estadoData.estado.estado === 'en_progreso') {
                  setLastSyncSummary(`🔄 Sincronizando: ${estadoData.estado.mensaje || 'Procesando...'}`);
                }
                // Actualizar lastUpdate si viene
                if (estadoData.estado.ultimaActualizacion) {
                  try {
                    const incoming = new Date(estadoData.estado.ultimaActualizacion).getTime();
                    const stored = sessionStorage.getItem('lastUpdate') || lastUpdate || null;
                    const current = stored ? new Date(stored).getTime() : 0;
                    if (incoming > current) {
                      setLastUpdate(estadoData.estado.ultimaActualizacion);
                      sessionStorage.setItem('lastUpdate', estadoData.estado.ultimaActualizacion);
                    }
                  } catch (e) {
                    // ignore parse errors
                  }
                }
                if (!runningNow) {
                  // Completó: mostrar toast final con datos del webhook
                  const s = estadoData.estado;
                  toast.success(`✅ Sincronización completada\nArchivos actualizados: ${s.archivosActualizados || 0}\nArchivos omitidos: ${s.archivosOmitidos || 0}\nDuración: ${s.duracionSegundos || 'n/a'}s`);
                  setRefreshKey(prev => prev + 1);
                  setLastSyncSummary(`✅ Sincronización completada: ${s.archivosActualizados || 0} archivos actualizados`);
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  setSyncRunning(false);
                }
              }
            } catch (err) {
              console.error('Error polling sync status:', err);
              toast.error('Error consultando estado de sincronización.');
            }
          }, 15000);
        }
      } else {
        toast.error(`❌ Error en sincronización: ${data.error || 'Error desconocido'}`);
      }

      if (forzarTodo) {
        // Iniciar polling cada 30 segundos
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
          intervalRef.current = setInterval(async () => {
          try {
            const estadoResponse = await authFetch('/api/sync/webhook', { method: 'GET' }, true);

            const estadoData = await estadoResponse.json();
            if (estadoData.success && estadoData.estado) {
              // Solo actualizar si la marca de tiempo entrante es más reciente
              try {
                const incoming = new Date(estadoData.estado.ultimaActualizacion).getTime();
                const stored = sessionStorage.getItem('lastUpdate') || lastUpdate || null;
                const current = stored ? new Date(stored).getTime() : 0;
                if (incoming > current) {
                  setLastUpdate(estadoData.estado.ultimaActualizacion);
                  sessionStorage.setItem('lastUpdate', estadoData.estado.ultimaActualizacion);
                }
              } catch (e) {
                if (!sessionStorage.getItem('lastUpdate') && !lastUpdate) {
                  setLastUpdate(estadoData.estado.ultimaActualizacion);
                  sessionStorage.setItem('lastUpdate', estadoData.estado.ultimaActualizacion);
                }
              }
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
      toast.error(`❌ Error al sincronizar: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Configurar un intervalo para actualizar el estado de sincronización periódicamente
      const syncInterval = setInterval(() => {
        fetchSyncStatus(sessionToken || '');
      }, 30000); // Actualizar cada 30 segundos

      return () => clearInterval(syncInterval); // Limpiar el intervalo al desmontar
    }
  }, [isAuthenticated, sessionToken]);

  // Mostrar loader mientras verifica la autenticación
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Prevenir renderizado hasta que la inicialización esté completa
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Desktop title + info */}
            <div className="hidden sm:block">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Gestor Capital Julieta Joyas Web 💎
              </h1>
              {lastUpdate && (
                <>
                  <p className="text-md text-gray-500 mt-2">
                    ⏱️ Última actualización: {formatDateTime(lastUpdate)}
                  </p>
                  {syncStatus && (
                    <p className="text-sm text-gray-600">
                      {syncStatus}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Mobile compact info: only show lastUpdate and a short sync summary/status */}
            <div className="sm:hidden w-full flex items-center justify-between">
              <div className='pl-2'>
                {lastUpdate && (
                  <p className="text-sm text-gray-700">⏱️ Última actualización: <br />{formatDateTime(lastUpdate)}</p>
                )}
                {lastSyncSummary ? (
                  <p className="text-sm text-green-700" dangerouslySetInnerHTML={{ __html: lastSyncSummary.replace(':', ':<br />') }}></p>
                ) : (
                  syncStatus && <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: syncStatus.replace(':', ':<br />') }}></p>
                )}
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
                onClick={() => handleSync(false)}
                disabled={isRefreshing || syncRunning}
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
                    <h2 className="font-bold text-md text-center">Gestor Capital Julieta Joyas Web 💎</h2>
                    
                  </div>
                  <div className="flex flex-col gap-3">
                    
                    <button
                      onClick={() => {
                        if (confirm('⚠️ ADVERTENCIA\n\nEsto va a recargar TODOS los datos. Será lento y puede causar corte en el servicio de Google Drive si se utiliza muy seguido.\n\n💡 Se recomienda usar solo 1 vez por semana.\n\n¿Deseas continuar?')) {
                          handleSync(true);
                          setMobileMenuOpen(false);
                        }
                      }}
                      disabled={isRefreshing || syncRunning}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
                    >
                      🔄 Actualizar Todo
                    </button>
                    <button
                      onClick={() => { 
                        handleSync(false);
                        setTimeout(() => setMobileMenuOpen(false), 100);
                      }}
                      disabled={isRefreshing || syncRunning}
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

      {/* syncStatus is now shown in the header next to Última actualización */}

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
