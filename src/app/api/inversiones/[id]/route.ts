import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const inversionSchema = z.object({
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  fecha: z.string().transform((str) => new Date(str)),
  confirmado: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = inversionSchema.parse(body);

    const inversion = await prisma.inversion.update({
      where: { id },
      data: {
        fecha: validated.fecha,
        descripcion: validated.descripcion,
        monto: validated.monto,
        confirmado: validated.confirmado ?? true,
      },
    });

    return NextResponse.json({ inversion });
  } catch (error) {
    console.error('Error al actualizar inversión:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error al actualizar inversión' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.inversion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar inversión:', error);
    return NextResponse.json({ error: 'Error al eliminar inversión' }, { status: 500 });
  }
}
