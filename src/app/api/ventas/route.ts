import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fechaDesde = searchParams.get('desde') || '2025-10-01';
    const clienteId = searchParams.get('clienteId');
    
    const ventas = await prisma.venta.findMany({
      where: {
        fechaVenta: { gte: new Date(fechaDesde) },
        ...(clienteId && { clienteId })
      },
      include: { cliente: true },
      orderBy: [
        { fechaVenta: 'desc' },
        { timestampArchivo: 'desc' }
      ]
    });
    
    return NextResponse.json(ventas);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}
