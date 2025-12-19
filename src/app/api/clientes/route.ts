import { NextRequest, NextResponse } from 'next/server';
import { getClientes } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const soloDeudores = searchParams.get('deudores') === 'true';
    
    let clientes = getClientes();
    
    if (soloDeudores) {
      clientes = clientes.filter(c => c.saldoAPagar > 0);
    }
    
    clientes.sort((a, b) => b.saldoAPagar - a.saldoAPagar);
    
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}
