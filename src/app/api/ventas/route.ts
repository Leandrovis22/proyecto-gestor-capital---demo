import { NextRequest, NextResponse } from 'next/server';
import { getVentas, getClientes } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const ventas = getVentas();
    const clientes = getClientes();
    
    const ventasConCliente = ventas.map(venta => ({
      ...venta,
      cliente: clientes.find(c => c.id === venta.clienteId) || { nombre: 'Desconocido' }
    }));
    
    return NextResponse.json(ventasConCliente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}
