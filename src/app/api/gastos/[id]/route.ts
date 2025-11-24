import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const gastoSchema = z.object({
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  fecha: z.string().transform((str) => new Date(str)),
  confirmado: z.boolean(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = gastoSchema.parse(body);

    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        fecha: validated.fecha,
        descripcion: validated.descripcion,
        monto: validated.monto,
        confirmado: validated.confirmado,
      },
    });

    return NextResponse.json({ gasto });
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error al actualizar gasto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.gasto.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 });
  }
}
