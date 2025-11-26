// app/api/sync/receive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    
    // SOLUCIÓN: Aumentar timeout de transacción a 30 segundos
    const resultado = await prisma.$transaction(async (tx: any) => {
      // 1. CREAR O ACTUALIZAR CLIENTE (buscar por archivoId)
      const cliente = await tx.cliente.upsert({
        where: { archivoId: datos.archivoId },
        update: {
          nombre: datos.nombreArchivo,
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
          data: datos.registrosConsolidados.map((reg: any) => ({
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
      
      // 4. REGENERAR PAGOS (DENTRO de la transacción)
      await regenerarPagos(tx, cliente.id);
      
      // 5. REGENERAR VENTAS (DENTRO de la transacción)
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
    }, {
      maxWait: 30000, // Esperar hasta 30s para adquirir conexión
      timeout: 30000,  // Timeout de 30s para la transacción completa
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
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar datos' },
      { status: 500 }
    );
  }
}

// ========================================
// FUNCIÓN: Regenerar Pagos (OPTIMIZADA)
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
    orderBy: [
      { fechaPago: 'desc' }
    ]
  });
  
  // Crear pagos con numeración calculada de antemano
  if (registros.length > 0) {
    // Agrupar por día para calcular numeración
    const pagosPorDia = new Map<string, typeof registros>();
    
    for (const reg of registros) {
      const diaKey = reg.fechaPago!.toISOString().split('T')[0];
      if (!pagosPorDia.has(diaKey)) {
        pagosPorDia.set(diaKey, []);
      }
      pagosPorDia.get(diaKey)!.push(reg);
    }
    
    // Crear pagos con numeración ya calculada
    const pagosData = [];
    for (const [dia, regs] of pagosPorDia.entries()) {
      const total = regs.length;
      for (let i = 0; i < total; i++) {
        pagosData.push({
          clienteId,
          fechaPago: regs[i].fechaPago!,
          monto: regs[i].entrega,
          tipoPago: regs[i].columnaK,
          timestampArchivo: new Date(),
          numeroPagoDia: total - i // Numeración inversa
        });
      }
    }
    
    // INSERCIÓN BATCH en lugar de updates individuales
    await tx.pago.createMany({ data: pagosData });
  }
}

// ========================================
// FUNCIÓN: Regenerar Ventas (OPTIMIZADA)
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
    ventasExistentes.map((v: any) => [
      v.fechaVenta.toISOString().split('T')[0],
      v.timestampArchivo
    ])
  );
  
  // Eliminar ventas antiguas
  await tx.venta.deleteMany({
    where: { clienteId }
  });
  
  // Crear ventas con numeración ya calculada
  if (ventasAgrupadas.size > 0) {
    // Ordenar fechas descendente
    const fechasOrdenadas = Array.from(ventasAgrupadas.keys()).sort().reverse();
    
    // Agrupar por día para numeración
    const ventasPorDia = new Map<string, Array<{ fecha: Date; total: number; timestamp: Date }>>();
    
    for (const fechaStr of fechasOrdenadas) {
      const fecha = new Date(fechaStr);
      const total = ventasAgrupadas.get(fechaStr)!;
      const timestampExistente = timestampsExistentes.get(fechaStr);
      const timestamp: Date = timestampExistente instanceof Date ? timestampExistente : timestampArchivo;
      
      const diaKey = fechaStr; // Ya está en formato YYYY-MM-DD
      if (!ventasPorDia.has(diaKey)) {
        ventasPorDia.set(diaKey, []);
      }
      ventasPorDia.get(diaKey)!.push({ fecha, total, timestamp });
    }
    
    // Crear ventas con numeración
    const ventasData = [];
    for (const [dia, ventas] of ventasPorDia.entries()) {
      const totalDia = ventas.length;
      for (let i = 0; i < totalDia; i++) {
        ventasData.push({
          clienteId,
          fechaVenta: ventas[i].fecha,
          totalVenta: ventas[i].total,
          timestampArchivo: ventas[i].timestamp,
          numeroVentaDia: totalDia - i // Numeración inversa
        });
      }
    }
    
    // INSERCIÓN BATCH
    await tx.venta.createMany({ data: ventasData });
  }
}