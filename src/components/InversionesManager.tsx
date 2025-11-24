'use client';

import { useEffect, useState } from 'react';

interface Inversion {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  createdAt: string;
}

export default function InversionesManager() {
  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchInversiones();
  }, []);

  const fetchInversiones = async () => {
    try {
      const response = await fetch('/api/inversiones');
      const data = await response.json();
      setInversiones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inversiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescripcion('');
    setMonto('');
    setFecha(new Date().toISOString().split('T')[0]);
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
      const url = editingId ? `/api/inversiones/${editingId}` : '/api/inversiones';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          monto: parseFloat(monto),
          fecha: new Date(fecha),
        }),
      });

      if (response.ok) {
        resetForm();
        fetchInversiones();
      } else {
        alert('Error al guardar inversión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar inversión');
    }
  };

  const handleEdit = (inversion: Inversion) => {
    setDescripcion(inversion.descripcion);
    setMonto(inversion.monto);
    setFecha(new Date(inversion.fecha).toISOString().split('T')[0]);
    setEditingId(inversion.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) return;

    try {
      const response = await fetch(`/api/inversiones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchInversiones();
      } else {
        alert('Error al eliminar inversión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar inversión');
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

  const totalInversiones = inversiones.reduce((sum, inv) => sum + parseFloat(inv.monto), 0);

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
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Inversiones</h3>
          <p className="text-3xl font-bold text-blue-600">{formatMoney(totalInversiones.toString())}</p>
        </div>
      </div>

      {/* Botón agregar */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
        >
          ➕ Agregar Inversión
        </button>
      )}

      {/* Formulario */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '✏️ Editar Inversión' : '➕ Nueva Inversión'}
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
                placeholder="Ej: Compra de materiales"
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

      {/* Lista de inversiones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Lista de Inversiones</h3>
        <div className="space-y-3">
          {inversiones.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay inversiones registradas</p>
          ) : (
            inversiones.map((inversion) => (
              <div
                key={inversion.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{inversion.descripcion}</h4>
                  <p className="text-sm text-gray-600">{formatDate(inversion.fecha)}</p>
                  <p className="text-lg font-bold text-purple-600 mt-1">
                    {formatMoney(inversion.monto)}
                  </p>
                </div>

                <div className="flex gap-2 mt-3 md:mt-0">
                  <button
                    onClick={() => handleEdit(inversion)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(inversion.id)}
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
