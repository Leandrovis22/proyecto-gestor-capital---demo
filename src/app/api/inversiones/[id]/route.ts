import { NextRequest, NextResponse } from 'next/server';
import { updateInversion, deleteInversion } from '@/lib/demoData';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const inversionActualizada = updateInversion(params.id, {
      fecha: body.fecha,
      descripcion: body.descripcion,
      monto: typeof body.monto === 'number' ? body.monto : parseFloat(body.monto),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eliminado = deleteInversion(params.id);
    
    if (!eliminado) {
      return NextResponse.json({ error: 'Inversión no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar inversión' }, { status: 500 });
  }
}
