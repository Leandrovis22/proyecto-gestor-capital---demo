'use client';

import { authFetch } from '@/lib/auth';
import { useEffect, useState, Fragment } from 'react';

interface Venta {
  id: string;
  clienteId: string;
  fechaVenta: string;
  totalVenta: string;
  numeroVentaDia: number;
  timestampArchivo?: string;
  createdAt?: string;
}

interface Cliente {
  id: string;
  nombre: string;
}

interface VentasViewProps {
  refreshKey?: number;
}

export default function VentasView({ refreshKey }: VentasViewProps) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Map<string, Cliente>>(new Map());
  const [loading, setLoading] = useState(true);
  const [semanasMostrar, setSemanasMostrar] = useState(2); // mostrar por defecto 2 semanas

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      // Fetch ventas
      const ventasRes = await authFetch('/api/ventas');
      const ventasData = await ventasRes.json();
      setVentas(ventasData);

      // Fetch clientes para nombres
      const clientesRes = await authFetch('/api/clientes');
      const clientesData = await clientesRes.json();
      const clientesMap = new Map<string, Cliente>(clientesData.map((c: Cliente) => [c.id, c]));
      setClientes(clientesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    // Extraer solo la parte de fecha en UTC sin conversión de zona horaria
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const parseDateUTC = (dateString: string) => {
    const date = new Date(dateString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };

  // Solo ventas desde 2025-10-04
  const FECHA_MINIMA = new Date('2025-10-04T00:00:00Z');
  const ventasDesdeFecha = ventas.filter(v => new Date(v.fechaVenta) >= FECHA_MINIMA);
  const totalVentas = ventasDesdeFecha.reduce((sum, v) => sum + parseFloat(v.totalVenta), 0);

  // Calcular ventas de esta semana completa (lunes a domingo actual)
  const hoy = new Date();
  const diaSemana = hoy.getDay();

  // Calcular días hasta el lunes actual
  const diasHastaLunesActual = diaSemana === 0 ? 6 : diaSemana - 1;
  const fechaLunesActual = new Date(hoy);
  fechaLunesActual.setDate(hoy.getDate() - diasHastaLunesActual);
  fechaLunesActual.setHours(0, 0, 0, 0);

  const fechaDomingoActual = new Date(fechaLunesActual);
  fechaDomingoActual.setDate(fechaLunesActual.getDate() + 6);
  fechaDomingoActual.setHours(23, 59, 59, 999);

  const ventasSemana = ventasDesdeFecha.filter(v => {
    const fechaVenta = parseDateUTC(v.fechaVenta);
    return fechaVenta >= fechaLunesActual && fechaVenta <= fechaDomingoActual;
  });
  const totalVentasSemana = ventasSemana.reduce((sum, v) => sum + parseFloat(v.totalVenta), 0);

  // Registro de ventas: mostrar solo ventas de las últimas N semanas
  const hoyRegistro = new Date();
  hoyRegistro.setHours(0, 0, 0, 0);
  const fechaRegistroInicio = new Date(hoyRegistro);
  const diasMostrar = semanasMostrar * 7;
  fechaRegistroInicio.setDate(hoyRegistro.getDate() - (diasMostrar - 1));
  const ventasRegistro = ventas.filter(v => parseDateUTC(v.fechaVenta) >= fechaRegistroInicio);

  // Ordenar por fecha (día) ascendente; dentro del mismo día ordenar por timestampArchivo (hora)
  const ventasRegistroSorted = [...ventasRegistro].sort((a, b) => {
    const fechaA = parseDateUTC(a.fechaVenta).getTime();
    const fechaB = parseDateUTC(b.fechaVenta).getTime();
    if (fechaA !== fechaB) return fechaA - fechaB;

    const tsA = a.timestampArchivo ? new Date(a.timestampArchivo).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tsB = b.timestampArchivo ? new Date(b.timestampArchivo).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    if (tsA !== tsB) return tsA - tsB;

    return (a.numeroVentaDia || 0) - (b.numeroVentaDia || 0);
  });

  // Calcular numeración por día empezando en 1
  const numeracionPorVenta = new Map<string, number>();
  const contadorPorDiaVenta: Record<string, number> = {};
  ventasRegistroSorted.forEach(v => {
    const key = formatDate(v.fechaVenta);
    contadorPorDiaVenta[key] = (contadorPorDiaVenta[key] || 0) + 1;
    numeracionPorVenta.set(v.id, contadorPorDiaVenta[key]);
  });

  // Mostrar más recientes arriba
  const ventasRegistroSortedDesc = [...ventasRegistroSorted].reverse();
  const hayVentasMasAntiguas = ventas.some(v => parseDateUTC(v.fechaVenta) < fechaRegistroInicio);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
          <div className="flex">
            <div className='w-full'>
              <h3 className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 flex justify-between items-center">
                Total Ventas Realizadas <span className='text-2xl'>🛒</span>
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatMoney(totalVentas.toString())}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold">
                  📊 {ventasSemana.length} ventas esta semana = {formatMoney(totalVentasSemana.toString())}
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* Lista de ventas */}
      <div className="bg-white rounded-xl shadow-lg px-2 py-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 Registro de Ventas
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            Total: {ventasRegistroSortedDesc.length} ventas
          </span>
        </div>
        {/* Desktop/tablet: tabla (oculta en mobile) */}
        <div className="hidden md:block overflow-x-auto">
          {ventasRegistroSortedDesc.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium">No hay ventas registradas</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {ventasRegistroSortedDesc.map((venta, index) => {
                  const fechaActual = formatDate(venta.fechaVenta);
                  const fechaAnterior = index > 0 ? formatDate(ventasRegistroSortedDesc[index - 1].fechaVenta) : null;
                  const cambioFecha = fechaActual !== fechaAnterior;
                  const numeroDia = numeracionPorVenta.get(venta.id) ?? venta.numeroVentaDia ?? (index + 1);
                  
                  return (
                    <Fragment key={venta.id}>
                      {cambioFecha && index > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-2">
                            <div className="border-t-4 border-blue-800"></div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-colors duration-150 border-b border-gray-100">
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{numeroDia}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{fechaActual}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {clientes.get(venta.clienteId)?.nombre || 'Desconocido'}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-purple-600">{formatMoney(venta.totalVenta)}</td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile: lista compacta tipo carta con separadores por fecha */}
        <div className="md:hidden">
          {ventasRegistroSortedDesc.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 text-base font-medium">No hay ventas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ventasRegistroSortedDesc.map((venta, index) => {
                const fechaActual = formatDate(venta.fechaVenta);
                const fechaAnterior = index > 0 ? formatDate(ventasRegistroSortedDesc[index - 1].fechaVenta) : null;
                const numeroDia = numeracionPorVenta.get(venta.id) ?? venta.numeroVentaDia ?? (index + 1);

                return (
                  <Fragment key={venta.id}>
                    {index > 0 && fechaActual !== fechaAnterior && (
                      <div className="w-full">
                        <div className="border-t-4 border-blue-800 my-1"></div>
                      </div>
                    )}

                    <div className="flex flex-col bg-white border rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#{numeroDia}</span>
                          <span className="text-sm font-semibold text-gray-800">{clientes.get(venta.clienteId)?.nombre || 'Desconocido'}</span>
                        </div>
                        <div className="text-sm font-bold text-purple-600">{formatMoney(venta.totalVenta)}</div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                        <span>{fechaActual}</span>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
        {/* Botón para cargar más ventas (2 semanas adicionales) */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setSemanasMostrar(s => s + 2)}
            disabled={!hayVentasMasAntiguas}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${hayVentasMasAntiguas ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Cargar más ventas (2 semanas)
          </button>
        </div>
      </div>
    </div>
  );
}