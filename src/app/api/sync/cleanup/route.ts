import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const API_KEY = process.env.SYNC_API_KEY || '';

function verificarAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
  return token === API_KEY;
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { archivosActivos } = await request.json();

    if (!Array.isArray(archivosActivos)) {
      return NextResponse.json(
        { error: 'archivosActivos debe ser un array' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Limpiando archivos eliminados (activos: ${archivosActivos.length})`);

    // Eliminar clientes cuyos archivos ya no existen
    const resultado = await prisma.cliente.deleteMany({
      where: {
        archivoId: {
          notIn: archivosActivos
        }
      }
    });

    console.log(`✅ Clientes eliminados: ${resultado.count}`);

    return NextResponse.json({
      success: true,
      clientesEliminados: resultado.count,
      archivosActivos: archivosActivos.length
    });

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en limpieza' },
      { status: 500 }
    );
  }
}
