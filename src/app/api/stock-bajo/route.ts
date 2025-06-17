import { NextRequest, NextResponse } from 'next/server';
import { getStockBajo } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '20');
    
    const stockBajo = await getStockBajo(limite);
    return NextResponse.json(stockBajo);
  } catch (error) {
    console.error('Error obteniendo stock bajo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 