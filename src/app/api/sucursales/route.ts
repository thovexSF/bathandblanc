import { NextResponse } from 'next/server';
import { getSucursales } from '@/lib/queries';

export async function GET() {
  try {
    const sucursales = await getSucursales();
    return NextResponse.json({
      success: true,
      data: sucursales
    });
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 