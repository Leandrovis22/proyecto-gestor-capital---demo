'use client';

import { useEffect, useState } from 'react';

interface Venta {
  id: string;
  clienteId: string;
  fechaVenta: string;
  totalVenta: string;
  numeroVentaDia: number;
}

interface Cliente {
  id: string;
  nombre: string;
}

export default function VentasView() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Map<string, Cliente>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ventas
      const ventasRes = await fetch('/api/ventas');
      const ventasData = await ventasRes.json();
      setVentas(ventasData);

      // Fetch clientes para nombres
      const clientesRes = await fetch('/api/clientes');
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
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.totalVenta), 0);

  // Calcular ventas de esta semana
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo de esta semana
  inicioSemana.setHours(0, 0, 0, 0);

  const ventasEstaSemana = ventas.filter(v => new Date(v.fechaVenta) >= inicioSemana).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <h3 className="text-gray-600 text-sm font-medium mb-2">Total Ventas</h3>
        <p className="text-3xl font-bold text-purple-600">{formatMoney(totalVentas.toString())}</p>
        <p className="text-sm text-gray-500 mt-2">{ventasEstaSemana} ventas registradas esta semana</p>
      </div>

      {/* Lista de ventas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Últimas Ventas</h3>
        <div className="overflow-x-auto">
          {ventas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay ventas registradas</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {clientes.get(venta.clienteId)?.nombre || 'Desconocido'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(venta.fechaVenta)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-purple-600">{formatMoney(venta.totalVenta)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">#{venta.numeroVentaDia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
