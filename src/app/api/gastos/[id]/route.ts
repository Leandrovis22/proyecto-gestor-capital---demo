import { NextRequest, NextResponse } from 'next/server';

// Las operaciones de gastos ahora se manejan completamente en el cliente

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  return NextResponse.json(body);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ success: true });
}
