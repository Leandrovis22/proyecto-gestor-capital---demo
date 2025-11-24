'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  capital: {
    total: number;
    inversiones: number;
    pagos: number;
    ventas: number;
    gastos: number;
  };
  capitalSemana: {
    total: number;
    inversiones: number;
    pagos: number;
    ventas: number;
    gastos: number;
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || !data.capital) {
    return (
      <div className="text-center py-12 text-red-600">
        Error al cargar datos del dashboard
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
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Sección: Esta Semana */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Esta Semana</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            data.capitalSemana.total >= 0 ? 'border-green-500' : 'border-red-500'
          }`}>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Capital Semanal</h3>
            <p className={`text-3xl font-bold ${
              data.capitalSemana.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatMoney(data.capitalSemana.total)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Inversiones</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatMoney(data.capitalSemana.inversiones)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pagos</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatMoney(data.capitalSemana.pagos)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Ventas</h3>
            <p className="text-3xl font-bold text-orange-600">
              {formatMoney(data.capitalSemana.ventas)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Gastos</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatMoney(data.capitalSemana.gastos)}
            </p>
          </div>
        </div>
      </div>

      {/* Sección: Totales */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Totales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
          data.capital.total >= 0 ? 'border-green-500' : 'border-red-500'
        }`}>
          <h3 className="text-gray-600 text-sm font-medium mb-2">Capital Total</h3>
          <p className={`text-3xl font-bold ${
            data.capital.total >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatMoney(data.capital.total)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Saldo Deudores</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatMoney(data.saldoDeudores)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Inversiones</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatMoney(data.capital.inversiones)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Pagos (desde 04/11)</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatMoney(data.capital.pagos)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Ventas (desde 04/11)</h3>
          <p className="text-3xl font-bold text-orange-600">
            {formatMoney(data.capital.ventas)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Gastos</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatMoney(data.capital.gastos)}
          </p>
        </div>
        </div>
      </div>

      {/* Últimos pagos y ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Pagos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Últimos 10 Pagos</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.ultimasPagos.slice(0, 10).map((pago) => (
              <div key={pago.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{pago.cliente.nombre}</p>
                  <p className="text-sm text-gray-600">{formatDate(pago.fechaPago)}</p>
                </div>
                <p className="font-bold text-green-600">{formatMoney(pago.monto)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🛍️ Últimas 10 Ventas</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.ultimasVentas.slice(0, 10).map((venta) => (
              <div key={venta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{venta.cliente.nombre}</p>
                  <p className="text-sm text-gray-600">{formatDate(venta.fechaVenta)}</p>
                </div>
                <p className="font-bold text-orange-600">{formatMoney(venta.totalVenta)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Deudores */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Top 10 Clientes Deudores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.clientesDeudores.map((cliente, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 flex-1">{cliente.nombre}</p>
              <p className="font-bold text-blue-600">{formatMoney(cliente.saldoAPagar)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500">
        Última actualización: {formatDate(data.fechaActualizacion)}
      </div>
    </div>
  );
}
