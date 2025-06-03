import { NextResponse } from 'next/server';
import { getEmpresas } from '@/lib/queries';

export async function GET() {
  try {
    const empresas = await getEmpresas();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 