'use client';

import { useEffect, useState } from 'react';

interface Cliente {
  id: string;
  nombre: string;
  saldoAPagar: string;
  ultimaModificacion: string;
}

export default function DeudoresView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data = await response.json();
      // Filtrar solo deudores y ordenar por saldo descendente
      const deudores = data
        .filter((c: Cliente) => parseFloat(c.saldoAPagar) > 0)
        .sort((a: Cliente, b: Cliente) => parseFloat(b.saldoAPagar) - parseFloat(a.saldoAPagar));
      setClientes(deudores);
    } catch (error) {
      console.error('Error fetching clientes:', error);
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

  const totalDeuda = clientes.reduce((sum, c) => sum + parseFloat(c.saldoAPagar), 0);

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
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
        <h3 className="text-gray-600 text-sm font-medium mb-2">Total Deuda Pendiente</h3>
        <p className="text-3xl font-bold text-orange-600">{formatMoney(totalDeuda.toString())}</p>
        <p className="text-sm text-gray-500 mt-2">{clientes.length} clientes con deuda</p>
      </div>

      {/* Lista de deudores */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Clientes Deudores</h3>
        <div className="overflow-x-auto">
          {clientes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay clientes con deuda pendiente</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo a Pagar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Modificación</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {cliente.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600">
                      {formatMoney(cliente.saldoAPagar)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(cliente.ultimaModificacion)}
                    </td>
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
