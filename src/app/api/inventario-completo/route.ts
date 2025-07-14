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
    const empresa = searchParams.get('empresa') || '';
    const sucursal = searchParams.get('sucursal') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const consolidado = searchParams.get('consolidado') === 'true';
    const sortField = searchParams.get('sortField') || 'producto_servicio';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    const hideZeroStock = searchParams.get('hideZeroStock') === 'true';
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const sucursales = searchParams.get('sucursales')?.split(',') || [];

    console.log('Consultando inventario completo:', { empresa, sucursal, page, limit, consolidado, sortField, sortDirection, hideZeroStock, fecha, sucursales });

    const params = [];
    let paramIndex = 1;

    // Construir filtros para las consultas
    let whereFilters = '';
    
    if (empresa) {
      whereFilters += ` AND sa.empresa = $${paramIndex}`;
      params.push(empresa);
      paramIndex++;
    }

    if (sucursal) {
      whereFilters += ` AND sa.sucursal = $${paramIndex}`;
      params.push(sucursal);
      paramIndex++;
    }

    // Filtrar por sucursales específicas
    if (sucursales.length > 0) {
      whereFilters += ` AND sa.sucursal = ANY($${paramIndex})`;
      params.push(sucursales);
      paramIndex++;
    }

    let query = `
      WITH stock_actual AS (
        -- Stock más reciente por SKU y sucursal
        SELECT DISTINCT ON (sh1.sku, sh1.sucursal)
          sh1.sku,
          sh1.sucursal,
          sh1.empresa,
          sh1.producto_servicio,
          sh1.variante,
          sh1.stock_disponible::text::numeric as stock_disponible,
          sh1.costo_unitario::text::numeric as costo_unitario,
          sh1.fecha as fecha_stock
      FROM stock_historico sh1
      WHERE sh1.fecha = (
        SELECT MAX(sh2.fecha) 
        FROM stock_historico sh2 
          WHERE sh2.sku = sh1.sku AND sh2.sucursal = sh1.sucursal
        )
      ),
      precios_bath_white AS (
        -- Precios específicamente de COMERCIALIZADORA BATH & WHITE LTDA
        SELECT 
          sku,
          precio_sin_iva,
          precio_con_iva,
          fecha_actualizacion,
          nombre_producto,
          descripcion_variante
        FROM lista_precios 
        WHERE activo = TRUE 
        AND empresa = 'COMERCIALIZADORA BATH & WHITE LTDA'
      ),
      stock_consolidado AS (
        -- Consolidar stock por SKU sumando todas las sucursales seleccionadas
        SELECT 
          sa.sku,
          MAX(sa.empresa) as empresa,
          MAX(COALESCE(pbw.nombre_producto, sa.producto_servicio)) as producto_servicio,
          MAX(sa.variante) as variante,
          SUM(sa.stock_disponible) as stock_total_disponible,
          AVG(sa.costo_unitario) as costo_promedio,
          COUNT(DISTINCT sa.sucursal) as total_sucursales,
          MAX(sa.fecha_stock) as ultima_actualizacion,
          STRING_AGG(DISTINCT sa.sucursal, ', ' ORDER BY sa.sucursal) as sucursales_con_stock,
          pbw.precio_con_iva,
          pbw.precio_sin_iva,
          pbw.fecha_actualizacion as fecha_precio
        FROM stock_actual sa
        LEFT JOIN precios_bath_white pbw ON sa.sku = pbw.sku
        WHERE 1=1 ${whereFilters}
        GROUP BY sa.sku, pbw.precio_con_iva, pbw.precio_sin_iva, pbw.fecha_actualizacion
      )
      SELECT 
        sc.sku,
        sc.empresa,
        'CONSOLIDADO' as sucursal,
        sc.producto_servicio,
        sc.variante,
        sc.stock_total_disponible as stock_disponible,
        sc.costo_promedio as costo_unitario,
        sc.ultima_actualizacion as fecha_stock,
        
        -- Precio desde Bath & White específicamente
        sc.precio_con_iva as precio_venta,
        'COMERCIALIZADORA BATH & WHITE LTDA' as empresa_precio,
        sc.fecha_precio,
        
        -- Cálculos de margen y valor
        CASE 
          WHEN sc.costo_promedio > 0 AND sc.precio_con_iva > 0 
          THEN ROUND(((sc.precio_con_iva - sc.costo_promedio) / sc.precio_con_iva * 100)::numeric, 2)
          ELSE NULL
        END as margen_porcentaje,
        
          CASE 
          WHEN sc.stock_total_disponible > 0 AND sc.precio_con_iva > 0
          THEN ROUND((sc.stock_total_disponible * sc.precio_con_iva)::numeric, 2)
            ELSE 0 
        END as valor_total_stock_precio_venta,
        
        CASE 
          WHEN sc.stock_total_disponible > 0 AND sc.costo_promedio > 0
          THEN ROUND((sc.stock_total_disponible * sc.costo_promedio)::numeric, 2)
              ELSE 0 
        END as valor_total_stock_costo,
        
        -- Información adicional
        sc.total_sucursales,
        sc.sucursales_con_stock
        
      FROM stock_consolidado sc
      WHERE 1=1
    `;

    // Filtrar stock cero en el SELECT final
    if (hideZeroStock) {
      query += ` AND sc.stock_total_disponible > 0`;
    }

    // Crear query de conteo con la misma estructura consolidada
    let countQuery = `
      WITH stock_actual AS (
        SELECT DISTINCT ON (sh1.sku, sh1.sucursal)
          sh1.sku,
          sh1.sucursal,
          sh1.empresa,
          sh1.producto_servicio,
          sh1.variante,
          sh1.stock_disponible::text::numeric as stock_disponible,
          sh1.costo_unitario::text::numeric as costo_unitario,
          sh1.fecha as fecha_stock
      FROM stock_historico sh1
      WHERE sh1.fecha = (
        SELECT MAX(sh2.fecha) 
        FROM stock_historico sh2 
          WHERE sh2.sku = sh1.sku AND sh2.sucursal = sh1.sucursal
        )
      ),
      precios_bath_white AS (
        SELECT 
          sku,
          precio_sin_iva,
          precio_con_iva,
          fecha_actualizacion,
          nombre_producto,
          descripcion_variante
        FROM lista_precios 
        WHERE activo = TRUE 
        AND empresa = 'COMERCIALIZADORA BATH & WHITE LTDA'
      ),
      stock_consolidado AS (
        SELECT 
          sa.sku,
          SUM(sa.stock_disponible) as stock_total_disponible
        FROM stock_actual sa
        LEFT JOIN precios_bath_white pbw ON sa.sku = pbw.sku
        WHERE 1=1 ${whereFilters}
        GROUP BY sa.sku
      )
      SELECT COUNT(*) as total
      FROM stock_consolidado sc
      WHERE 1=1
    `;

    // Filtrar stock cero en el conteo si está habilitado
    if (hideZeroStock) {
      countQuery += ` AND sc.stock_total_disponible > 0`;
    }

    // Ejecutar conteo
    const countResult = await client.query(countQuery, params);
    const totalRegistros = parseInt(countResult.rows[0]?.total || '0');

    // Crear query para calcular estadísticas totales (sin paginación)
    let statsQuery = `
      WITH stock_actual AS (
        SELECT DISTINCT ON (sh1.sku, sh1.sucursal)
          sh1.sku,
          sh1.sucursal,
          sh1.empresa,
          sh1.producto_servicio,
          sh1.variante,
          sh1.stock_disponible::text::numeric as stock_disponible,
          sh1.costo_unitario::text::numeric as costo_unitario,
          sh1.fecha as fecha_stock
        FROM stock_historico sh1
        WHERE sh1.fecha = (
          SELECT MAX(sh2.fecha) 
          FROM stock_historico sh2 
          WHERE sh2.sku = sh1.sku AND sh2.sucursal = sh1.sucursal
        )
      ),
      precios_bath_white AS (
        SELECT 
          sku,
          precio_sin_iva,
          precio_con_iva,
          fecha_actualizacion,
          nombre_producto,
          descripcion_variante
        FROM lista_precios 
        WHERE activo = TRUE 
        AND empresa = 'COMERCIALIZADORA BATH & WHITE LTDA'
      ),
      stock_consolidado AS (
        SELECT 
          sa.sku,
          SUM(sa.stock_disponible) as stock_total_disponible,
          AVG(sa.costo_unitario) as costo_promedio,
          pbw.precio_con_iva
        FROM stock_actual sa
        LEFT JOIN precios_bath_white pbw ON sa.sku = pbw.sku
        WHERE 1=1 ${whereFilters}
        GROUP BY sa.sku, pbw.precio_con_iva
      )
      SELECT 
        SUM(
          CASE 
            WHEN sc.stock_total_disponible > 0 AND sc.precio_con_iva > 0
            THEN sc.stock_total_disponible * sc.precio_con_iva
            ELSE 0 
          END
        ) as valor_total_venta,
        SUM(
          CASE 
            WHEN sc.stock_total_disponible > 0 AND sc.costo_promedio > 0
            THEN sc.stock_total_disponible * sc.costo_promedio
            ELSE 0 
          END
        ) as valor_total_compra,
        SUM(
          CASE 
            WHEN sc.stock_total_disponible > 0 AND sc.precio_con_iva > 0 AND sc.costo_promedio > 0
            THEN sc.stock_total_disponible * (sc.precio_con_iva - sc.costo_promedio)
            ELSE 0 
          END
        ) as margen_total,
        
        -- Valores solo de productos que tienen AMBOS precio y costo para calcular mg % correcto
        SUM(
          CASE 
            WHEN sc.stock_total_disponible > 0 AND sc.precio_con_iva > 0 AND sc.costo_promedio > 0
            THEN sc.stock_total_disponible * sc.precio_con_iva
            ELSE 0 
          END
        ) as valor_venta_con_costo,
        SUM(
          CASE 
            WHEN sc.stock_total_disponible > 0 AND sc.precio_con_iva > 0 AND sc.costo_promedio > 0
            THEN sc.stock_total_disponible * sc.costo_promedio
            ELSE 0 
          END
        ) as valor_compra_con_precio
      FROM stock_consolidado sc
      WHERE 1=1
    `;

    // Aplicar mismo filtro de stock cero para estadísticas
    if (hideZeroStock) {
      statsQuery += ` AND sc.stock_total_disponible > 0`;
    }

    // Agregar ordenamiento
    let orderBy = 'sc.sku';
    if (sortField) {
      const fieldMap: { [key: string]: string } = {
        'producto_servicio': 'sc.producto_servicio',
        'sku': 'sc.sku',
        'stock_disponible': 'sc.stock_total_disponible',
        'stock_total_consolidado': 'sc.stock_total_disponible',
        'precio_venta': 'sc.precio_con_iva',
        'costo_unitario': 'sc.costo_promedio',
        'margen_unitario': '(sc.precio_con_iva - sc.costo_promedio)',
        'porcentaje_margen': '((sc.precio_con_iva - sc.costo_promedio) / sc.precio_con_iva * 100)',
        'valor_venta_stock': '(sc.stock_total_disponible * sc.precio_con_iva)',
        'valor_total_stock': '(sc.stock_total_disponible * sc.costo_promedio)'
      };
      
      const mappedField = fieldMap[sortField] || 'sc.producto_servicio';
      orderBy = `${mappedField} ${sortDirection.toUpperCase()}, sc.sku`;
    }

    query += ` ORDER BY ${orderBy}`;

    // Agregar paginación
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log('Ejecutando consulta de inventario...');
    const [result, statsResult] = await Promise.all([
      client.query(query, params),
      client.query(statsQuery, params)
    ]);
    
    console.log(`✅ Inventario obtenido: ${result.rows.length} registros de ${totalRegistros} totales`);

    // Procesar resultados consolidados
    const inventario = result.rows.map(row => ({
      sku: row.sku,
      empresa: row.empresa,
      sucursal: row.sucursal, // Será 'CONSOLIDADO'
      producto_servicio: row.producto_servicio,
      variante: row.variante,
      stock_disponible: parseFloat(row.stock_disponible) || 0,
      costo_unitario: parseFloat(row.costo_unitario) || 0,
      precio_venta: parseFloat(row.precio_venta) || 0,
      empresa_precio: row.empresa_precio, // Siempre será 'COMERCIALIZADORA BATH & WHITE LTDA'
      fecha_stock: row.fecha_stock,
      fecha_precio: row.fecha_precio,
      margen_porcentaje: parseFloat(row.margen_porcentaje) || 0,
      valor_total_stock_precio_venta: parseFloat(row.valor_total_stock_precio_venta) || 0,
      valor_total_stock_costo: parseFloat(row.valor_total_stock_costo) || 0,
      
      // Indicadores de calidad de datos
      tiene_precio: !!row.precio_venta,
      precio_actualizado: row.fecha_precio ? new Date(row.fecha_precio) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false, // Último 7 días
      
      // Campos adicionales que espera el frontend
      tipo_producto_servicio: 'Producto', // Valor por defecto
      stock_total_consolidado: parseFloat(row.stock_disponible) || 0,
      margen_unitario: (parseFloat(row.precio_venta) || 0) - (parseFloat(row.costo_unitario) || 0),
      porcentaje_margen: parseFloat(row.margen_porcentaje) || 0,
      valor_venta_stock: parseFloat(row.valor_total_stock_precio_venta) || 0,
      valor_total_stock: parseFloat(row.valor_total_stock_costo) || 0,
      estado_stock: parseFloat(row.stock_disponible) === 0 ? 'Sin Stock' : 
                   parseFloat(row.stock_disponible) <= 5 ? 'Stock Bajo' : 
                   parseFloat(row.stock_disponible) <= 20 ? 'Stock Medio' : 'Stock OK',
      ultima_actualizacion: row.fecha_stock,
      
      // Información adicional del consolidado
      total_sucursales: parseInt(row.total_sucursales) || 0,
      sucursales_con_stock: row.sucursales_con_stock || ''
    }));

    // Obtener totales reales de la consulta de estadísticas
    const statsData = statsResult.rows[0] || {};
    const valorInventarioVenta = parseFloat(statsData.valor_total_venta) || 0;
    const valorInventarioCompra = parseFloat(statsData.valor_total_compra) || 0;
    const margenTotal = parseFloat(statsData.margen_total) || 0;
    
    // Valores solo de productos que tienen AMBOS precio y costo
    const valorVentaConCosto = parseFloat(statsData.valor_venta_con_costo) || 0;
    const valorCompraConPrecio = parseFloat(statsData.valor_compra_con_precio) || 0;
    
    // Calcular margen porcentaje SOLO con productos que tienen precio Y costo
    const margenPorcentaje = valorCompraConPrecio > 0 ? 
      ((valorVentaConCosto - valorCompraConPrecio) / valorCompraConPrecio) * 100 : 0;

    const totalPages = Math.ceil(totalRegistros / limit);

    return NextResponse.json({
      success: true,
      data: {
        inventario: inventario,
        pagination: {
          page: page,
          limit: limit,
          total: totalRegistros,
          totalPages: totalPages
        },
        totales: {
          valorVenta: valorInventarioVenta,
          valorCompra: valorInventarioCompra,
          margen: margenTotal,
          mgPorcentaje: margenPorcentaje
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en inventario completo:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener inventario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
    
  } finally {
    client.release();
  }
} 