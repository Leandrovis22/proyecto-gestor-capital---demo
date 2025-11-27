'use client';

import { authFetch } from '@/lib/auth';
import { useEffect, useState } from 'react';

interface Cliente {
  id: string;
  nombre: string;
  saldoAPagar: string;
  ultimaModificacion: string;
}

interface DeudoresViewProps {
  refreshKey?: number;
}

export default function DeudoresView({ refreshKey }: DeudoresViewProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchClientes = async () => {
    try {
      const response = await authFetch('/api/clientes');
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
    // Extraer solo la parte de fecha en UTC sin conversión de zona horaria
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const totalDeuda = clientes.reduce((sum, c) => sum + parseFloat(c.saldoAPagar), 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando deudores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
        <div className="flex">
          <div className='w-full'>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 flex justify-between items-center">
              Total Deuda Pendiente <span className='text-2xl'>⚠️</span>
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{formatMoney(totalDeuda.toString())}</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs sm:text-sm font-semibold">
                👥 {clientes.length} clientes con deuda
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de deudores */}
      <div className="bg-white rounded-xl shadow-lg px-2 py-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 Clientes Deudores
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            Total: {clientes.length} clientes
          </span>
        </div>
        <div className="overflow-x-auto">
          {/* Desktop/tablet: tabla (oculta en mobile) */}
          <div className="hidden md:block">
            {clientes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-gray-500 text-lg font-medium">No hay clientes con deuda pendiente</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Saldo a Pagar</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Última Modificación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {cliente.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600">
                        {formatMoney(cliente.saldoAPagar)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(cliente.ultimaModificacion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile: lista compacta tipo carta */}
          <div className="md:hidden">
            {clientes.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-gray-500 text-base font-medium">No hay clientes con deuda pendiente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientes.map((cliente) => (
                  <div key={cliente.id} className="flex flex-col bg-white border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{cliente.nombre}</span>
                        <span className="text-xs text-gray-500">Última: {formatDate(cliente.ultimaModificacion)}</span>
                      </div>
                      <div className="text-sm font-bold text-orange-600">{formatMoney(cliente.saldoAPagar)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}