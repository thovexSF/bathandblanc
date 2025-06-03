import { NextResponse } from 'next/server';
import { getPlataformas } from '@/lib/queries';

export async function GET() {
  try {
    const plataformas = await getPlataformas();
    return NextResponse.json(plataformas);
  } catch (error) {
    console.error('Error obteniendo plataformas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 