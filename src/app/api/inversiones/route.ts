import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

export async function GET(request: NextRequest) {
  try {
    const inversiones = await prisma.inversion.findMany({
      orderBy: { fecha: 'desc' }
    });
    return NextResponse.json(inversiones);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener inversiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = validateAuth(request);
  if (authError) return authError;
  
  try {
    const body = await request.json();
    const inversion = await prisma.inversion.create({
      data: {
        fecha: new Date(body.fecha),
        descripcion: body.descripcion,
        monto: body.monto,
        categoria: body.categoria,
        confirmado: body.confirmado ?? true
      }
    });
    return NextResponse.json(inversion);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear inversión' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    await prisma.inversion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar inversión' }, { status: 400 });
  }
}
