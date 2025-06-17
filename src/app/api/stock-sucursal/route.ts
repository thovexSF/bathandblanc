import { NextResponse } from 'next/server';
import { getStockPorSucursal } from '@/lib/queries';

export async function GET() {
  try {
    const stock = await getStockPorSucursal();
    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error obteniendo stock por sucursal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 