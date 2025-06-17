import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query('SELECT DISTINCT EXTRACT(YEAR FROM fecha) AS year FROM ventas ORDER BY year');
    const years = result.rows.map(row => Number(row.year));
    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo años disponibles' }, { status: 500 });
  }
} 