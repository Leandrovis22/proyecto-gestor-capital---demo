import { NextRequest, NextResponse } from 'next/server';
import { updateGasto, deleteGasto } from '@/lib/demoData';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const gastoActualizado = updateGasto(params.id, {
      fecha: body.fecha,
      descripcion: body.descripcion,
      monto: typeof body.monto === 'number' ? body.monto : parseFloat(body.monto),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eliminado = deleteGasto(params.id);
    
    if (!eliminado) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 });
  }
}
