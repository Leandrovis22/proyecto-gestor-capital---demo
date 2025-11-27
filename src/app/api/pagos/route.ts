import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

export async function GET(request: NextRequest) {
  const authError = validateAuth(request);
  if (authError) return authError;
  try {
    const searchParams = request.nextUrl.searchParams;
    // Cambiar fecha mínima por defecto a 2025-10-04
    const fechaDesde = searchParams.get('desde') || '2025-10-04';
    const clienteId = searchParams.get('clienteId');
    const pagos = await prisma.pago.findMany({
      where: {
        fechaPago: { gte: new Date(fechaDesde) },
        ...(clienteId && { clienteId })
      },
      include: { cliente: true },
      orderBy: [
        { fechaPago: 'desc' },
        { timestampArchivo: 'desc' }
      ]
    });
    return NextResponse.json(pagos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}
