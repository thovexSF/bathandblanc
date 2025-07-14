import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const empresa = searchParams.get('empresa') || '';
    const sku = searchParams.get('sku') || '';
    const busqueda = searchParams.get('busqueda') || '';
    const sortBy = searchParams.get('sortBy') || 'fecha_actualizacion';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('Consultando lista de precios:', { page, limit, empresa, sku, busqueda, sortBy, sortOrder });

    let whereConditions = ['activo = TRUE'];
    const params = [];
    let paramIndex = 1;

    // Filtros
    if (empresa) {
      whereConditions.push(`empresa = $${paramIndex}`);
      params.push(empresa);
      paramIndex++;
    }

    if (sku) {
      whereConditions.push(`sku = $${paramIndex}`);
      params.push(sku);
      paramIndex++;
    }

    if (busqueda) {
      whereConditions.push(`(sku ILIKE $${paramIndex} OR nombre_producto ILIKE $${paramIndex} OR descripcion_variante ILIKE $${paramIndex})`);
      params.push(`%${busqueda}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validar y sanitizar campos de ordenamiento
    const validSortFields = ['sku', 'nombre_producto', 'empresa', 'precio_sin_iva', 'precio_con_iva', 'fecha_actualizacion', 'fecha_creacion'];
    const validSortField = validSortFields.includes(sortBy) ? sortBy : 'fecha_actualizacion';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
    
    // Construir ORDER BY
    let orderByClause = `ORDER BY ${validSortField} ${validSortOrder.toUpperCase()}`;
    
    // Agregar ordenamiento secundario para consistencia
    if (validSortField !== 'sku') {
      orderByClause += ', sku';
    }

    // Query principal con paginación
    const query = `
      SELECT 
        id,
        sku,
        empresa,
        precio_sin_iva,
        precio_con_iva,
        fecha_actualizacion,
        fecha_creacion,
        nombre_producto,
        descripcion_variante,
        id_variante_bsale
      FROM lista_precios 
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Query de conteo
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM lista_precios 
      ${whereClause}
    `;

    console.log('Ejecutando consulta de lista de precios...');
    const [dataResult, countResult] = await Promise.all([
      client.query(query, params),
      client.query(countQuery, params.slice(0, -2)) // Remover limit y offset para count
    ]);
    
    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Lista de precios obtenida: ${dataResult.rows.length} registros de ${total} totales`);

    // Procesar resultados
    const listaPrecios = dataResult.rows.map(row => ({
      id: row.id,
      sku: row.sku,
      empresa: row.empresa,
      precio_sin_iva: parseFloat(row.precio_sin_iva) || 0,
      precio_con_iva: parseFloat(row.precio_con_iva) || 0,
      fecha_actualizacion: row.fecha_actualizacion,
      fecha_creacion: row.fecha_creacion,
      nombre_producto: row.nombre_producto,
      descripcion_variante: row.descripcion_variante,
      id_variante_bsale: row.id_variante_bsale
    }));

    // Estadísticas adicionales
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT sku) as skus_unicos,
        COUNT(DISTINCT empresa) as empresas_activas,
        MAX(fecha_actualizacion) as ultima_actualizacion,
        AVG(precio_con_iva) as precio_promedio
      FROM lista_precios 
      WHERE activo = TRUE
    `;

    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      data: listaPrecios,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: {
        skus_unicos: parseInt(stats.skus_unicos) || 0,
        empresas_activas: parseInt(stats.empresas_activas) || 0,
        ultima_actualizacion: stats.ultima_actualizacion,
        precio_promedio: parseFloat(stats.precio_promedio) || 0
      },
      sort: {
        field: validSortField,
        order: validSortOrder
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en lista de precios:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener lista de precios',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
    
  } finally {
    client.release();
  }
} 