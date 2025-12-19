'use client';

import { useEffect, useState, Fragment } from 'react';


interface Inversion {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  createdAt: string;
  confirmada?: boolean;
}

interface InversionesManagerProps {
  refreshKey?: number;
}

export default function InversionesManager({ refreshKey }: InversionesManagerProps) {
  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'semana' | 'mes'>('todos');
  const [actionLoading, setActionLoading] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [confirmada, setConfirmada] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInversiones();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchInversiones = async () => {
    try {
      const response = await fetch('/api/inversiones');
      const data = await response.json();
      const inversionesOrdenadas = Array.isArray(data) 
        ? data.sort((a, b) => {
            const fechaCompare = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
            if (fechaCompare !== 0) return fechaCompare;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
        : [];
      setInversiones(inversionesOrdenadas);
    } catch (error) {
      console.error('Error fetching inversiones:', error);
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
    setIsAdding(false);
    setEditingId(null);
    setConfirmada(true);
  };

  const handleSubmit = async () => {
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    setActionLoading(true);
    try {
      const url = editingId ? `/api/inversiones/${editingId}` : '/api/inversiones';
      const method = editingId ? 'PUT' : 'POST';
      const fechaISO = `${fecha}T12:00:00.000Z`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion, monto: parseFloat(monto), fecha: fechaISO, confirmada }),
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (inversion: Inversion) => {
    setDescripcion(inversion.descripcion);
    setMonto(inversion.monto);
    setFecha(new Date(inversion.fecha).toISOString().split('T')[0]);
    setConfirmada(inversion.confirmada ?? true);
    setEditingId(inversion.id);
    setIsAdding(true);
  };

  const handleToggleConfirmado = async (inversion: Inversion) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/inversiones/${inversion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fecha: inversion.fecha,
          descripcion: inversion.descripcion,
          monto: parseFloat(inversion.monto), 
          confirmada: !inversion.confirmada 
        }),
      });
      if (response.ok) fetchInversiones(); else alert('Error al actualizar inversión');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar inversión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) return;

    setActionLoading(true);
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

  const filtrarInversiones = () => {
    const ahora = new Date();
    
    if (filtro === 'semana') {
      const inicioSemana = new Date(ahora);
      const dia = inicioSemana.getDay();
      const diff = dia === 0 ? -6 : 1 - dia;
      inicioSemana.setDate(inicioSemana.getDate() + diff);
      inicioSemana.setHours(0, 0, 0, 0);
      
      return inversiones.filter(inv => new Date(inv.fecha) >= inicioSemana);
    }
    
    if (filtro === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return inversiones.filter(inv => new Date(inv.fecha) >= inicioMes);
    }
    
    return inversiones;
  };

  const inversionesFiltradas = filtrarInversiones();

  const totalInversiones = inversionesFiltradas.reduce((sum, inv) => sum + parseFloat(inv.monto), 0);


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando inversiones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-3 sm:p-4">
        <h3 className="text-base font-bold text-gray-900 mb-2">🔍 Filtrar por período</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFiltro('todos')} className={`px-3 py-1.5 rounded font-semibold text-sm transition-all duration-200 shadow-sm ${filtro === 'todos' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>📅 Todos</button>
          <button onClick={() => setFiltro('semana')} className={`px-3 py-1.5 rounded font-semibold text-sm transition-all duration-200 shadow-sm ${filtro === 'semana' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>📆 Semana</button>
          <button onClick={() => setFiltro('mes')} className={`px-3 py-1.5 rounded font-semibold text-sm transition-all duration-200 shadow-sm ${filtro === 'mes' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🗓️ Mes</button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-shadow duration-200">
        <div className="flex">
          <div className='w-full'>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 flex justify-between items-center">Total Inversiones <span className='text-2xl'>📈</span></h3>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{formatMoney(totalInversiones.toString())}</p>
          </div>
        </div>
      </div>

      {!isAdding && (
        <button onClick={() => setIsAdding(true)} className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg">➕ Agregar Nueva Inversión</button>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-md mx-2 sm:mx-0 sm:max-w-lg bg-white rounded-2xl shadow-2xl px-2 py-4 sm:p-8 border-t-4 border-indigo-500 animate-fadeIn">
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">{editingId ? '✏️ Editar Inversión' : '➕ Nueva Inversión'}</h3>
            <form
              className="flex flex-col gap-4"
              onSubmit={e => { e.preventDefault(); handleSubmit(); }}
              autoComplete="off"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="descripcion">Descripción</label>
                <input
                  id="descripcion"
                  type="text"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Ej: Compra de materiales"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="monto">Monto</label>
                  <input
                    id="monto"
                    type="number"
                    step="0.01"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="fecha">Fecha</label>
                  <input
                    id="fecha"
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmada(c => !c)}
                className={`flex items-center gap-4 w-full p-4 rounded-lg border transition-colors select-none focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-base
                  ${confirmada ? 'bg-green-50 border-green-400 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'}`}
                aria-pressed={confirmada}
              >
                <span className={`flex items-center justify-center rounded-full border-2 ${confirmada ? 'border-green-500 bg-green-500' : 'border-blue-300 bg-white'} w-10 h-10 text-2xl transition-all`}>
                  {confirmada ? '✅' : ''}
                </span>
                <span className="flex-1 text-left">
                  {confirmada
                    ? 'Inversión confirmada (se contabiliza)'
                    : 'Inversión por confirmar (no se contabiliza aún)'}
                </span>
              </button>
              <div className="flex justify-between items-center pt-4 gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-8 py-3 ${actionLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-700'} text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold shadow-md ml-auto`}
                >
                  {actionLoading ? 'Cargando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg px-2 py-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-md md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">📋 Lista de Inversiones {filtro !== 'todos' && (<span className="text-base font-normal text-gray-500">({inversionesFiltradas.length} de {inversiones.length})</span>)}</h3>

        <div className="overflow-x-auto">
          {/* Desktop/tablet: tabla (oculta en mobile) */}
          <div className="hidden md:block">
            {inversionesFiltradas.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg font-medium">{filtro === 'todos' ? 'No hay inversiones registradas' : `No hay inversiones en ${filtro === 'semana' ? 'esta semana' : 'este mes'}`}</p>
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
                  {inversionesFiltradas.map((inversion, index) => {
                    const fechaActual = formatDate(inversion.fecha);
                    const fechaAnterior = index > 0 ? formatDate(inversionesFiltradas[index - 1].fecha) : null;
                    const cambioFecha = fechaActual !== fechaAnterior;

                    return (
                      <Fragment key={inversion.id}>
                        {cambioFecha && index > 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-2">
                              <div className="border-t-4 border-indigo-800"></div>
                            </td>
                          </tr>
                        )}
                        <tr className={`border-b border-gray-100 hover:bg-gradient-to-r transition-colors duration-150 hover:from-indigo-50 hover:to-blue-50`}>
                          <td className="px-6 py-4 text-sm text-gray-600 font-semibold whitespace-nowrap">{formatDate(inversion.fecha)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{inversion.descripcion}</td>
                          <td className="px-6 py-4 text-sm font-bold text-indigo-600 whitespace-nowrap">{formatMoney(inversion.monto)}</td>
                          <td className="px-6 py-4">{!inversion.confirmada ? (<span className="inline-flex items-center px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-semibold">Por confirmar</span>) : (<span className="inline-flex items-center px-3 py-1 text-xs bg-green-200 text-green-800 rounded-full font-semibold">Confirmado</span>)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleToggleConfirmado(inversion)} className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-sm text-sm ${ inversion.confirmada ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`} title={inversion.confirmada ? 'Desconfirmar' : 'Confirmar'}>{inversion.confirmada ? '⏸️' : '✅'}</button>
                              <button onClick={() => handleEdit(inversion)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm" title="Editar">✏️</button>
                              <button onClick={() => handleDelete(inversion.id)} disabled={actionLoading} className={`px-3 py-1.5 ${actionLoading ? 'bg-gray-400' : 'bg-red-100'} text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm`} title="Eliminar">{actionLoading ? 'Cargando...' : '🗑️'}</button>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile: lista compacta tipo carta */}
          <div className="md:hidden">
            {inversionesFiltradas.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 text-base font-medium">{filtro === 'todos' ? 'No hay inversiones registradas' : `No hay inversiones en ${filtro === 'semana' ? 'esta semana' : 'este mes'}`}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inversionesFiltradas.map((inversion, index) => {
                  const fechaActual = formatDate(inversion.fecha);
                  const fechaAnterior = index > 0 ? formatDate(inversionesFiltradas[index - 1].fecha) : null;
                  return (
                    <Fragment key={inversion.id}>
                      {index > 0 && fechaActual !== fechaAnterior && (<div className="w-full"><div className="border-t-4 border-indigo-800 my-1"></div></div>)}
                      <div className="flex flex-col bg-white border rounded-lg py-1 px-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900">{inversion.descripcion}</span>
                              <span className="text-sm font-bold text-indigo-600">{formatMoney(inversion.monto)}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">{fechaActual}</div>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <div>{!inversion.confirmada ? (<span className="inline-flex items-center px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-semibold">Por confirmar</span>) : (<span className="inline-flex items-center px-3 py-1 text-xs bg-green-200 text-green-800 rounded-full font-semibold">Confirmado</span>)}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleToggleConfirmado(inversion)} className="px-2 py-1 rounded-lg text-sm bg-gray-100 hover:bg-gray-200" title={inversion.confirmada ? 'Desconfirmar' : 'Confirmar'}>{inversion.confirmada ? '⏸️' : '✅'}</button>
                            <button onClick={() => handleEdit(inversion)} className="px-2 py-1 rounded-lg text-sm bg-blue-100 hover:bg-blue-200">✏️</button>
                            <button onClick={() => handleDelete(inversion.id)} disabled={actionLoading} className="px-2 py-1 rounded-lg text-sm bg-red-100 hover:bg-red-200">{actionLoading ? '...' : '🗑️'}</button>
                          </div>
                        </div>
                      </div>
                    </Fragment>
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