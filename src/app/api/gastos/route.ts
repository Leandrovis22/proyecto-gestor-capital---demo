import { NextRequest, NextResponse } from 'next/server';

// Las operaciones de gastos ahora se manejan completamente en el cliente
// Estas rutas API solo devuelven respuestas vacías para no romper la compatibilidad

export async function GET(request: NextRequest) {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ ...body, id: 'temp' });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(body);
}
