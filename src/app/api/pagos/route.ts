import { NextRequest, NextResponse } from 'next/server';
import { getPagos, getClientes } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const pagos = getPagos();
    const clientes = getClientes();
    
    const pagosConCliente = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.clienteId) || { nombre: 'Desconocido' }
    }));
    
    return NextResponse.json(pagosConCliente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}
