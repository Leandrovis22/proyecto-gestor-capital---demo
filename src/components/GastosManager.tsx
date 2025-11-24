'use client';

import { useEffect, useState } from 'react';

interface Gasto {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  confirmado: boolean;
  createdAt: string;
}

export default function GastosManager() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [confirmado, setConfirmado] = useState(true);

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    try {
      const response = await fetch('/api/gastos');
      const data = await response.json();
      setGastos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescripcion('');
    setMonto('');
    setFecha(new Date().toISOString().split('T')[0]);
    setConfirmado(true);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      const url = editingId ? `/api/gastos/${editingId}` : '/api/gastos';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          monto: parseFloat(monto),
          fecha: new Date(fecha),
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

    try {
      const response = await fetch(`/api/gastos/${id}`, {
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
    }
  };

  const handleToggleConfirmado = async (gasto: Gasto) => {
    try {
      const response = await fetch(`/api/gastos/${gasto.id}`, {
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

  const totalConfirmados = gastos
    .filter((g) => g.confirmado)
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);

  const totalPorConfirmar = gastos
    .filter((g) => !g.confirmado)
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Gastos Confirmados</h3>
          <p className="text-3xl font-bold text-red-600">{formatMoney(totalConfirmados.toString())}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Gastos Por Confirmar</h3>
          <p className="text-3xl font-bold text-yellow-600">{formatMoney(totalPorConfirmar.toString())}</p>
        </div>
      </div>

      {/* Botón agregar */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
        >
          ➕ Agregar Gasto
        </button>
      )}

      {/* Formulario */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '✏️ Editar Gasto' : '➕ Nuevo Gasto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Pago de alquiler"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
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

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de gastos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Lista de Gastos</h3>
        <div className="space-y-3">
          {gastos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay gastos registrados</p>
          ) : (
            gastos.map((gasto) => (
              <div
                key={gasto.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border-2 ${
                  gasto.confirmado
                    ? 'bg-white border-gray-200'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{gasto.descripcion}</h4>
                    {!gasto.confirmado && (
                      <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-medium">
                        Por confirmar
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(gasto.fecha)}</p>
                  <p className="text-lg font-bold text-red-600 mt-1">
                    {formatMoney(gasto.monto)}
                  </p>
                </div>

                <div className="flex gap-2 mt-3 md:mt-0">
                  <button
                    onClick={() => handleToggleConfirmado(gasto)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      gasto.confirmado
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {gasto.confirmado ? '⏸️ Desconfirmar' : '✅ Confirmar'}
                  </button>
                  <button
                    onClick={() => handleEdit(gasto)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(gasto.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
