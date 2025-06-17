import { NextRequest, NextResponse } from 'next/server';
import { getRotacionProductos } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '20');
    
    const rotacion = await getRotacionProductos(limite);
    return NextResponse.json(rotacion);
  } catch (error) {
    console.error('Error obteniendo rotación de productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 