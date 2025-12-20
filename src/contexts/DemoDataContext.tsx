"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

// Interfaces
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

interface DemoDataContextType {
  clientes: Cliente[];
  ventas: Venta[];
  pagos: Pago[];
  gastos: Gasto[];
  inversiones: Inversion[];
  addGasto: (gasto: Omit<Gasto, 'id' | 'createdAt'>) => Gasto;
  updateGasto: (id: string, data: Partial<Gasto>) => Gasto | null;
  deleteGasto: (id: string) => boolean;
  addInversion: (inversion: Omit<Inversion, 'id' | 'createdAt'>) => Inversion;
  updateInversion: (id: string, data: Partial<Inversion>) => Inversion | null;
  deleteInversion: (id: string) => boolean;
  getDashboardData: () => any;
  formatTipoPago: (tipoPago: string) => string;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

function generarDatosIniciales() {
  let nextId = 1000;
  const generateId = () => `demo-${nextId++}`;
  
  const hoy = new Date();
  const fechaInicio = new Date(hoy);
  fechaInicio.setDate(fechaInicio.getDate() - 17);
  
  const nombresClientes = [
    'María González', 'Juan Pérez', 'Ana Martínez', 'Carlos Rodríguez', 'Laura Fernández',
    'Pedro López', 'Sofía García', 'Diego Sánchez', 'Carmen Torres', 'Miguel Ramírez',
    'Isabel Flores', 'Jorge Morales', 'Patricia Díaz', 'Roberto Castro', 'Elena Ruiz',
    'Francisco Herrera', 'Lucía Jiménez', 'Daniel Medina', 'Valentina Rojas', 'Andrés Vargas'
  ];
  
  const clientes: Cliente[] = nombresClientes.map((nombre, index) => {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 15));
    return {
      id: `cliente-${index + 1}`,
      nombre,
      saldoAPagar: 0,
      ultimaModificacion: fecha.toISOString()
    };
  });
  
  const ventas: Venta[] = [];
  for (let dia = 0; dia < 17; dia++) {
    const ventasPorDia = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < ventasPorDia; i++) {
      const fechaVenta = new Date(fechaInicio);
      fechaVenta.setDate(fechaVenta.getDate() + dia);
      fechaVenta.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
      ventas.push({
        id: generateId(),
        clienteId: clienteAleatorio.id,
        fechaVenta: fechaVenta.toISOString(),
        totalVenta: Math.floor(Math.random() * 50000) + 10000,
        medioPago: ['Efectivo', 'Transferencia', 'Tarjeta'][Math.floor(Math.random() * 3)],
        confirmada: true
      });
    }
  }
  
  // Ventas del día actual
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
  
  const pagos: Pago[] = [];
  const tiposPago = ['Efectivo', 'Transferencia a Jefe', 'Transferencia a Empleado', 'Tarjeta'];
  const ahoraInicial = new Date();
  ventas.forEach(venta => {
    if (Math.random() > 0.3) {
      const fechaPago = new Date(venta.fechaVenta);
      fechaPago.setHours(fechaPago.getHours() + Math.floor(Math.random() * 24));
      
      // Asegurar que la fecha del pago no sea futura
      if (fechaPago > ahoraInicial) {
        fechaPago.setTime(ahoraInicial.getTime() - Math.floor(Math.random() * 3600000)); // Restar hasta 1 hora
      }
      
      pagos.push({
        id: generateId(),
        clienteId: venta.clienteId,
        fechaPago: fechaPago.toISOString(),
        monto: Math.floor(venta.totalVenta * (0.3 + Math.random() * 0.5)),
        tipoPago: tiposPago[Math.floor(Math.random() * tiposPago.length)],
        confirmado: true
      });
    }
  });
  
  // Pagos del día actual
  for (let i = 0; i < 3; i++) {
    const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
    const fechaPagoHoy = new Date();
    fechaPagoHoy.setHours(9 + i * 2, Math.floor(Math.random() * 60));
    pagos.push({
      id: generateId(),
      clienteId: clienteAleatorio.id,
      fechaPago: fechaPagoHoy.toISOString(),
      monto: Math.floor(Math.random() * 30000) + 10000,
      tipoPago: tiposPago[Math.floor(Math.random() * tiposPago.length)],
      confirmado: true
    });
  }
  
  // Calcular saldos
  clientes.forEach(cliente => {
    const ventasCliente = ventas.filter(v => v.clienteId === cliente.id);
    const pagosCliente = pagos.filter(p => p.clienteId === cliente.id);
    const totalVentas = ventasCliente.reduce((sum, v) => sum + v.totalVenta, 0);
    const totalPagos = pagosCliente.reduce((sum, p) => sum + p.monto, 0);
    cliente.saldoAPagar = totalVentas - totalPagos;
    
    const fechasVentas = ventasCliente.map(v => new Date(v.fechaVenta));
    const fechasPagos = pagosCliente.map(p => new Date(p.fechaPago));
    const todasFechas = [...fechasVentas, ...fechasPagos];
    if (todasFechas.length > 0) {
      const fechaMasReciente = new Date(Math.max(...todasFechas.map(f => f.getTime())));
      cliente.ultimaModificacion = fechaMasReciente.toISOString();
    }
  });
  
  const gastos: Gasto[] = [];
  const tiposGasto = ['Materiales', 'Empaque', 'Envío', 'Publicidad', 'Servicios', 'Mantenimiento', 'Insumos', 'Herramientas'];
  for (let dia = 0; dia < 17; dia++) {
    const gastosPorDia = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < gastosPorDia; i++) {
      const fechaGasto = new Date(fechaInicio);
      fechaGasto.setDate(fechaGasto.getDate() + dia);
      fechaGasto.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      gastos.push({
        id: generateId(),
        fecha: fechaGasto.toISOString(),
        descripcion: tiposGasto[Math.floor(Math.random() * tiposGasto.length)],
        monto: Math.floor(Math.random() * 5000) + 500,
        confirmado: true,
        createdAt: fechaGasto.toISOString()
      });
    }
  }
  
  // Gastos del día actual
  for (let i = 0; i < 2; i++) {
    const fechaGastoHoy = new Date();
    fechaGastoHoy.setHours(11 + i * 3, Math.floor(Math.random() * 60));
    gastos.push({
      id: generateId(),
      fecha: fechaGastoHoy.toISOString(),
      descripcion: tiposGasto[Math.floor(Math.random() * tiposGasto.length)],
      monto: Math.floor(Math.random() * 5000) + 500,
      confirmado: true,
      createdAt: fechaGastoHoy.toISOString()
    });
  }
  
  const inversiones: Inversion[] = [];
  const tiposInversion = ['Compra de mercadería', 'Equipo nuevo', 'Ampliación de stock', 'Marketing digital', 'Renovación de local'];
  for (let i = 0; i < 4; i++) {
    const fechaInversion = new Date(fechaInicio);
    fechaInversion.setDate(fechaInversion.getDate() + Math.floor(Math.random() * 17));
    fechaInversion.setHours(11 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
    inversiones.push({
      id: generateId(),
      fecha: fechaInversion.toISOString(),
      descripcion: tiposInversion[i],
      monto: Math.floor(Math.random() * 50000) + 20000,
      confirmada: true,
      createdAt: fechaInversion.toISOString()
    });
  }
  
  // Inversión del día actual
  const fechaInversionHoy = new Date();
  fechaInversionHoy.setHours(13, Math.floor(Math.random() * 60));
  inversiones.push({
    id: generateId(),
    fecha: fechaInversionHoy.toISOString(),
    descripcion: tiposInversion[Math.floor(Math.random() * tiposInversion.length)],
    monto: Math.floor(Math.random() * 50000) + 20000,
    confirmada: true,
    createdAt: fechaInversionHoy.toISOString()
  });
  
  return { clientes, ventas, pagos, gastos, inversiones, nextId };
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [datosIniciales] = useState(() => generarDatosIniciales());
  const [clientes, setClientes] = useState<Cliente[]>(datosIniciales.clientes);
  const [ventas, setVentas] = useState<Venta[]>(datosIniciales.ventas);
  const [pagos, setPagos] = useState<Pago[]>(datosIniciales.pagos);
  const [gastos, setGastos] = useState<Gasto[]>(datosIniciales.gastos);
  const [inversiones, setInversiones] = useState<Inversion[]>(datosIniciales.inversiones);
  const [nextId, setNextId] = useState(datosIniciales.nextId);
  
  const generateId = () => {
    const id = `demo-${nextId}`;
    setNextId(prev => prev + 1);
    return id;
  };
  
  const formatTipoPago = useCallback((tipoPago: string): string => {
    if (tipoPago.toLowerCase().includes('jefe')) return 'Jefe';
    if (tipoPago.toLowerCase().includes('empleado')) return 'Empleado';
    return tipoPago;
  }, []);
  
  const addGasto = useCallback((gasto: Omit<Gasto, 'id' | 'createdAt'>): Gasto => {
    const nuevoGasto = { ...gasto, id: generateId(), createdAt: new Date().toISOString() };
    setGastos(prev => [...prev, nuevoGasto]);
    return nuevoGasto;
  }, [nextId]);
  
  const updateGasto = useCallback((id: string, data: Partial<Gasto>): Gasto | null => {
    let gastoActualizado: Gasto | null = null;
    setGastos(prev => prev.map(g => {
      if (g.id === id) {
        gastoActualizado = { ...g, ...data };
        return gastoActualizado;
      }
      return g;
    }));
    return gastoActualizado;
  }, []);
  
  const deleteGasto = useCallback((id: string): boolean => {
    let eliminado = false;
    setGastos(prev => {
      const filtered = prev.filter(g => g.id !== id);
      eliminado = filtered.length < prev.length;
      return filtered;
    });
    return eliminado;
  }, []);
  
  const addInversion = useCallback((inversion: Omit<Inversion, 'id' | 'createdAt'>): Inversion => {
    const nuevaInversion = { ...inversion, id: generateId(), createdAt: new Date().toISOString() };
    setInversiones(prev => [...prev, nuevaInversion]);
    return nuevaInversion;
  }, [nextId]);
  
  const updateInversion = useCallback((id: string, data: Partial<Inversion>): Inversion | null => {
    let inversionActualizada: Inversion | null = null;
    setInversiones(prev => prev.map(i => {
      if (i.id === id) {
        inversionActualizada = { ...i, ...data };
        return inversionActualizada;
      }
      return i;
    }));
    return inversionActualizada;
  }, []);
  
  const deleteInversion = useCallback((id: string): boolean => {
    let eliminado = false;
    setInversiones(prev => {
      const filtered = prev.filter(i => i.id !== id);
      eliminado = filtered.length < prev.length;
      return filtered;
    });
    return eliminado;
  }, []);
  
  const getDashboardData = useCallback(() => {
    const ahora = new Date();
    const fechaInicioCuentas = new Date('2025-11-04');
    
    const ventasConfirmadas = ventas.filter(v => v.confirmada);
    const totalVentas = ventasConfirmadas.reduce((sum, v) => sum + v.totalVenta, 0);
    
    const pagosConfirmados = pagos.filter(p => p.confirmado);
    const totalPagos = pagosConfirmados.reduce((sum, p) => sum + p.monto, 0);
    
    const gastosConfirmados = gastos.filter(g => g.confirmado);
    const totalGastos = gastosConfirmados.reduce((sum, g) => sum + g.monto, 0);
    
    const inversionesConfirmadas = inversiones.filter(i => i.confirmada);
    const totalInversiones = inversionesConfirmadas.reduce((sum, i) => sum + i.monto, 0);
    
    const saldoDeudores = clientes.reduce((sum, c) => sum + (c.saldoAPagar > 0 ? c.saldoAPagar : 0), 0);
    
    const gastosHoy = gastos.filter(g => {
      const fecha = new Date(g.fecha);
      return fecha.toDateString() === ahora.toDateString();
    }).reduce((sum, g) => sum + g.monto, 0);
    
    const capital = totalVentas - totalGastos - totalInversiones;
    const capitalDisponible = totalPagos - totalGastos - totalInversiones;
    
    return {
      totalVentas: totalVentas.toString(),
      totalPagos: totalPagos.toString(),
      totalGastos: totalGastos.toString(),
      totalInversiones: totalInversiones.toString(),
      capital: capital.toString(),
      capitalDisponible: capitalDisponible.toString(),
      saldoDeudores: saldoDeudores.toString(),
      gastosHoy: gastosHoy.toString(),
      ultimaActualizacion: new Date().toISOString()
    };
  }, [clientes, ventas, pagos, gastos, inversiones]);
  
  const value: DemoDataContextType = useMemo(() => ({
    clientes,
    ventas,
    pagos,
    gastos,
    inversiones,
    addGasto,
    updateGasto,
    deleteGasto,
    addInversion,
    updateInversion,
    deleteInversion,
    getDashboardData,
    formatTipoPago
  }), [clientes, ventas, pagos, gastos, inversiones, addGasto, updateGasto, deleteGasto, addInversion, updateInversion, deleteInversion, getDashboardData, formatTipoPago]);
  
  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData debe usarse dentro de DemoDataProvider');
  }
  return context;
}
