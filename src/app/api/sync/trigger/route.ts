import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    exito: true,
    estado: 'completado',
    mensaje: 'Sincronización exitosa (modo demo)',
    archivosActualizados: 0,
    archivosOmitidos: 0,
    duracionSegundos: 0
  });
}
