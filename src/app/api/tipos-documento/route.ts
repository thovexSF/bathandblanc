import { NextResponse } from 'next/server';
import { getTiposDocumento } from '@/lib/queries';

export async function GET() {
  try {
    const tiposDocumento = await getTiposDocumento();
    return NextResponse.json(tiposDocumento);
  } catch (error) {
    console.error('Error obteniendo tipos de documento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 