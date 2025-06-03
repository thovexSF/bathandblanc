import { NextResponse } from 'next/server';
import { getSucursales } from '@/lib/queries';

export async function GET() {
  try {
    const sucursales = await getSucursales();
    return NextResponse.json(sucursales);
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 