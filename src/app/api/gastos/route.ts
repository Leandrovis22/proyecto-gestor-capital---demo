import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const gastos = await prisma.gasto.findMany({
      orderBy: { fecha: 'desc' }
    });
    return NextResponse.json(gastos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gasto = await prisma.gasto.create({
      data: {
        fecha: new Date(body.fecha),
        descripcion: body.descripcion,
        monto: body.monto,
        categoria: body.categoria,
        confirmado: body.confirmado ?? true
      }
    });
    return NextResponse.json(gasto);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    await prisma.gasto.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 400 });
  }
}
