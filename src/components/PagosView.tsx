'use client';

import { useEffect, useState } from 'react';

interface Pago {
  id: string;
  clienteId: string;
  fechaPago: string;
  monto: string;
  tipoPago: string;
  numeroPagoDia: number;
}

interface Cliente {
  id: string;
  nombre: string;
}

export default function PagosView() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Map<string, Cliente>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pagos
      const pagosRes = await fetch('/api/pagos');
      const pagosData = await pagosRes.json();
      setPagos(pagosData);

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

  const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  // Calcular pagos de esta semana
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo de esta semana
  inicioSemana.setHours(0, 0, 0, 0);

  const pagosEstaSemana = pagos.filter(p => new Date(p.fechaPago) >= inicioSemana).length;

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
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <h3 className="text-gray-600 text-sm font-medium mb-2">Total Pagos</h3>
        <p className="text-3xl font-bold text-green-600">{formatMoney(totalPagos.toString())}</p>
        <p className="text-sm text-gray-500 mt-2">{pagosEstaSemana} pagos registrados esta semana</p>
      </div>

      {/* Lista de pagos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Últimos Pagos</h3>
        <div className="overflow-x-auto">
          {pagos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pagos registrados</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {clientes.get(pago.clienteId)?.nombre || 'Desconocido'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(pago.fechaPago)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pago.tipoPago}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">#{pago.numeroPagoDia}</td>
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
