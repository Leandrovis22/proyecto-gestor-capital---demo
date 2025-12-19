import { NextRequest, NextResponse } from 'next/server';
import { getInversiones, addInversion, updateInversion } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const inversiones = getInversiones();
    return NextResponse.json(inversiones);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener inversiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nuevaInversion = addInversion({
      fecha: body.fecha,
      descripcion: body.descripcion,
      monto: parseFloat(body.monto),
      confirmada: body.confirmada ?? true
    });
    return NextResponse.json(nuevaInversion);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear inversión' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const inversionActualizada = updateInversion(body.id, {
      confirmada: body.confirmada
    });
    
    if (!inversionActualizada) {
      return NextResponse.json({ error: 'Inversión no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(inversionActualizada);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar inversión' }, { status: 500 });
  }
}
