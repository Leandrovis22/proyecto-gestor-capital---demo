// app/api/sync/receive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ========================================
// VALIDACIÓN DE DATOS CON ZOD
// ========================================

const registroConsolidadoSchema = z.object({
  fechaPago: z.string().nullable().transform(val => val ? new Date(val) : null),
  entrega: z.number(),
  saldoAPagar: z.number(),
  columnaK: z.string().optional(),
  hojaOrigen: z.string().optional(),
  filaOrigen: z.number().optional()
});

const registroVentaSchema = z.object({
  fechaVenta: z.string().transform(val => new Date(val)),
  totalVenta: z.number()
});

const datosArchivoSchema = z.object({
  archivoId: z.string(),
  nombreArchivo: z.string(),
  fechaModificacion: z.string().transform(val => new Date(val)),
  saldoAPagar: z.number().nullable(),
  registrosConsolidados: z.array(registroConsolidadoSchema),
  registrosVentas: z.array(registroVentaSchema)
});

// ========================================
// CONSTANTES
// ========================================

const FECHA_LIMITE_PAGOS = new Date('2025-10-01');
const FECHA_LIMITE_VENTAS = new Date('2025-10-01');
const FECHA_INICIO_CAPITAL_PAGOS = new Date('2025-11-04');
const FECHA_INICIO_CAPITAL_VENTAS = new Date('2025-11-04');

// API Key para autenticación
const API_KEY = process.env.SYNC_API_KEY || 'tu-clave-secreta-super-segura';

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================

function verificarAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.split(' ')[1];
  return token === API_KEY;
}

// ========================================
// POST: Recibir datos del Apps Script
// ========================================

export async function POST(request: NextRequest) {
  const inicioTiempo = Date.now();
  
  // Autenticación
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  try {
    // Parsear y validar datos
    const body = await request.json();
    const datos = datosArchivoSchema.parse(body);
    
    console.log(`📥 Recibiendo datos de: ${datos.nombreArchivo}`);
    
    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. CREAR O ACTUALIZAR CLIENTE (buscar por archivoId, no por nombre)
      const cliente = await tx.cliente.upsert({
        where: { archivoId: datos.archivoId },
        update: {
          nombre: datos.nombreArchivo, // Actualizar nombre si cambió
          saldoAPagar: datos.saldoAPagar || 0,
          ultimaModificacion: datos.fechaModificacion
        },
        create: {
          nombre: datos.nombreArchivo,
          saldoAPagar: datos.saldoAPagar || 0,
          ultimaModificacion: datos.fechaModificacion,
          archivoId: datos.archivoId
        }
      });
      
      // 2. ELIMINAR REGISTROS CONSOLIDADOS ANTIGUOS
      await tx.registroConsolidado.deleteMany({
        where: { clienteId: cliente.id }
      });
      
      // 3. INSERTAR NUEVOS REGISTROS CONSOLIDADOS
      if (datos.registrosConsolidados.length > 0) {
        await tx.registroConsolidado.createMany({
          data: datos.registrosConsolidados.map(reg => ({
            clienteId: cliente.id,
            fechaPago: reg.fechaPago,
            entrega: reg.entrega,
            saldoAPagar: reg.saldoAPagar,
            columnaK: reg.columnaK || null,
            hojaOrigen: reg.hojaOrigen || null,
            filaOrigen: reg.filaOrigen || null
          }))
        });
      }
      
      // 4. REGENERAR PAGOS desde registros consolidados
      await regenerarPagos(tx, cliente.id);
      
      // 5. REGENERAR VENTAS desde registros de ventas
      await regenerarVentas(tx, cliente.id, datos.registrosVentas, datos.fechaModificacion);
      
      // 6. ACTUALIZAR CONTROL DE ARCHIVO
      await tx.archivoControl.upsert({
        where: { nombreArchivo: datos.nombreArchivo + '.xlsx' },
        update: {
          archivoId: datos.archivoId,
          ultimaModificacion: datos.fechaModificacion,
          ultimaSincronizacion: new Date(),
          totalRegistros: datos.registrosConsolidados.length,
          sincronizacionExitosa: true,
          errorMensaje: null
        },
        create: {
          nombreArchivo: datos.nombreArchivo + '.xlsx',
          archivoId: datos.archivoId,
          ultimaModificacion: datos.fechaModificacion,
          totalRegistros: datos.registrosConsolidados.length,
          sincronizacionExitosa: true
        }
      });
      
      return {
        clienteId: cliente.id,
        registrosConsolidados: datos.registrosConsolidados.length,
        registrosVentas: datos.registrosVentas.length
      };
    });
    
    const duracion = Math.round((Date.now() - inicioTiempo) / 1000);
    
    console.log(`✅ ${datos.nombreArchivo} sincronizado en ${duracion}s`);
    
    return NextResponse.json({
      success: true,
      mensaje: 'Sincronización exitosa',
      ...resultado,
      duracionSegundos: duracion
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    
    // Registrar error en control
    try {
      const body = await request.json();
      await prisma.archivoControl.update({
        where: { nombreArchivo: body.nombreArchivo + '.xlsx' },
        data: {
          sincronizacionExitosa: false,
          errorMensaje: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
    } catch {}
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar datos' },
      { status: 500 }
    );
  }
}

// ========================================
// FUNCIÓN: Regenerar Pagos
// ========================================

async function regenerarPagos(tx: any, clienteId: string) {
  // Eliminar pagos antiguos de este cliente
  await tx.pago.deleteMany({
    where: { clienteId }
  });
  
  // Obtener registros consolidados con fecha Y entrega > 0
  const registros = await tx.registroConsolidado.findMany({
    where: {
      clienteId,
      AND: [
        { fechaPago: { not: null } },
        { entrega: { gt: 0 } },
        { fechaPago: { gte: FECHA_LIMITE_PAGOS } }
      ]
    },
    orderBy: { fechaPago: 'desc' }
  });
  
  // Crear pagos
  if (registros.length > 0) {
    await tx.pago.createMany({
      data: registros.map(reg => ({
        clienteId,
        fechaPago: reg.fechaPago!,
        monto: reg.entrega,
        tipoPago: reg.columnaK,
        timestampArchivo: new Date()
      }))
    });
  }
  
  // Calcular numeración por día (se hace después con un query)
  await calcularNumeracionPagos(tx);
}

// ========================================
// FUNCIÓN: Regenerar Ventas
// ========================================

async function regenerarVentas(
  tx: any,
  clienteId: string,
  registrosVentas: Array<{ fechaVenta: Date; totalVenta: number }>,
  timestampArchivo: Date
) {
  // Agrupar ventas por fecha (sumar totales)
  const ventasAgrupadas = new Map<string, number>();
  
  for (const reg of registrosVentas) {
    if (reg.fechaVenta >= FECHA_LIMITE_VENTAS) {
      const fechaKey = reg.fechaVenta.toISOString().split('T')[0];
      const totalActual = ventasAgrupadas.get(fechaKey) || 0;
      ventasAgrupadas.set(fechaKey, totalActual + reg.totalVenta);
    }
  }
  
  // Obtener ventas existentes para preservar timestamps
  const ventasExistentes = await tx.venta.findMany({
    where: { clienteId },
    select: { fechaVenta: true, timestampArchivo: true }
  });
  
  const timestampsExistentes = new Map(
    ventasExistentes.map(v => [
      v.fechaVenta.toISOString().split('T')[0],
      v.timestampArchivo
    ])
  );
  
  // Eliminar ventas antiguas de este cliente
  await tx.venta.deleteMany({
    where: { clienteId }
  });
  
  // Crear nuevas ventas
  if (ventasAgrupadas.size > 0) {
    const ventasData = Array.from(ventasAgrupadas.entries()).map(([fechaStr, total]) => {
      const fecha = new Date(fechaStr);
      
      // CRÍTICO: Preservar timestamp original si existe
      const timestamp = timestampsExistentes.get(fechaStr) || timestampArchivo;
      
      return {
        clienteId,
        fechaVenta: fecha,
        totalVenta: total,
        timestampArchivo: timestamp
      };
    });
    
    await tx.venta.createMany({ data: ventasData });
  }
  
  // Calcular numeración por día
  await calcularNumeracionVentas(tx);
}

// ========================================
// FUNCIÓN: Calcular numeración de pagos por día
// ========================================

async function calcularNumeracionPagos(tx: any) {
  // Obtener todos los pagos ordenados
  const pagos = await tx.pago.findMany({
    orderBy: [
      { fechaPago: 'desc' },
      { timestampArchivo: 'desc' }
    ]
  });
  
  // Agrupar por día y asignar numeración
  const pagosPorDia = new Map<string, typeof pagos>();
  
  for (const pago of pagos) {
    const diaKey = pago.fechaPago.toISOString().split('T')[0];
    if (!pagosPorDia.has(diaKey)) {
      pagosPorDia.set(diaKey, []);
    }
    pagosPorDia.get(diaKey)!.push(pago);
  }
  
  // Actualizar numeración
  for (const [dia, pagosDia] of pagosPorDia.entries()) {
    const total = pagosDia.length;
    for (let i = 0; i < total; i++) {
      await tx.pago.update({
        where: { id: pagosDia[i].id },
        data: { numeroPagoDia: total - i } // Numeración inversa
      });
    }
  }
}

// ========================================
// FUNCIÓN: Calcular numeración de ventas por día
// ========================================

async function calcularNumeracionVentas(tx: any) {
  const ventas = await tx.venta.findMany({
    orderBy: [
      { fechaVenta: 'desc' },
      { timestampArchivo: 'desc' }
    ]
  });
  
  const ventasPorDia = new Map<string, typeof ventas>();
  
  for (const venta of ventas) {
    const diaKey = venta.fechaVenta.toISOString().split('T')[0];
    if (!ventasPorDia.has(diaKey)) {
      ventasPorDia.set(diaKey, []);
    }
    ventasPorDia.get(diaKey)!.push(venta);
  }
  
  for (const [dia, ventasDia] of ventasPorDia.entries()) {
    const total = ventasDia.length;
    for (let i = 0; i < total; i++) {
      await tx.venta.update({
        where: { id: ventasDia[i].id },
        data: { numeroVentaDia: total - i }
      });
    }
  }
}