import { NextRequest, NextResponse } from 'next/server';
import { getComparacionCostos } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '50');
    
    const comparacion = await getComparacionCostos(limite);
    
    return NextResponse.json(comparacion);
  } catch (error) {
    console.error('Error obteniendo comparación de costos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 