import { NextResponse } from 'next/server';
import { getCategorias } from '@/lib/queries';

export async function GET() {
  try {
    const categorias = await getCategorias();
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 