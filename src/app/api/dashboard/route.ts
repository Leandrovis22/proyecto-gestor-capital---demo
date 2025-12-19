import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/demoData';

export async function GET(request: NextRequest) {
  try {
    const data = getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in dashboard route:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}
