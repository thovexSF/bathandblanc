import { NextRequest, NextResponse } from 'next/server';
import { getVentasPorCategoria, Filtros } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Construir filtros desde los parámetros de búsqueda
    const filtros: Filtros = {};
    
    // Obtener parámetro de límite
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Obtener arrays de parámetros múltiples
    const tipoDocumento = searchParams.getAll('tipoDocumento');
    const empresa = searchParams.getAll('empresa');
    const sucursal = searchParams.getAll('sucursal');
    const años = searchParams.getAll('años').map(Number);
    const meses = searchParams.getAll('meses').map(Number);
    
    if (tipoDocumento.length > 0) filtros.tipoDocumento = tipoDocumento;
    if (empresa.length > 0) filtros.empresa = empresa;
    if (sucursal.length > 0) filtros.sucursal = sucursal;
    if (años.length > 0) filtros.años = años;
    if (meses.length > 0) filtros.meses = meses;
    
    const data = await getVentasPorCategoria(limit, filtros);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error obteniendo ventas por categoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 