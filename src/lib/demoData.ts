// Sistema de datos en memoria para el demo
// Los datos se resetean al cerrar la página

export interface Cliente {
  id: string;
  nombre: string;
  saldoAPagar: number;
  ultimaModificacion: string;
}

export interface Venta {
  id: string;
  clienteId: string;
  fechaVenta: string;
  totalVenta: number;
  medioPago: string;
  confirmada: boolean;
}

export interface Pago {
  id: string;
  clienteId: string;
  fechaPago: string;
  monto: number;
  tipoPago: string;
  confirmado: boolean;
}

export interface Gasto {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  confirmado: boolean;
  createdAt: string;
}

export interface Inversion {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  confirmada: boolean;
  createdAt: string;
}

// Generador de IDs
let nextId = 1000;
function generateId() {
  return `demo-${nextId++}`;
}

// Control de reseteo automático: resetear datos cada 5 minutos de inactividad
let ultimoAcceso = Date.now();
const TIEMPO_RESET_MS = 5 * 60 * 1000; // 5 minutos
let sesionActiva = false; // Flag para controlar si hay una sesión activa

// Función para formatear tipo de pago para mostrar en tablas
export function formatTipoPago(tipoPago: string): string {
  if (tipoPago.toLowerCase().includes('jefe')) return 'Jefe';
  if (tipoPago.toLowerCase().includes('empleado')) return 'Empleado';
  return tipoPago;
}

// Fecha base: hoy - 17 días (2.5 semanas)
const hoy = new Date();
const fechaInicio = new Date(hoy);
fechaInicio.setDate(fechaInicio.getDate() - 17);

// Nombres de clientes
const nombresClientes = [
  'María González',
  'Juan Pérez',
  'Ana Martínez',
  'Carlos Rodríguez',
  'Laura Fernández',
  'Pedro López',
  'Sofía García',
  'Diego Sánchez',
  'Carmen Torres',
  'Miguel Ramírez',
  'Isabel Flores',
  'Jorge Morales',
  'Patricia Díaz',
  'Roberto Castro',
  'Elena Ruiz',
  'Francisco Herrera',
  'Lucía Jiménez',
  'Daniel Medina',
  'Valentina Rojas',
  'Andrés Vargas'
];

// Crear clientes
export let clientes: Cliente[] = nombresClientes.map((nombre, index) => {
  // Fecha inicial más algunos días aleatorios para variedad
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 15));
  
  return {
    id: `cliente-${index + 1}`,
    nombre,
    saldoAPagar: 0,
    ultimaModificacion: fecha.toISOString()
  };
});

// Crear ventas (2-3 ventas por día durante 17 días)
export let ventas: Venta[] = [];
for (let dia = 0; dia < 17; dia++) {
  const ventasPorDia = Math.floor(Math.random() * 2) + 2; // 2-3 ventas por día
  for (let i = 0; i < ventasPorDia; i++) {
    const fechaVenta = new Date(fechaInicio);
    fechaVenta.setDate(fechaVenta.getDate() + dia);
    fechaVenta.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    
    const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
    const montoVenta = Math.floor(Math.random() * 50000) + 10000; // $10,000 - $60,000
    
    ventas.push({
      id: generateId(),
      clienteId: clienteAleatorio.id,
      fechaVenta: fechaVenta.toISOString(),
      totalVenta: montoVenta,
      medioPago: ['Efectivo', 'Transferencia', 'Tarjeta'][Math.floor(Math.random() * 3)],
      confirmada: true
    });
  }
}

// Agregar algunas ventas del día actual
for (let i = 0; i < 3; i++) {
  const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
  const ahora = new Date();
  ahora.setHours(10 + i * 2, Math.floor(Math.random() * 60));
  
  ventas.push({
    id: generateId(),
    clienteId: clienteAleatorio.id,
    fechaVenta: ahora.toISOString(),
    totalVenta: Math.floor(Math.random() * 50000) + 10000,
    medioPago: ['Efectivo', 'Transferencia', 'Tarjeta'][Math.floor(Math.random() * 3)],
    confirmada: true
  });
}

// Crear pagos (algunos clientes pagan, otros quedan debiendo)
export let pagos: Pago[] = [];
const tiposPago = ['Efectivo', 'Transferencia a Jefe', 'Transferencia a Empleado', 'Tarjeta'];
const hoyMax = new Date();
hoyMax.setHours(23, 59, 59, 999); // Límite máximo: fin del día actual

ventas.forEach((venta, index) => {
  // 60% de las ventas tienen pagos
  if (Math.random() < 0.6) {
    const fechaPago = new Date(venta.fechaVenta);
    fechaPago.setDate(fechaPago.getDate() + Math.floor(Math.random() * 5)); // Pago entre 0-5 días después
    
    // Validar que el pago no sea en el futuro
    if (fechaPago > hoyMax) {
      return; // Omitir este pago
    }
    
    // A veces pago parcial, a veces completo
    const montoPago = Math.random() < 0.7 
      ? venta.totalVenta 
      : Math.floor(venta.totalVenta * (0.3 + Math.random() * 0.5)); // 30%-80% del total
    
    pagos.push({
      id: generateId(),
      clienteId: venta.clienteId,
      fechaPago: fechaPago.toISOString(),
      monto: montoPago,
      tipoPago: tiposPago[Math.floor(Math.random() * tiposPago.length)],
      confirmado: true
    });
  }
});

// Agregar algunos pagos del día actual
for (let i = 0; i < 3; i++) {
  const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
  const ahora = new Date();
  ahora.setHours(9 + i * 2, Math.floor(Math.random() * 60));
  
  pagos.push({
    id: generateId(),
    clienteId: clienteAleatorio.id,
    fechaPago: ahora.toISOString(),
    monto: Math.floor(Math.random() * 30000) + 10000,
    tipoPago: tiposPago[Math.floor(Math.random() * tiposPago.length)],
    confirmado: true
  });
}

// Calcular saldos de clientes
clientes.forEach(cliente => {
  const ventasCliente = ventas.filter(v => v.clienteId === cliente.id);
  const pagosCliente = pagos.filter(p => p.clienteId === cliente.id);
  
  const totalVentas = ventasCliente.reduce((sum, v) => sum + v.totalVenta, 0);
  const totalPagos = pagosCliente.reduce((sum, p) => sum + p.monto, 0);
  
  cliente.saldoAPagar = totalVentas - totalPagos;
  
  // Actualizar última modificación con la fecha más reciente de venta o pago
  const fechasVentas = ventasCliente.map(v => new Date(v.fechaVenta));
  const fechasPagos = pagosCliente.map(p => new Date(p.fechaPago));
  const todasFechas = [...fechasVentas, ...fechasPagos];
  
  if (todasFechas.length > 0) {
    const fechaMasReciente = new Date(Math.max(...todasFechas.map(f => f.getTime())));
    cliente.ultimaModificacion = fechaMasReciente.toISOString();
  }
});

// Crear gastos (1-2 por día)
export let gastos: Gasto[] = [];
const tiposGasto = [
  'Materiales',
  'Empaque',
  'Envío',
  'Publicidad',
  'Servicios',
  'Mantenimiento',
  'Insumos',
  'Herramientas'
];

for (let dia = 0; dia < 17; dia++) {
  const gastosPorDia = Math.floor(Math.random() * 2) + 1; // 1-2 gastos por día
  for (let i = 0; i < gastosPorDia; i++) {
    const fechaGasto = new Date(fechaInicio);
    fechaGasto.setDate(fechaGasto.getDate() + dia);
    fechaGasto.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
    
    gastos.push({
      id: generateId(),
      fecha: fechaGasto.toISOString(),
      descripcion: tiposGasto[Math.floor(Math.random() * tiposGasto.length)],
      monto: Math.floor(Math.random() * 5000) + 500, // $500 - $5,500
      confirmado: true,
      createdAt: fechaGasto.toISOString()
    });
  }
}

// Agregar algunos gastos del día actual
for (let i = 0; i < 2; i++) {
  const ahora = new Date();
  ahora.setHours(11 + i * 3, Math.floor(Math.random() * 60));
  
  gastos.push({
    id: generateId(),
    fecha: ahora.toISOString(),
    descripcion: tiposGasto[Math.floor(Math.random() * tiposGasto.length)],
    monto: Math.floor(Math.random() * 5000) + 500,
    confirmado: true,
    createdAt: ahora.toISOString()
  });
}

// Crear inversiones (3-5 en total)
export let inversiones: Inversion[] = [];
const tiposInversion = [
  'Compra de mercadería',
  'Equipo nuevo',
  'Ampliación de stock',
  'Marketing digital',
  'Renovación de local'
];

for (let i = 0; i < 4; i++) {
  const fechaInversion = new Date(fechaInicio);
  fechaInversion.setDate(fechaInversion.getDate() + Math.floor(Math.random() * 17));
  fechaInversion.setHours(11 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
  
  inversiones.push({
    id: generateId(),
    fecha: fechaInversion.toISOString(),
    descripcion: tiposInversion[i],
    monto: Math.floor(Math.random() * 50000) + 20000, // $20,000 - $70,000
    confirmada: true,
    createdAt: fechaInversion.toISOString()
  });
}

// Agregar algunas inversiones del día actual
for (let i = 0; i < 1; i++) {
  const ahora = new Date();
  ahora.setHours(13 + i * 2, Math.floor(Math.random() * 60));
  
  inversiones.push({
    id: generateId(),
    fecha: ahora.toISOString(),
    descripcion: tiposInversion[Math.floor(Math.random() * tiposInversion.length)],
    monto: Math.floor(Math.random() * 50000) + 20000,
    confirmada: true,
    createdAt: ahora.toISOString()
  });
}

// Guardar copias iniciales de todos los datos para poder resetear
const clientesIniciales = JSON.parse(JSON.stringify(clientes));
const ventasIniciales = JSON.parse(JSON.stringify(ventas));
const pagosIniciales = JSON.parse(JSON.stringify(pagos));
const gastosIniciales = JSON.parse(JSON.stringify(gastos));
const inversionesIniciales = JSON.parse(JSON.stringify(inversiones));

// Función para resetear todos los datos a su estado inicial
function resetearDatos() {
  // Vaciar arrays y rellenarlos con datos iniciales (mutar en lugar de reasignar)
  clientes.splice(0, clientes.length, ...JSON.parse(JSON.stringify(clientesIniciales)));
  ventas.splice(0, ventas.length, ...JSON.parse(JSON.stringify(ventasIniciales)));
  pagos.splice(0, pagos.length, ...JSON.parse(JSON.stringify(pagosIniciales)));
  gastos.splice(0, gastos.length, ...JSON.parse(JSON.stringify(gastosIniciales)));
  inversiones.splice(0, inversiones.length, ...JSON.parse(JSON.stringify(inversionesIniciales)));
  // Resetear el contador de IDs
  nextId = 1000;
}

// Exportar función para reseteo manual
export function resetearDatosManual() {
  resetearDatos();
  ultimoAcceso = Date.now();
}

// Función para verificar si necesita resetear por inactividad
function verificarYResetear() {
  const ahora = Date.now();
  
  // Si no hay sesión activa o han pasado más de 5 minutos, resetear
  if (!sesionActiva || ahora - ultimoAcceso > TIEMPO_RESET_MS) {
    resetearDatos();
    sesionActiva = true;
  }
  
  ultimoAcceso = ahora;
}

// Funciones CRUD para clientes
export function getClientes(): Cliente[] {
  return clientes;
}

export function getCliente(id: string): Cliente | undefined {
  return clientes.find(c => c.id === id);
}

// Funciones CRUD para ventas
export function getVentas(): Venta[] {
  return ventas.sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime());
}

export function getVenta(id: string): Venta | undefined {
  return ventas.find(v => v.id === id);
}

export function addVenta(venta: Omit<Venta, 'id'>): Venta {
  const nuevaVenta = { ...venta, id: generateId() };
  ventas.push(nuevaVenta);
  recalcularSaldos();
  return nuevaVenta;
}

export function updateVenta(id: string, data: Partial<Venta>): Venta | null {
  const index = ventas.findIndex(v => v.id === id);
  if (index === -1) return null;
  ventas[index] = { ...ventas[index], ...data };
  recalcularSaldos();
  return ventas[index];
}

export function deleteVenta(id: string): boolean {
  const index = ventas.findIndex(v => v.id === id);
  if (index === -1) return false;
  ventas.splice(index, 1);
  recalcularSaldos();
  return true;
}

// Funciones CRUD para pagos
export function getPagos(): Pago[] {
  return pagos.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
}

export function getPago(id: string): Pago | undefined {
  return pagos.find(p => p.id === id);
}

export function addPago(pago: Omit<Pago, 'id'>): Pago {
  const nuevoPago = { ...pago, id: generateId() };
  pagos.push(nuevoPago);
  recalcularSaldos();
  return nuevoPago;
}

export function updatePago(id: string, data: Partial<Pago>): Pago | null {
  const index = pagos.findIndex(p => p.id === id);
  if (index === -1) return null;
  pagos[index] = { ...pagos[index], ...data };
  recalcularSaldos();
  return pagos[index];
}

export function deletePago(id: string): boolean {
  const index = pagos.findIndex(p => p.id === id);
  if (index === -1) return false;
  pagos.splice(index, 1);
  recalcularSaldos();
  return true;
}

// Funciones CRUD para gastos
export function getGastos(): Gasto[] {
  verificarYResetear();
  return gastos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export function getGasto(id: string): Gasto | undefined {
  return gastos.find(g => g.id === id);
}

export function addGasto(gasto: Omit<Gasto, 'id' | 'createdAt'>): Gasto {
  const nuevoGasto = { ...gasto, id: generateId(), createdAt: new Date().toISOString() };
  gastos.push(nuevoGasto);
  return nuevoGasto;
}

export function updateGasto(id: string, data: Partial<Gasto>): Gasto | null {
  const index = gastos.findIndex(g => g.id === id);
  if (index === -1) return null;
  gastos[index] = { ...gastos[index], ...data };
  return gastos[index];
}

export function deleteGasto(id: string): boolean {
  const index = gastos.findIndex(g => g.id === id);
  if (index === -1) return false;
  gastos.splice(index, 1);
  return true;
}

// Funciones CRUD para inversiones
export function getInversiones(): Inversion[] {
  verificarYResetear();
  return inversiones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export function getInversion(id: string): Inversion | undefined {
  return inversiones.find(i => i.id === id);
}

export function addInversion(inversion: Omit<Inversion, 'id' | 'createdAt'>): Inversion {
  const nuevaInversion = { ...inversion, id: generateId(), createdAt: new Date().toISOString() };
  inversiones.push(nuevaInversion);
  return nuevaInversion;
}

export function updateInversion(id: string, data: Partial<Inversion>): Inversion | null {
  const index = inversiones.findIndex(i => i.id === id);
  if (index === -1) return null;
  inversiones[index] = { ...inversiones[index], ...data };
  return inversiones[index];
}

export function deleteInversion(id: string): boolean {
  const index = inversiones.findIndex(i => i.id === id);
  if (index === -1) return false;
  inversiones.splice(index, 1);
  return true;
}

// Recalcular saldos de clientes
function recalcularSaldos() {
  clientes.forEach(cliente => {
    const ventasCliente = ventas.filter(v => v.clienteId === cliente.id);
    const pagosCliente = pagos.filter(p => p.clienteId === cliente.id);
    
    const totalVentas = ventasCliente.reduce((sum, v) => sum + v.totalVenta, 0);
    const totalPagos = pagosCliente.reduce((sum, p) => sum + p.monto, 0);
    
    cliente.saldoAPagar = totalVentas - totalPagos;
    
    // Actualizar última modificación con la fecha más reciente de venta o pago
    const fechasVentas = ventasCliente.map(v => new Date(v.fechaVenta));
    const fechasPagos = pagosCliente.map(p => new Date(p.fechaPago));
    const todasFechas = [...fechasVentas, ...fechasPagos];
    
    if (todasFechas.length > 0) {
      const fechaMasReciente = new Date(Math.max(...todasFechas.map(f => f.getTime())));
      cliente.ultimaModificacion = fechaMasReciente.toISOString();
    }
  });
}

// Función para obtener estadísticas del dashboard
export function getDashboardData() {
  verificarYResetear();
  const ahora = new Date();
  
  // Fecha de inicio para cálculos (04/11/2025)
  const fechaInicioCuentas = new Date('2025-11-04');
  
  // Calcular totales desde la fecha de inicio
  const ventasDesdeInicio = ventas.filter(v => new Date(v.fechaVenta) >= fechaInicioCuentas);
  const pagosDesdeInicio = pagos.filter(p => new Date(p.fechaPago) >= fechaInicioCuentas);
  
  const totalVentas = ventasDesdeInicio.reduce((sum, v) => sum + v.totalVenta, 0);
  const totalPagos = pagosDesdeInicio.reduce((sum, p) => sum + p.monto, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const totalInversiones = inversiones.reduce((sum, i) => sum + i.monto, 0);
  
  const capitalTotal = totalPagos - totalGastos - totalInversiones;
  const saldoDeudores = clientes.reduce((sum, c) => sum + (c.saldoAPagar > 0 ? c.saldoAPagar : 0), 0);
  
  // Semana actual (últimos 7 días)
  const hace7Dias = new Date(ahora);
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  
  const ventasSemanaActual = ventas.filter(v => new Date(v.fechaVenta) >= hace7Dias);
  const pagosSemanaActual = pagos.filter(p => new Date(p.fechaPago) >= hace7Dias);
  const gastosSemanaActual = gastos.filter(g => new Date(g.fecha) >= hace7Dias);
  const inversionesSemanaActual = inversiones.filter(i => new Date(i.fecha) >= hace7Dias);
  
  // Semana pasada (días 7-14 hacia atrás)
  const hace14Dias = new Date(ahora);
  hace14Dias.setDate(hace14Dias.getDate() - 14);
  
  const ventasSemanaPasada = ventas.filter(v => {
    const fecha = new Date(v.fechaVenta);
    return fecha >= hace14Dias && fecha < hace7Dias;
  });
  const pagosSemanaPasada = pagos.filter(p => {
    const fecha = new Date(p.fechaPago);
    return fecha >= hace14Dias && fecha < hace7Dias;
  });
  const gastosSemanaPasada = gastos.filter(g => {
    const fecha = new Date(g.fecha);
    return fecha >= hace14Dias && fecha < hace7Dias;
  });
  const inversionesSemanaPasada = inversiones.filter(i => {
    const fecha = new Date(i.fecha);
    return fecha >= hace14Dias && fecha < hace7Dias;
  });
  
  // Últimos 5 pagos y ventas
  const ultimasPagos = pagos
    .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime())
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      fechaPago: p.fechaPago,
      monto: p.monto.toString(),
      cliente: { nombre: clientes.find(c => c.id === p.clienteId)?.nombre || 'Desconocido' }
    }));
  
  const ultimasVentas = ventas
    .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime())
    .slice(0, 5)
    .map(v => ({
      id: v.id,
      fechaVenta: v.fechaVenta,
      totalVenta: v.totalVenta.toString(),
      cliente: { nombre: clientes.find(c => c.id === v.clienteId)?.nombre || 'Desconocido' }
    }));
  
  // Top 5 deudores
  const clientesDeudores = clientes
    .filter(c => c.saldoAPagar > 0)
    .sort((a, b) => b.saldoAPagar - a.saldoAPagar)
    .slice(0, 5)
    .map(c => ({
      nombre: c.nombre,
      saldoAPagar: c.saldoAPagar.toString()
    }));
  
  return {
    capital: {
      total: capitalTotal,
      inversiones: totalInversiones,
      pagos: totalPagos,
      ventas: totalVentas,
      gastos: totalGastos
    },
    semanaActual: {
      inversiones: inversionesSemanaActual.reduce((sum, i) => sum + i.monto, 0),
      pagos: pagosSemanaActual.reduce((sum, p) => sum + p.monto, 0),
      ventas: ventasSemanaActual.reduce((sum, v) => sum + v.totalVenta, 0),
      gastos: gastosSemanaActual.reduce((sum, g) => sum + g.monto, 0),
      rangoFechas: { inicio: hace7Dias.toISOString(), fin: ahora.toISOString() }
    },
    semanaPasada: {
      inversiones: inversionesSemanaPasada.reduce((sum, i) => sum + i.monto, 0),
      pagos: pagosSemanaPasada.reduce((sum, p) => sum + p.monto, 0),
      ventas: ventasSemanaPasada.reduce((sum, v) => sum + v.totalVenta, 0),
      gastos: gastosSemanaPasada.reduce((sum, g) => sum + g.monto, 0),
      rangoFechas: { inicio: hace14Dias.toISOString(), fin: hace7Dias.toISOString() }
    },
    saldoDeudores,
    ultimasPagos,
    ultimasVentas,
    clientesDeudores,
    fechaActualizacion: ahora.toISOString()
  };
}
