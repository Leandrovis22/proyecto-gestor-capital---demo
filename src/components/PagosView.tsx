'use client';

import { useState, useEffect, Fragment } from 'react';
import { formatTipoPago } from '@/lib/demoData';

interface Pago {
  id: string;
  clienteId: string;
  fechaPago: string;
  monto: string;
  tipoPago: string;
  numeroPagoDia: number;
  timestampArchivo?: string;
  createdAt?: string;
}

interface Cliente {
  id: string;
  nombre: string;
}

interface Gasto {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  confirmado: boolean;
}

interface PagosViewProps {
  refreshKey?: number;
}

export default function PagosView({ refreshKey }: PagosViewProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [clientes, setClientes] = useState<Map<string, Cliente>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [usarHoy, setUsarHoy] = useState(true);
  const [detalleVisible, setDetalleVisible] = useState<string | null>(null);
  const [semanasMostrar, setSemanasMostrar] = useState(2); // Mostrar por defecto 2 semanas

  useEffect(() => {
    // Pequeño delay para asegurar que el token esté disponible
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    // Inicializar fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${year}-${month}-${day}`;
    setFechaInicio(fechaHoy);
    setFechaFin(fechaHoy);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      // Fetch pagos
      const pagosRes = await fetch('/api/pagos');
      let pagosData: any = await pagosRes.json();

      // Normalizar la respuesta a un array para evitar errores si viene en otra forma
      const normalizeToArray = (data: any) => {
        if (Array.isArray(data)) return data;
        if (!data) return [];
        if (Array.isArray(data.rows)) return data.rows;
        if (Array.isArray(data.data)) return data.data;
        // Objeto con claves numéricas (resultado serializado de algunas librerías)
        const keys = Object.keys(data);
        const numericKeys = keys.filter(k => String(Number(k)) === k).sort((a, b) => Number(a) - Number(b));
        if (numericKeys.length) return numericKeys.map(k => data[k]);
        return [];
      };

      const pagosList = normalizeToArray(pagosData);
      setPagos(pagosList);

      // Fetch clientes para nombres
      const clientesRes = await fetch('/api/clientes');
      const clientesData = await clientesRes.json();
      const clientesMap = new Map<string, Cliente>(clientesData.map((c: Cliente) => [c.id, c]));
      setClientes(clientesMap);

      // Fetch gastos
      const gastosRes = await fetch('/api/gastos');
      const gastosData = await gastosRes.json();
      setGastos(Array.isArray(gastosData) ? gastosData : []);
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
    // Extraer solo la parte de fecha en UTC sin conversión de zona horaria
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const parseDateUTC = (dateString: string) => {
    // Parsear fecha ignorando zona horaria, tratarla como está
    const date = new Date(dateString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };

  const calcularEstadisticasPeriodo = () => {
    let pagosFiltrados = pagos;

    if (usarHoy) {
      // Solo pagos de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);

      pagosFiltrados = pagos.filter(p => {
        const fechaPago = parseDateUTC(p.fechaPago);
        return fechaPago >= hoy && fechaPago < manana;
      });
    } else if (fechaInicio && fechaFin) {
      // Pagos en el rango de fechas - parsear como fecha local sin conversión
      const [yearInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
      const inicio = new Date(yearInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0);

      const [yearFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
      const fin = new Date(yearFin, mesFin - 1, diaFin, 23, 59, 59, 999);

      pagosFiltrados = pagos.filter(p => {
        const fechaPago = parseDateUTC(p.fechaPago);
        return fechaPago >= inicio && fechaPago <= fin;
      });
    }

    let totalJefe = 0;
    let totalEmpleado = 0;
    let totalEfectivo = 0;
    let totalOtros = 0;
    let pagosJefe: Pago[] = [];
    let pagosEmpleado: Pago[] = [];
    let pagosEfectivo: Pago[] = [];
    let pagosOtros: Pago[] = [];

    pagosFiltrados.forEach(pago => {
      const monto = parseFloat(pago.monto);
      const tipoLower = pago.tipoPago ? pago.tipoPago.toLowerCase().trim() : '';

      // Buscar "jefe" para Transferencia a Jefe
      if (tipoLower.includes('jefe')) {
        totalJefe += monto;
        pagosJefe.push(pago);
      }
      // Buscar "empleado" para Transferencia a Empleado
      else if (tipoLower.includes('empleado')) {
        totalEmpleado += monto;
        pagosEmpleado.push(pago);
      }
      // Buscar "efe" para efectivo
      else if (tipoLower.includes('efe')) {
        totalEfectivo += monto;
        pagosEfectivo.push(pago);
      }
      // Todo lo demás va a otros
      else {
        totalOtros += monto;
        pagosOtros.push(pago);
      }
    });

    return {
      totalJefe,
      totalEmpleado,
      totalEfectivo,
      totalOtros,
      cantidadPagos: pagosFiltrados.length,
      pagosJefe,
      pagosEmpleado,
      pagosEfectivo,
      pagosOtros
    };
  };

  const stats = calcularEstadisticasPeriodo();

  // Calcular pagos y gastos según el filtro de fecha
  let pagosFiltradosFecha: Pago[] = [];
  let gastosFiltradosFecha: Gasto[] = [];
  let fechaInicioDisplay = '';
  let fechaFinDisplay = '';

  if (usarHoy) {
    // Solo datos de hoy
    const hoyCalc = new Date();
    hoyCalc.setHours(0, 0, 0, 0);
    const mananaCalc = new Date(hoyCalc);
    mananaCalc.setDate(hoyCalc.getDate() + 1);

    pagosFiltradosFecha = pagos.filter(p => {
      const fechaPago = parseDateUTC(p.fechaPago);
      return fechaPago >= hoyCalc && fechaPago < mananaCalc;
    });

    gastosFiltradosFecha = gastos.filter(g => {
      const fechaGasto = new Date(g.fecha);
      fechaGasto.setHours(0, 0, 0, 0);
      return fechaGasto >= hoyCalc && fechaGasto < mananaCalc && g.confirmado;
    });

    const hoyFormat = new Date();
    const day = String(hoyFormat.getDate()).padStart(2, '0');
    const month = String(hoyFormat.getMonth() + 1).padStart(2, '0');
    fechaInicioDisplay = `${day}/${month}`;
    fechaFinDisplay = `${day}/${month}`;
  } else if (fechaInicio && fechaFin) {
    // Datos en el rango de fechas
    const [yearInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
    const inicio = new Date(yearInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0);

    const [yearFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
    const fin = new Date(yearFin, mesFin - 1, diaFin, 23, 59, 59, 999);

    pagosFiltradosFecha = pagos.filter(p => {
      const fechaPago = parseDateUTC(p.fechaPago);
      return fechaPago >= inicio && fechaPago <= fin;
    });

    gastosFiltradosFecha = gastos.filter(g => {
      const fechaGasto = new Date(g.fecha);
      fechaGasto.setHours(0, 0, 0, 0);
      return fechaGasto >= inicio && fechaGasto <= fin && g.confirmado;
    });

    fechaInicioDisplay = `${String(diaInicio).padStart(2, '0')}/${String(mesInicio).padStart(2, '0')}`;
    fechaFinDisplay = `${String(diaFin).padStart(2, '0')}/${String(mesFin).padStart(2, '0')}`;
  }

  const totalPagosFiltrados = pagosFiltradosFecha.reduce((sum, p) => sum + parseFloat(p.monto), 0);
  const totalGastosFiltrados = gastosFiltradosFecha.reduce((sum, g) => sum + parseFloat(g.monto), 0);
  const balanceFiltrado = totalPagosFiltrados - totalGastosFiltrados;

  // Formato del título
  const rangoFechas = fechaInicioDisplay === fechaFinDisplay ? fechaInicioDisplay : `${fechaInicioDisplay} a ${fechaFinDisplay}`;

  // Solo pagos desde 2025-10-04
  const FECHA_MINIMA = new Date('2025-10-04T00:00:00Z');
  const pagosDesdeFecha = pagos.filter(p => new Date(p.fechaPago) >= FECHA_MINIMA);
  const totalPagos = pagosDesdeFecha.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  // Calcular pagos de esta semana completa (lunes a domingo actual)
  const hoy = new Date();
  const diaSemana = hoy.getDay();

  // Calcular días hasta el lunes actual
  const diasHastaLunesActual = diaSemana === 0 ? 6 : diaSemana - 1;
  const fechaLunesActual = new Date(hoy);
  fechaLunesActual.setDate(hoy.getDate() - diasHastaLunesActual);
  fechaLunesActual.setHours(0, 0, 0, 0);

  const fechaDomingoActual = new Date(fechaLunesActual);
  fechaDomingoActual.setDate(fechaLunesActual.getDate() + 6);
  fechaDomingoActual.setHours(23, 59, 59, 999);

  const pagosSemana = pagosDesdeFecha.filter(p => {
    const fechaPago = new Date(p.fechaPago);
    return fechaPago >= fechaLunesActual && fechaPago <= fechaDomingoActual;
  });
  const totalPagosSemana = pagosSemana.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  // Registro de pagos: mostrar solo pagos de las últimas 2 semanas (últimos 14 días incluyendo hoy)
  const hoyRegistro = new Date();
  hoyRegistro.setHours(0, 0, 0, 0);
  const fechaRegistroInicio = new Date(hoyRegistro);
  // semanasMostrar semanas (cada semana = 7 días). Restamos (days - 1) para incluir hoy.
  const diasMostrar = semanasMostrar * 7;
  fechaRegistroInicio.setDate(hoyRegistro.getDate() - (diasMostrar - 1));
  const pagosRegistro = pagos.filter(p => parseDateUTC(p.fechaPago) >= fechaRegistroInicio);

  // Ordenar por fecha (día) ascendente; dentro del mismo día ordenar por timestampArchivo (hora)
  // Si falta timestampArchivo, usar createdAt como fallback
  const pagosRegistroSorted = [...pagosRegistro].sort((a, b) => {
    const fechaA = parseDateUTC(a.fechaPago).getTime();
    const fechaB = parseDateUTC(b.fechaPago).getTime();
    if (fechaA !== fechaB) return fechaA - fechaB;

    const tsA = a.timestampArchivo ? new Date(a.timestampArchivo).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tsB = b.timestampArchivo ? new Date(b.timestampArchivo).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    if (tsA !== tsB) return tsA - tsB;

    return (a.numeroPagoDia || 0) - (b.numeroPagoDia || 0);
  });

  // Calcular numeración por día empezando en 1
  const numeracionPorPago = new Map<string, number>();
  const contadorPorDia: Record<string, number> = {};
  pagosRegistroSorted.forEach(p => {
    const key = formatDate(p.fechaPago); // dd/mm/yyyy
    contadorPorDia[key] = (contadorPorDia[key] || 0) + 1;
    numeracionPorPago.set(p.id, contadorPorDia[key]);
  });

  // Mostrar más recientes arriba (descendente) pero conservar la numeración calculada
  const pagosRegistroSortedDesc = [...pagosRegistroSorted].reverse();

  // Determinar si hay pagos más antiguos fuera del rango actual
  const hayPagosMasAntiguos = pagos.some(p => parseDateUTC(p.fechaPago) < fechaRegistroInicio);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Filtrar por Fecha</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usarHoy"
              checked={usarHoy}
              onChange={(e) => setUsarHoy(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="usarHoy" className="text-sm font-medium text-gray-700">
              Solo hoy
            </label>
          </div>
          {!usarHoy && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas por tipo de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Jefe */}
        <div
          onClick={() => setDetalleVisible(detalleVisible === 'jefe' ? null : 'jefe')}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Transferencia a Jefe</h4>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700">{formatMoney(stats.totalJefe.toString())}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">{stats.pagosJefe.length} pagos - Click para ver detalle</p>
        </div>

        {/* Mobile: detalle inline debajo de la card Jefe */}
        {detalleVisible === 'jefe' && (
          <div className="md:hidden bg-white rounded-xl shadow mt-3 py-4 px-2 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">📋 Transferencias a Jefe</h4>
              <button onClick={() => setDetalleVisible(null)} className="text-sm text-red-500 font-semibold">✕ Cerrar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody>
                  {stats.pagosJefe.map((pago) => (
                    <tr key={pago.id} className="border-t">
                      <td className="py-2 text-sm text-gray-600">{formatDate(pago.fechaPago)}</td>
                      <td className="py-2 px-2 text-sm font-semibold">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</td>
                      <td className="py-2 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empleado */}
        <div
          onClick={() => setDetalleVisible(detalleVisible === 'empleado' ? null : 'empleado')}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Transferencia a Empleado</h4>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-700">{formatMoney(stats.totalEmpleado.toString())}</p>
          <p className="text-xs text-purple-600 mt-2 font-medium">{stats.pagosEmpleado.length} pagos - Click para ver detalle</p>
        </div>

        {/* Mobile: detalle inline debajo de la card Empleado */}
        {detalleVisible === 'empleado' && (
          <div className="md:hidden bg-white rounded-xl shadow mt-3 py-4 px-2 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">📋 Transferencias a Empleado</h4>
              <button onClick={() => setDetalleVisible(null)} className="text-sm text-red-500 font-semibold">✕ Cerrar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody>
                  {stats.pagosEmpleado.map((pago) => (
                    <tr key={pago.id} className="border-t">
                      <td className="py-2 text-sm text-gray-600">{formatDate(pago.fechaPago)}</td>
                      <td className="py-2 px-2 text-sm font-semibold">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</td>
                      <td className="py-2 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Efectivo */}
        <div
          onClick={() => setDetalleVisible(detalleVisible === 'efectivo' ? null : 'efectivo')}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Efectivo</h4>
            <span className="text-2xl sm:text-3xl">💵</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{formatMoney(stats.totalEfectivo.toString())}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">{stats.pagosEfectivo.length} pagos - Click para ver detalle</p>
        </div>

        {/* Mobile: detalle inline debajo de la card Efectivo */}
        {detalleVisible === 'efectivo' && (
          <div className="md:hidden bg-white rounded-xl shadow mt-3 py-4 px-2 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">📋 Pagos en Efectivo</h4>
              <button onClick={() => setDetalleVisible(null)} className="text-sm text-red-500 font-semibold">✕ Cerrar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody>
                  {stats.pagosEfectivo.map((pago) => (
                    <tr key={pago.id} className="border-t">
                      <td className="py-2 text-sm text-gray-600">{formatDate(pago.fechaPago)}</td>
                      <td className="py-2 px-2 text-sm font-semibold">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</td>
                      <td className="py-2 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Otros */}
        <div
          onClick={() => setDetalleVisible(detalleVisible === 'otros' ? null : 'otros')}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Otros/Sin Cat.</h4>
            <span className="text-2xl sm:text-3xl">❓</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-700">{formatMoney(stats.totalOtros.toString())}</p>
          <p className="text-xs text-orange-600 mt-2 font-medium">{stats.pagosOtros.length} pagos - Click para ver detalle</p>
        </div>

        {/* Mobile: detalle inline debajo de la card Otros */}
        {detalleVisible === 'otros' && (
          <div className="md:hidden bg-white rounded-xl shadow mt-3 py-4 px-2 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">📋 Otros Pagos</h4>
              <button onClick={() => setDetalleVisible(null)} className="text-sm text-red-500 font-semibold">✕ Cerrar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody>
                  {stats.pagosOtros.map((pago) => (
                    <tr key={pago.id} className="border-t">
                      <td className="py-2 text-sm text-gray-600">{formatDate(pago.fechaPago)}</td>
                      <td className="py-2 px-2 text-sm font-semibold">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</td>
                      <td className="py-2 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de pagos por categoría (desktop) */}
      {detalleVisible && ['jefe', 'empleado', 'efectivo', 'otros'].includes(detalleVisible) && (
        <div className="hidden md:block">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              📋 Detalle de {
                detalleVisible === 'jefe' ? 'Transferencias a Jefe' :
                  detalleVisible === 'empleado' ? 'Transferencias a Empleado' :
                    detalleVisible === 'efectivo' ? 'Pagos en Efectivo' :
                      'Otros Pagos'
              }
            </h3>
            <button
              onClick={() => setDetalleVisible(null)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(detalleVisible === 'jefe' ? stats.pagosJefe :
                  detalleVisible === 'empleado' ? stats.pagosEmpleado :
                    detalleVisible === 'efectivo' ? stats.pagosEfectivo :
                      stats.pagosOtros
                ).map((pago) => (
                  <tr key={pago.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{pago.numeroPagoDia}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{formatDate(pago.fechaPago)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {clientes.get(pago.clienteId)?.nombre || 'Desconocido'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatTipoPago(pago.tipoPago)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Resumen de Período Filtrado: Pagos, Gastos y Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pagos del Período */}
        <div
          onClick={() => setDetalleVisible(detalleVisible === 'pagosHoy' ? null : 'pagosHoy')}
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="w-full">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                Pagos de {rangoFechas}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700">
                {formatMoney(totalPagosFiltrados.toString())}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold">
                  📊 {pagosFiltradosFecha.length} pagos - Click para ver detalle
                </span>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl">💰</div>
          </div>
        </div>

        {/* Mobile: detalle inline debajo de la card Pagos */}
        {detalleVisible === 'pagosHoy' && (
          <div className="md:hidden bg-white rounded-xl shadow mt-3 py-4 px-2 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">📋 Detalle de Pagos de {rangoFechas}</h4>
              <button onClick={() => setDetalleVisible(null)} className="text-sm text-red-500 font-semibold">✕ Cerrar</button>
            </div>
            {pagosFiltradosFecha.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No hay pagos en este período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pagosFiltradosFecha.map((pago) => (
                  <div key={pago.id} className="flex flex-col bg-white border rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</span>
                      <span className="text-sm font-bold text-green-600">{formatMoney(pago.monto)}</span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">{formatTipoPago(pago.tipoPago)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gastos del Período */}
        <div
          onClick={() => setDetalleVisible(detalleVisible === 'gastosHoy' ? null : 'gastosHoy')}
          className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-red-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="w-full">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                Gastos de {rangoFechas}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-700">
                {formatMoney(totalGastosFiltrados.toString())}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs sm:text-sm font-semibold">
                  📊 {gastosFiltradosFecha.length} gastos - Click para ver detalle
                </span>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl">💸</div>
          </div>
        </div>

        {/* Mobile: detalle inline debajo de la card Gastos */}
        {detalleVisible === 'gastosHoy' && (
          <div className="md:hidden bg-white rounded-xl shadow mt-3 py-4 px-2 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">📋 Detalle de Gastos de {rangoFechas}</h4>
              <button onClick={() => setDetalleVisible(null)} className="text-sm text-red-500 font-semibold">✕ Cerrar</button>
            </div>
            {gastosFiltradosFecha.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No hay gastos en este período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {gastosFiltradosFecha.map((gasto) => (
                  <div key={gasto.id} className="flex items-center justify-between bg-white border rounded-lg p-2">
                    <span className="text-sm font-semibold text-gray-900">{gasto.descripcion}</span>
                    <span className="text-sm font-bold text-red-600">{formatMoney(gasto.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Balance del Período */}
        <div
          className={`bg-gradient-to-br rounded-xl shadow-lg p-4 sm:p-6 border-l-4 hover:shadow-xl transition-shadow duration-200 ${
            balanceFiltrado >= 0
              ? 'from-green-50 to-emerald-50 border-green-500'
              : 'from-orange-50 to-orange-100 border-orange-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-full">
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                Pagos - Gastos de {rangoFechas}
              </h3>
              <p className={`text-2xl sm:text-3xl font-bold ${
                balanceFiltrado >= 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                {formatMoney(balanceFiltrado.toString())}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                  balanceFiltrado >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {balanceFiltrado >= 0 ? '📈 Positivo' : '📉 Negativo'}
                </span>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl">{balanceFiltrado >= 0 ? '✅' : '⚠️'}</div>
          </div>
        </div>
      </div>

      {/* Detalle de Pagos del Período (desktop) */}
      {detalleVisible === 'pagosHoy' && (
        <div className="hidden md:block bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">📋 Detalle de Pagos de {rangoFechas}</h3>
            <button
              onClick={() => setDetalleVisible(null)}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="overflow-x-auto">
            {pagosFiltradosFecha.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 text-base font-medium">No hay pagos registrados en este período</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagosFiltradosFecha.map((pago) => (
                    <tr key={pago.id} className="hover:bg-indigo-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {clientes.get(pago.clienteId)?.nombre || 'Desconocido'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatTipoPago(pago.tipoPago)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Detalle de Gastos del Período (desktop) */}
      {detalleVisible === 'gastosHoy' && (
        <div className="hidden md:block bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">📋 Detalle de Gastos de {rangoFechas}</h3>
            <button
              onClick={() => setDetalleVisible(null)}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="overflow-x-auto">
            {gastosFiltradosFecha.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 text-base font-medium">No hay gastos confirmados en este período</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gastosFiltradosFecha.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-red-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{gasto.descripcion}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600">{formatMoney(gasto.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Total del Período Filtrado */}
      {!usarHoy && (
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                Total de pagos del periodo {rangoFechas}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700">
                {formatMoney((stats.totalJefe + stats.totalEmpleado + stats.totalEfectivo + stats.totalOtros).toString())}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold">
                  📊 {stats.cantidadPagos} pagos
                </span>
              </div>
            </div>
            <div className="text-4xl sm:text-5xl">💰</div>
          </div>
        </div>
      )}

      {/* Estadísticas totales */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
        <div className="flex">
          <div className='w-full'>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 flex justify-between items-center">
              Total Esta Semana <span className='text-2xl'>💰</span>
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatMoney(totalPagosSemana.toString())}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-semibold">
                📊 Total histórico: {formatMoney(totalPagos.toString())} ({pagosDesdeFecha.length} pagos)
              </span>

            </div>
          </div>

        </div>
      </div>

      {/* Lista de pagos */}
      <div className="bg-white rounded-xl shadow-lg px-2 py-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md sm:text-2xl font-bold text-gray-900 flex items-center gap-2">📋 Registro de Pagos</h3>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Total: {pagosRegistroSortedDesc.length} pagos</span>
        </div>

        {/* Desktop/tablet: tabla responsive (oculta en mobile) */}
        <div className="hidden md:block overflow-x-auto">
          {pagosRegistroSortedDesc.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium">No hay pagos registrados</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {pagosRegistroSortedDesc.map((pago, index) => {
                  const fechaActual = formatDate(pago.fechaPago);
                  const fechaAnterior = index > 0 ? formatDate(pagosRegistroSortedDesc[index - 1].fechaPago) : null;
                  const cambioFecha = fechaActual !== fechaAnterior;
                  const numeroDia = numeracionPorPago.get(pago.id) ?? pago.numeroPagoDia ?? (index + 1);

                  return (
                    <Fragment key={pago.id}>
                      {cambioFecha && index > 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2">
                            <div className="border-t-4 border-blue-800"></div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors duration-150 border-b border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">#{numeroDia}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-semibold">{fechaActual}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{formatTipoPago(pago.tipoPago)}</span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile: lista compacta para evitar scroll horizontal */}
        <div className="md:hidden">
          {pagosRegistroSortedDesc.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 text-base font-medium">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pagosRegistroSortedDesc.map((pago, index) => {
                  const fechaActual = formatDate(pago.fechaPago);
                  const fechaAnterior = index > 0 ? formatDate(pagosRegistroSortedDesc[index - 1].fechaPago) : null;
                  const numeroDia = numeracionPorPago.get(pago.id) ?? pago.numeroPagoDia ?? (index + 1);

                  return (
                    <Fragment key={pago.id}>
                      {index > 0 && fechaActual !== fechaAnterior && (
                        <div className="w-full">
                          <div className="border-t-4 border-blue-800 my-1"></div>
                        </div>
                      )}

                      <div className="flex flex-col bg-white border rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">#{numeroDia}</span>
                            <span className="text-sm font-semibold text-gray-800">{clientes.get(pago.clienteId)?.nombre || 'Desconocido'}</span>
                          </div>
                          <div className="text-sm font-bold text-green-600">{formatMoney(pago.monto)}</div>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                          <span>{fechaActual}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{formatTipoPago(pago.tipoPago)}</span>
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
            </div>
          )}
        </div>

        {/* Botón para cargar más pagos (2 semanas adicionales) */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setSemanasMostrar(s => s + 2)}
            disabled={!hayPagosMasAntiguos}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${hayPagosMasAntiguos ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Cargar más pagos (2 semanas)
          </button>
        </div>
      </div>
    </div>
  );
}