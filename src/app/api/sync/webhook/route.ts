import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    estado: {
      estado: 'completado',
      mensaje: 'Sistema en modo demo',
      ultimaActualizacion: new Date().toISOString(),
      archivosActualizados: 0,
      archivosOmitidos: 0,
      duracionSegundos: 0
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Webhook recibido (modo demo)' });
}
