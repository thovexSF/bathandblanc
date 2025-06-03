import { NextRequest, NextResponse } from 'next/server';
import { getVentasPorSucursal, Filtros } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filtros: Filtros = {
      tipoDocumento: searchParams.getAll('tipoDocumento').filter(Boolean),
      empresa: searchParams.getAll('empresa').filter(Boolean),
      sucursal: searchParams.getAll('sucursal').filter(Boolean),
      años: searchParams.getAll('años').filter(Boolean).map(Number),
      meses: searchParams.getAll('meses').filter(Boolean).map(Number),
    };

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      const value = filtros[key as keyof Filtros];
      if (!value || value.length === 0) {
        delete filtros[key as keyof Filtros];
      }
    });

    const ventas = await getVentasPorSucursal(filtros);
    
    return NextResponse.json(ventas);
  } catch (error) {
    console.error('Error obteniendo ventas por sucursal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 