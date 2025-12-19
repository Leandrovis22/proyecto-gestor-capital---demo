import { NextRequest, NextResponse } from 'next/server';
import { getGastos, addGasto, updateGasto } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const gastos = getGastos();
    return NextResponse.json(gastos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nuevoGasto = addGasto({
      fecha: body.fecha,
      descripcion: body.descripcion,
      monto: parseFloat(body.monto),
      confirmado: body.confirmado ?? true
    });
    return NextResponse.json(nuevoGasto);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const gastoActualizado = updateGasto(body.id, {
      confirmado: body.confirmado
    });
    
    if (!gastoActualizado) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(gastoActualizado);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar gasto' }, { status: 500 });
  }
}
