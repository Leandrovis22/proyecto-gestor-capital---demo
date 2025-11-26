'use client';

import { authFetch } from '@/lib/auth';
import { useEffect, useState } from 'react';

interface Gasto {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  confirmado: boolean;
  createdAt: string;
}

interface GastosManagerProps {
  refreshKey?: number;
}

export default function GastosManager({ refreshKey }: GastosManagerProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'semana' | 'mes'>('todos');

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [confirmado, setConfirmado] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGastos();
  }, [refreshKey]);

  const fetchGastos = async () => {
    try {
      const response = await authFetch('/api/gastos');
      const data = await response.json();
      const gastosOrdenados = Array.isArray(data) 
        ? data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        : [];
      setGastos(gastosOrdenados);
    } catch (error) {
      console.error('Error fetching gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescripcion('');
    setMonto('');
    setFecha(() => {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    setConfirmado(true);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    setActionLoading(true);
    try {
      const url = editingId ? `/api/gastos/${editingId}` : '/api/gastos';
      const method = editingId ? 'PUT' : 'POST';

      // Enviar fecha en formato ISO sin conversión de zona horaria
      const fechaISO = `${fecha}T12:00:00.000Z`;

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          monto: parseFloat(monto),
          fecha: fechaISO,
          confirmado,
        }),
      });

      if (response.ok) {
        resetForm();
        fetchGastos();
      } else {
        alert('Error al guardar gasto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar gasto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (gasto: Gasto) => {
    setDescripcion(gasto.descripcion);
    setMonto(gasto.monto);
    setFecha(new Date(gasto.fecha).toISOString().split('T')[0]);
    setConfirmado(gasto.confirmado);
    setEditingId(gasto.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    setActionLoading(true);
    try {
      const response = await authFetch(`/api/gastos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGastos();
      } else {
        alert('Error al eliminar gasto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar gasto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleConfirmado = async (gasto: Gasto) => {
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/gastos/${gasto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gasto,
          monto: parseFloat(gasto.monto),
          confirmado: !gasto.confirmado,
        }),
      });

      if (response.ok) {
        fetchGastos();
      } else {
        alert('Error al actualizar gasto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar gasto');
    } finally {
      setActionLoading(false);
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

  const filtrarGastos = () => {
    const ahora = new Date();
    
    if (filtro === 'semana') {
      const inicioSemana = new Date(ahora);
      const dia = inicioSemana.getDay();
      const diff = dia === 0 ? -6 : 1 - dia;
      inicioSemana.setDate(inicioSemana.getDate() + diff);
      inicioSemana.setHours(0, 0, 0, 0);
      
      return gastos.filter(g => new Date(g.fecha) >= inicioSemana);
    }
    
    if (filtro === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return gastos.filter(g => new Date(g.fecha) >= inicioMes);
    }
    
    return gastos;
  };

  const gastosFiltrados = filtrarGastos();

  const totalConfirmados = gastosFiltrados
    .filter((g) => g.confirmado)
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);

  const totalPorConfirmar = gastosFiltrados
    .filter((g) => !g.confirmado)
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Filtrar por período</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
              filtro === 'todos'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Todos
          </button>
          <button
            onClick={() => setFiltro('semana')}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
              filtro === 'semana'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📆 Esta semana
          </button>
          <button
            onClick={() => setFiltro('mes')}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
              filtro === 'mes'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🗓️ Este mes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg p-8 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos Confirmados</h3>
              <p className="text-5xl font-bold text-red-600">{formatMoney(totalConfirmados.toString())}</p>
            </div>
            <div className="text-6xl">💸</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg p-8 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Por Confirmar</h3>
              <p className="text-5xl font-bold text-yellow-600">{formatMoney(totalPorConfirmar.toString())}</p>
            </div>
            <div className="text-6xl">⏳</div>
          </div>
        </div>
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
        >
          ➕ Agregar Nuevo Gasto
        </button>
      )}

      {isAdding && (
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            {editingId ? '✏️ Editar Gasto' : '➕ Nuevo Gasto'}
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ej: Pago de alquiler"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="confirmado"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="confirmado" className="text-sm font-medium text-gray-700">
                Gasto confirmado (si no está confirmado, es un gasto a futuro que no se contabiliza aún)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={actionLoading}
                className={`px-8 py-3 ${actionLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md`}
              >
                {actionLoading ? 'Cargando...' : editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📋 Lista de Gastos
          {filtro !== 'todos' && (
            <span className="text-base font-normal text-gray-500">
              ({gastosFiltrados.length} de {gastos.length})
            </span>
          )}
        </h3>
        <div className="overflow-x-auto">
          {gastosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium">
                {filtro === 'todos' 
                  ? 'No hay gastos registrados' 
                  : `No hay gastos en ${filtro === 'semana' ? 'esta semana' : 'este mes'}`}
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {gastosFiltrados.map((gasto) => (
                  <tr 
                    key={gasto.id} 
                    className={`border-b border-gray-100 hover:bg-gradient-to-r transition-colors duration-150 ${
                      gasto.confirmado 
                        ? 'hover:from-gray-50 hover:to-gray-100' 
                        : 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold whitespace-nowrap">
                      {formatDate(gasto.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {gasto.descripcion}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 whitespace-nowrap">
                      {formatMoney(gasto.monto)}
                    </td>
                    <td className="px-6 py-4">
                      {!gasto.confirmado && (
                        <span className="inline-flex items-center px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-semibold">
                          Por confirmar
                        </span>
                      )}
                      {gasto.confirmado && (
                        <span className="inline-flex items-center px-3 py-1 text-xs bg-green-200 text-green-800 rounded-full font-semibold">
                          Confirmado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleConfirmado(gasto)}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm ${
                            gasto.confirmado
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={gasto.confirmado ? 'Desconfirmar' : 'Confirmar'}
                        >
                          {gasto.confirmado ? '⏸️' : '✅'}
                        </button>
                        <button
                          onClick={() => handleEdit(gasto)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(gasto.id)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 ${actionLoading ? 'bg-gray-400' : 'bg-red-100'} text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm`}
                          title="Eliminar"
                        >
                          {actionLoading ? 'Cargando...' : '🗑️'}
                        </button>
                      </div>
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