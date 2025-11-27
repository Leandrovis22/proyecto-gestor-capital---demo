'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';

interface DashboardData {
  capital: {
    total: number;
    inversiones: number;
    inversionesNoConfirmadas?: number;
    gastosNoConfirmadas?: number;
    pagos: number;
    ventas: number;
    gastos: number;
  };
  semanaPasada?: {
    inversiones: number;
    inversionesNoConfirmadas?: number;
    gastosNoConfirmadas?: number;
    pagos: number;
    ventas: number;
    gastos: number;
    rangoFechas?: { inicio: string | Date; fin: string | Date };
  };
  semanaActual?: {
    inversiones: number;
    inversionesNoConfirmadas?: number;
    gastosNoConfirmadas?: number;
    pagos: number;
    ventas: number;
    gastos: number;
    rangoFechas?: { inicio: string | Date; fin: string | Date };
  };
  saldoDeudores: number;
  ultimasPagos: Array<{
    id: string;
    fechaPago: string;
    monto: string;
    cliente: { nombre: string };
  }>;
  ultimasVentas: Array<{
    id: string;
    fechaVenta: string;
    totalVenta: string;
    cliente: { nombre: string };
  }>;
  clientesDeudores: Array<{
    nombre: string;
    saldoAPagar: string;
  }>;
  fechaActualizacion: string;
}

interface DashboardProps {
  refreshKey?: number;
  onUpdate?: (fecha: string) => void;
}

export default function Dashboard({ refreshKey, onUpdate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Pequeño delay para asegurar que el token esté disponible
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      const response = await authFetch('/api/dashboard');
      const json = await response.json();
      setData(json);
      if (onUpdate && json.fechaActualizacion) {
        onUpdate(json.fechaActualizacion);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando dashboard...</p>
      </div>
    );
  }

  if (!data || !data.capital) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border-l-4 border-red-500">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-red-600 mb-2">Error al cargar datos</h3>
        <p className="text-gray-600">No se pudieron obtener los datos del dashboard. Por favor, intenta actualizar la página.</p>
      </div>
    );
  }

  const formatMoney = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    // Extraer solo la parte de fecha en UTC sin conversión de zona horaria
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  // No collapsible sections: siempre mostramos el Total Histórico

  return (
    <div className="space-y-8">

 {/* Sección: Esta Semana (si existe) */}
      {data.semanaActual && (
        <div>
          <h2 className="text-lg font-semibold mb-3">📅 Esta Semana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones</h3>
              <p className="text-2xl sm:text-4xl font-bold text-purple-600">{formatMoney(data.semanaActual.inversiones)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Pagos</h3>
              <p className="text-2xl sm:text-4xl font-bold text-green-600">{formatMoney(data.semanaActual.pagos)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Ventas</h3>
              <p className="text-2xl sm:text-4xl font-bold text-orange-600">{formatMoney(data.semanaActual.ventas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos</h3>
              <p className="text-2xl sm:text-4xl font-bold text-red-600">{formatMoney(data.semanaActual.gastos)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sección: Semana Pasada (si existe) */}
      {data.semanaPasada && (
        <div>
          <h2 className="text-lg font-semibold mb-3">📅 Semana Pasada</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones</h3>
              <p className="text-2xl sm:text-4xl font-bold text-purple-600">{formatMoney(data.semanaPasada.inversiones)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Pagos</h3>
              <p className="text-2xl sm:text-4xl font-bold text-green-600">{formatMoney(data.semanaPasada.pagos)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Ventas</h3>
              <p className="text-2xl sm:text-4xl font-bold text-orange-600">{formatMoney(data.semanaPasada.ventas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos</h3>
              <p className="text-2xl sm:text-4xl font-bold text-red-600">{formatMoney(data.semanaPasada.gastos)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mostramos sólo el Total Histórico (siempre visible) */}

      {/* Sección: Total Histórico (siempre visible) */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-3">📊 Total Histórico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 hover:shadow-xl transition-shadow duration-200 ${
          data.capital.total >= 0 ? 'border-green-500' : 'border-red-500'
        }`}>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Capital Total</h3>
          <p className={`text-2xl md:text-4xl font-bold ${
            data.capital.total >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatMoney(data.capital.total)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones</h3>
          <p className="text-2xl md:text-4xl font-bold text-purple-600">{formatMoney(data.capital.inversiones)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Pagos (desde 04/11)</h3>
          <p className="text-2xl md:text-4xl font-bold text-green-600">{formatMoney(data.capital.pagos)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Ventas (desde 04/11)</h3>
          <p className="text-2xl md:text-4xl font-bold text-orange-600">{formatMoney(data.capital.ventas)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos</h3>
          <p className="text-2xl md:text-4xl font-bold text-red-600">{formatMoney(data.capital.gastos)}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones (Por confirmar)</h3>
          <p className="text-2xl md:text-4xl font-bold text-yellow-600">{formatMoney(data.capital.inversionesNoConfirmadas || 0)}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos (Por confirmar)</h3>
          <p className="text-2xl md:text-4xl font-bold text-yellow-600">{formatMoney(data.capital.gastosNoConfirmadas || 0)}</p>
        </div>
        </div>
      </div>

      {/* Últimos pagos y ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Pagos */}
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            💰 Últimos 10 Pagos
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.ultimasPagos.slice(0, 10).map((pago) => (
              <div key={pago.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{pago.cliente.nombre}</p>
                  <p className="text-sm text-gray-500">{formatDate(pago.fechaPago)}</p>
                </div>
                <p className="font-bold text-green-600 text-base sm:text-lg">{formatMoney(pago.monto)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            🛍️ Últimas 10 Ventas
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.ultimasVentas.slice(0, 10).map((venta) => (
              <div key={venta.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{venta.cliente.nombre}</p>
                  <p className="text-sm text-gray-500">{formatDate(venta.fechaVenta)}</p>
                </div>
                <p className="font-bold text-orange-600 text-base sm:text-lg">{formatMoney(venta.totalVenta)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Deudores */}
      <div className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          📊 Últimos 10 Clientes Deudores
        </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.clientesDeudores.map((cliente, index) => (
            <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg hover:shadow-md transition-all duration-200 border border-blue-100">
              <p className="font-semibold text-gray-900 flex-1">{cliente.nombre}</p>
              <p className="font-bold text-blue-600 text-base sm:text-lg">{formatMoney(cliente.saldoAPagar)}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}