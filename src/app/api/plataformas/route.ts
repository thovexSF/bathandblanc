import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    const query = `
      SELECT 
        plataforma,
        COUNT(DISTINCT nro_documento) as total_documentos
      FROM ventas 
      WHERE fecha IS NOT NULL 
        AND plataforma IS NOT NULL
      GROUP BY plataforma
      ORDER BY total_documentos DESC;
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener plataformas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 