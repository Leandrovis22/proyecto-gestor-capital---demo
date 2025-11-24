import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    
    const FECHA_INICIO_CAPITAL_PAGOS = new Date('2025-11-04');
    const FECHA_INICIO_CAPITAL_VENTAS = new Date('2025-11-04');
    
    // Filtros de fecha personalizados (si se proporcionan)
    const wherePersonalizado = fechaInicio && fechaFin ? {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    } : undefined;
    
    // Calcular métricas en paralelo
    const [
      totalInversiones,
      totalPagos,
      totalVentas,
      totalGastos,
      totalSaldoDeudores,
      ultimasPagos,
      ultimasVentas,
      clientesDeudores
    ] = await Promise.all([
      // Total Inversiones
      prisma.inversion.aggregate({
        _sum: { monto: true },
        where: wherePersonalizado ? { fecha: wherePersonalizado } : undefined
      }),
      
      // Total Pagos (>= 04/11/2025)
      prisma.pago.aggregate({
        _sum: { monto: true },
        where: {
          fechaPago: wherePersonalizado || { gte: FECHA_INICIO_CAPITAL_PAGOS }
        }
      }),
      
      // Total Ventas (>= 04/11/2025)
      prisma.venta.aggregate({
        _sum: { totalVenta: true },
        where: {
          fechaVenta: wherePersonalizado || { gte: FECHA_INICIO_CAPITAL_VENTAS }
        }
      }),
      
      // Total Gastos
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: wherePersonalizado ? { fecha: wherePersonalizado } : undefined
      }),
      
      // Total Saldo Deudores
      prisma.cliente.aggregate({
        _sum: { saldoAPagar: true },
        where: { saldoAPagar: { gt: 0 } }
      }),
      
      // Últimos 5 pagos
      prisma.pago.findMany({
        take: 5,
        include: { cliente: true },
        orderBy: [
          { fechaPago: 'desc' },
          { timestampArchivo: 'desc' }
        ]
      }),
      
      // Últimas 10 ventas
      prisma.venta.findMany({
        take: 10,
        include: { cliente: true },
        orderBy: [
          { fechaVenta: 'desc' },
          { timestampArchivo: 'desc' }
        ]
      }),
      
      // Clientes deudores (top 10)
      prisma.cliente.findMany({
        where: { saldoAPagar: { gt: 0 } },
        orderBy: { saldoAPagar: 'desc' },
        take: 10
      })
    ]);
    
    // Calcular capital
    const inversiones = Number(totalInversiones._sum.monto || 0);
    const pagos = Number(totalPagos._sum.monto || 0);
    const ventas = Number(totalVentas._sum.totalVenta || 0);
    const gastos = Number(totalGastos._sum.monto || 0);
    const capital = inversiones + pagos - ventas - gastos;
    
    return NextResponse.json({
      capital: {
        total: capital,
        inversiones,
        pagos,
        ventas,
        gastos
      },
      saldoDeudores: Number(totalSaldoDeudores._sum.saldoAPagar || 0),
      ultimasPagos,
      ultimasVentas,
      clientesDeudores,
      fechaActualizacion: new Date()
    });
    
  } catch (error) {
    console.error('Error en dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 });
  }
}
