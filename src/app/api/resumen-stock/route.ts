import { NextResponse } from 'next/server';
import { getResumenStock } from '@/lib/queries';

export async function GET() {
  try {
    const resumen = await getResumenStock();
    return NextResponse.json(resumen);
  } catch (error) {
    console.error('Error obteniendo resumen de stock:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 