'use client';

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
  const [todosClientes, setTodosClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data = await response.json();
      
      // Guardar todos los clientes
      setTodosClientes(data);
      
      // Por defecto mostrar solo deudores ordenados por saldo descendente
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

  // Función de búsqueda difusa (similar)
  const buscarClientesSimilares = (termino: string) => {
    if (!termino.trim()) {
      // Si no hay búsqueda, mostrar solo deudores
      const deudores = todosClientes
        .filter((c: Cliente) => parseFloat(c.saldoAPagar) > 0)
        .sort((a: Cliente, b: Cliente) => parseFloat(b.saldoAPagar) - parseFloat(a.saldoAPagar));
      setClientes(deudores);
      return;
    }

    const terminoLower = termino.toLowerCase().trim();
    
    // Buscar en todos los clientes (con y sin deuda)
    const resultados = todosClientes
      .map((cliente) => {
        const nombreLower = cliente.nombre.toLowerCase();
        let score = 0;

        // Coincidencia exacta
        if (nombreLower === terminoLower) {
          score = 1000;
        }
        // Comienza con el término
        else if (nombreLower.startsWith(terminoLower)) {
          score = 500;
        }
        // Contiene el término
        else if (nombreLower.includes(terminoLower)) {
          score = 100;
        }
        // Coincidencia difusa (letras en orden)
        else {
          let pos = 0;
          for (const char of terminoLower) {
            const found = nombreLower.indexOf(char, pos);
            if (found !== -1) {
              score += 10;
              pos = found + 1;
            }
          }
        }

        return { ...cliente, score };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => {
        // Ordenar primero por score, luego por saldo
        if (b.score !== a.score) return b.score - a.score;
        return parseFloat(b.saldoAPagar) - parseFloat(a.saldoAPagar);
      });

    setClientes(resultados);
  };

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarClientesSimilares(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, todosClientes]);

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-md md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 {searchTerm ? 'Resultados de Búsqueda' : 'Clientes Deudores'}
          </h3>
          <div className="w-full sm:w-auto flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Buscar por nombre..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="mb-3 text-xs text-gray-500 font-medium">
          {clientes.length} {searchTerm ? 'resultado(s) encontrado(s)' : 'cliente(s) con deuda'}
        </div>
        <div className="overflow-x-auto">
          {/* Desktop/tablet: tabla (oculta en mobile) */}
          <div className="hidden md:block">
            {clientes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">{searchTerm ? '🔍' : '✅'}</div>
                <p className="text-gray-500 text-lg font-medium">
                  {searchTerm ? 'No se encontraron clientes con ese nombre' : 'No hay clientes con deuda pendiente'}
                </p>
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
                  {clientes.map((cliente) => {
                    const saldo = parseFloat(cliente.saldoAPagar);
                    const tieneSaldo = saldo > 0;
                    return (
                      <tr key={cliente.id} className={`transition-colors duration-150 ${tieneSaldo ? 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {cliente.nombre}
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold ${tieneSaldo ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatMoney(cliente.saldoAPagar)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(cliente.ultimaModificacion)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile: lista compacta tipo carta */}
          <div className="md:hidden">
            {clientes.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">{searchTerm ? '🔍' : '✅'}</div>
                <p className="text-gray-500 text-base font-medium">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes con deuda pendiente'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientes.map((cliente) => {
                  const saldo = parseFloat(cliente.saldoAPagar);
                  const tieneSaldo = saldo > 0;
                  return (
                    <div key={cliente.id} className={`flex flex-col border rounded-lg p-3 ${tieneSaldo ? 'bg-white' : 'bg-green-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{cliente.nombre}</span>
                          <span className="text-xs text-gray-500">Última: {formatDate(cliente.ultimaModificacion)}</span>
                        </div>
                        <div className={`text-sm font-bold ${tieneSaldo ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatMoney(cliente.saldoAPagar)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}