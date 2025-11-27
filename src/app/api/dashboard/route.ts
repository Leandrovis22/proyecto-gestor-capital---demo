import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

export async function GET(request: NextRequest) {
  // Validar autenticación
  const authError = validateAuth(request);
  if (authError) return authError;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    
    const FECHA_INICIO_CAPITAL_PAGOS = new Date('2025-11-04');
    const FECHA_INICIO_CAPITAL_VENTAS = new Date('2025-11-04');
    
    // Calcular ÚLTIMA SEMANA COMPLETA (lunes a domingo) y SEMANA ACTUAL (lunes a domingo)
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado

    // Calcular cuántos días retroceder para llegar al LUNES PASADO (última semana completa)
    let diasHastaLunesPasado;
    if (diaSemana === 0) {
      diasHastaLunesPasado = 7;
    } else {
      diasHastaLunesPasado = diaSemana + 6;
    }

    const fechaLunesPasado = new Date(hoy);
    fechaLunesPasado.setDate(hoy.getDate() - diasHastaLunesPasado);
    const fechaDomingoPasado = new Date(fechaLunesPasado);
    fechaDomingoPasado.setDate(fechaLunesPasado.getDate() + 6);

    const inicioSemana = new Date(Date.UTC(
      fechaLunesPasado.getFullYear(),
      fechaLunesPasado.getMonth(),
      fechaLunesPasado.getDate(),
      0, 0, 0, 0
    ));
    const finSemana = new Date(Date.UTC(
      fechaDomingoPasado.getFullYear(),
      fechaDomingoPasado.getMonth(),
      fechaDomingoPasado.getDate(),
      23, 59, 59, 999
    ));

    // Semana actual (lunes a domingo)
    const diasHastaLunesActual = diaSemana === 0 ? 6 : diaSemana - 1;
    const fechaLunesActual = new Date(hoy);
    fechaLunesActual.setDate(hoy.getDate() - diasHastaLunesActual);
    const fechaDomingoActual = new Date(fechaLunesActual);
    fechaDomingoActual.setDate(fechaLunesActual.getDate() + 6);

    const inicioSemanaActual = new Date(Date.UTC(
      fechaLunesActual.getFullYear(),
      fechaLunesActual.getMonth(),
      fechaLunesActual.getDate(),
      0, 0, 0, 0
    ));
    const finSemanaActual = new Date(Date.UTC(
      fechaDomingoActual.getFullYear(),
      fechaDomingoActual.getMonth(),
      fechaDomingoActual.getDate(),
      23, 59, 59, 999
    ));
    
    // Filtros de fecha personalizados (si se proporcionan)
    const wherePersonalizado = fechaInicio && fechaFin ? {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    } : undefined;
    
    // Calcular métricas en paralelo (totales, listados y agregados por semana)
    const [
      totalInversiones,
      totalInversionesNoConfirmadas,
      totalPagos,
      totalVentas,
      totalGastos,
      totalGastosNoConfirmadas,
      totalSaldoDeudores,
      // agregados semana pasada
      inversionesSemana,
      inversionesSemanaNoConfirmadas,
      pagosSemana,
      ventasSemana,
      gastosSemana,
      gastosSemanaNoConfirmadas,
      // agregados semana actual
      inversionesSemanaActual,
      inversionesSemanaActualNoConfirmadas,
      pagosSemanaActual,
      ventasSemanaActual,
      gastosSemanaActual,
      gastosSemanaActualNoConfirmadas,
      ultimasPagos,
      ultimasVentas,
      clientesDeudores
    ] = await Promise.all([
        // Total Inversiones (solo confirmadas)
        prisma.inversion.aggregate({
          _sum: { monto: true },
          where: {
            confirmado: true,
            ...(wherePersonalizado ? { fecha: wherePersonalizado } : {})
          }
        }),
        // Total Inversiones NO confirmadas
        prisma.inversion.aggregate({
          _sum: { monto: true },
          where: {
            confirmado: false,
            ...(wherePersonalizado ? { fecha: wherePersonalizado } : {})
          }
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
      
      // Total Gastos (solo confirmados)
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: {
          confirmado: true,
          ...(wherePersonalizado ? { fecha: wherePersonalizado } : {})
        }
      }),
      // Total Gastos NO confirmados
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: {
          confirmado: false,
          ...(wherePersonalizado ? { fecha: wherePersonalizado } : {})
        }
      }),
      // Total Saldo Deudores
      prisma.cliente.aggregate({ _sum: { saldoAPagar: true }, where: { saldoAPagar: { gt: 0 } } }),

        // Inversiones última semana completa (solo confirmadas)
      prisma.inversion.aggregate({ _sum: { monto: true }, where: { confirmado: true, fecha: { gte: inicioSemana, lte: finSemana } } }),
        // Inversiones última semana completa NO confirmadas
        prisma.inversion.aggregate({ _sum: { monto: true }, where: { confirmado: false, fecha: { gte: inicioSemana, lte: finSemana } } }),
        // Pagos última semana completa
        prisma.pago.aggregate({ _sum: { monto: true }, where: { fechaPago: { gte: inicioSemana, lte: finSemana } } }),
        // Ventas última semana completa
        prisma.venta.aggregate({ _sum: { totalVenta: true }, where: { fechaVenta: { gte: inicioSemana, lte: finSemana } } }),
        // Gastos última semana completa (NO confirmadas y confirmadas separadas)
        prisma.gasto.aggregate({ _sum: { monto: true }, where: { confirmado: true, fecha: { gte: inicioSemana, lte: finSemana } } }),
        prisma.gasto.aggregate({ _sum: { monto: true }, where: { confirmado: false, fecha: { gte: inicioSemana, lte: finSemana } } }),

        // Inversiones semana actual (solo confirmadas)
        prisma.inversion.aggregate({ _sum: { monto: true }, where: { confirmado: true, fecha: { gte: inicioSemanaActual, lte: finSemanaActual } } }),
          // Inversiones semana actual NO confirmadas
          prisma.inversion.aggregate({ _sum: { monto: true }, where: { confirmado: false, fecha: { gte: inicioSemanaActual, lte: finSemanaActual } } }),
        // Pagos semana actual
        prisma.pago.aggregate({ _sum: { monto: true }, where: { fechaPago: { gte: inicioSemanaActual, lte: finSemanaActual } } }),
        // Ventas semana actual
        prisma.venta.aggregate({ _sum: { totalVenta: true }, where: { fechaVenta: { gte: inicioSemanaActual, lte: finSemanaActual } } }),
        // Gastos semana actual (confirmadas y no confirmadas)
        prisma.gasto.aggregate({ _sum: { monto: true }, where: { confirmado: true, fecha: { gte: inicioSemanaActual, lte: finSemanaActual } } }),
        prisma.gasto.aggregate({ _sum: { monto: true }, where: { confirmado: false, fecha: { gte: inicioSemanaActual, lte: finSemanaActual } } }),
      
      // Últimos 10 pagos
      prisma.pago.findMany({
        take: 10,
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
    
    // Calcular capital total
    const inversiones = Number(totalInversiones._sum.monto || 0);
    const inversionesNoConfirmadas = Number(totalInversionesNoConfirmadas._sum.monto || 0);
    const pagos = Number(totalPagos._sum.monto || 0);
    const ventas = Number(totalVentas._sum.totalVenta || 0);
    const gastos = Number(totalGastos._sum.monto || 0);
    const gastosNoConfirmadas = Number(totalGastosNoConfirmadas._sum.monto || 0);
    const capital = inversiones + pagos - ventas - gastos;
    
    // Valores semanales (por categoría)
    const inversionesSem = Number(inversionesSemana._sum.monto || 0);
    const inversionesSemNoConfirmadas = Number(inversionesSemanaNoConfirmadas._sum.monto || 0);
    const pagosSem = Number(pagosSemana._sum.monto || 0);
    const ventasSem = Number(ventasSemana._sum.totalVenta || 0);
    const gastosSem = Number(gastosSemana._sum.monto || 0);
    const gastosSemNoConfirmadas = Number(gastosSemanaNoConfirmadas._sum.monto || 0);

    const inversionesAct = Number(inversionesSemanaActual._sum.monto || 0);
    const inversionesActNoConfirmadas = Number(inversionesSemanaActualNoConfirmadas._sum.monto || 0);
    const pagosAct = Number(pagosSemanaActual._sum.monto || 0);
    const ventasAct = Number(ventasSemanaActual._sum.totalVenta || 0);
    const gastosAct = Number(gastosSemanaActual._sum.monto || 0);
    const gastosActNoConfirmadas = Number(gastosSemanaActualNoConfirmadas._sum.monto || 0);

    // Obtener estado de sincronización (si existe) para usar su marca de tiempo
    const syncEstado = await prisma.syncStatus.findUnique({ where: { id: 'google-apps-script' } });

    return NextResponse.json({
      capital: {
        total: capital,
        inversiones,
        inversionesNoConfirmadas,
        gastosNoConfirmadas,
        pagos,
        ventas,
        gastos
      },
      semanaPasada: {
        inversiones: inversionesSem,
        inversionesNoConfirmadas: inversionesSemNoConfirmadas,
        gastosNoConfirmadas: gastosSemNoConfirmadas,
        pagos: pagosSem,
        ventas: ventasSem,
        gastos: gastosSem,
        rangoFechas: { inicio: inicioSemana, fin: finSemana }
      },
      semanaActual: {
        inversiones: inversionesAct,
        inversionesNoConfirmadas: inversionesActNoConfirmadas,
        gastosNoConfirmadas: gastosActNoConfirmadas,
        pagos: pagosAct,
        ventas: ventasAct,
        gastos: gastosAct,
        rangoFechas: { inicio: inicioSemanaActual, fin: finSemanaActual }
      },
      saldoDeudores: Number(totalSaldoDeudores._sum.saldoAPagar || 0),
      ultimasPagos,
      ultimasVentas,
      clientesDeudores,
      fechaActualizacion: syncEstado ? syncEstado.ultimaActualizacion : new Date()
    });
    
  } catch (error) {
    console.error('Error en dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 });
  }
}