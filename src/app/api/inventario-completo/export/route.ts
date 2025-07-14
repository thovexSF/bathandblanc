import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalesParam = searchParams.get('sucursales');
    const hideZeroStock = searchParams.get('hideZeroStock') === 'true';
    let fechaParam = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    
    // Validar y normalizar el formato de fecha
    try {
      const fecha = new Date(fechaParam + 'T00:00:00');
      if (isNaN(fecha.getTime())) {
        fechaParam = new Date().toISOString().split('T')[0];
      }
    } catch (error) {
      fechaParam = new Date().toISOString().split('T')[0];
    }

    // Construir condición de sucursales y parámetros
    let sucursalCondition = '';
    let queryParams: any[] = [];
    
    if (sucursalesParam) {
      const sucursalesArray = sucursalesParam.split(',').map(s => s.trim()).filter(Boolean);
      if (sucursalesArray.length > 0) {
        const placeholders = sucursalesArray.map((_, i) => `$${i + 1}`).join(', ');
        sucursalCondition = `AND sh1.sucursal IN (${placeholders})`;
        queryParams = [...sucursalesArray];
      }
    }

    // Pre-calcular índices de parámetros para consistencia
    const fechaParamIndex = queryParams.length + 1;
    
    // Agregar fecha a parámetros
    queryParams.push(fechaParam);

    // Construir filtros para las consultas (misma lógica que endpoint principal)
    let whereFilters = '';
    let paramIndex = 1;

    // Filtrar por sucursales específicas
    if (sucursalesParam) {
      const sucursalesArray = sucursalesParam.split(',').map(s => s.trim()).filter(Boolean);
      if (sucursalesArray.length > 0) {
        whereFilters += ` AND sa.sucursal = ANY($${paramIndex})`;
        queryParams = [sucursalesArray];
        paramIndex++;
      }
    }

    // Query usando la misma lógica que el endpoint principal
    const query = `
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
          
          -- Campos adicionales que espera el frontend
          'Producto' as tipo_producto_servicio,
          sc.stock_total_disponible as stock_total_consolidado,
          (sc.precio_con_iva - sc.costo_promedio) as margen_unitario,
          sc.precio_con_iva as valor_venta_stock,
          sc.costo_promedio as valor_total_stock,
          CASE 
            WHEN sc.stock_total_disponible = 0 THEN 'Sin Stock'
            WHEN sc.stock_total_disponible <= 5 THEN 'Stock Bajo' 
            WHEN sc.stock_total_disponible <= 20 THEN 'Stock Medio'
          ELSE 'Stock OK'
        END as estado_stock,
          
          -- Información adicional del consolidado
          sc.total_sucursales,
          sc.sucursales_con_stock
          
        FROM stock_consolidado sc
        WHERE 1=1
        ${hideZeroStock ? ' AND sc.stock_total_disponible > 0' : ''}
        ORDER BY sc.producto_servicio ASC
    `;

    console.log('EXPORTANDO INVENTARIO CONSOLIDADO - SUCURSALES:', sucursalesParam);
    console.log('EXPORTANDO INVENTARIO CONSOLIDADO - HIDE ZERO STOCK:', hideZeroStock);
    console.log('EXPORTANDO INVENTARIO CONSOLIDADO - QUERY PARAMS:', queryParams);

    // Ejecutar query
    const result = await pool.query(query, queryParams);
    const inventario = result.rows;

    if (inventario.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para exportar' },
        { status: 404 }
      );
    }

    // Formatear datos para Excel
    const excelData = inventario.map(item => ({
      'Tipo de Producto': item.tipo_producto_servicio || 'Sin tipo',
      'Producto': item.producto_servicio || 'Sin nombre',
      'Variante': item.variante || 'Sin variante',
      'SKU': item.sku || 'Sin SKU',
      'Stock': Number(item.stock_disponible) || 0,
      'Total Global': Number(item.stock_total_consolidado) || 0,
      'Precio Unit. (Inc. IVA)': Number(item.precio_venta) || 0,
      'Costo Unit.': Number(item.costo_unitario) || 0,
      'Margen Unit.': Number(item.margen_unitario) || 0,
      '% Margen': Number(item.margen_porcentaje) || 0,
      'Valor Venta (Inc. IVA)': Number(item.valor_total_stock_precio_venta) || 0,
      'Valor Costo': Number(item.valor_total_stock_costo) || 0,
      'Estado': item.estado_stock || 'Sin estado',
      'Última Actualización': item.fecha_stock ? new Date(item.fecha_stock).toLocaleDateString('es-ES') : 'Sin fecha',
      'Sucursales': item.total_sucursales || 0,
      'Sucursales con Stock': item.sucursales_con_stock || 'N/A'
    }));

    // Calcular totales para agregar al final
    const totales = inventario.reduce((acc, item) => {
      acc.margenTotal += (Number(item.margen_unitario) * Number(item.stock_disponible)) || 0;
      acc.valorVenta += Number(item.valor_total_stock_precio_venta) || 0;
      acc.valorCosto += Number(item.valor_total_stock_costo) || 0;
      return acc;
    }, { margenTotal: 0, valorVenta: 0, valorCosto: 0 });

    // Agregar fila de totales
    excelData.push({
      'Tipo de Producto': '',
      'Producto': '',
      'Variante': '',
      'SKU': 'TOTALES',
      'Stock': 0 as any,
      'Total Global': 0 as any,
      'Precio Unit. (Inc. IVA)': 0 as any,
      'Costo Unit.': 0 as any,
      'Margen Unit.': totales.margenTotal,
      '% Margen': 0 as any,
      'Valor Venta (Inc. IVA)': totales.valorVenta,
      'Valor Costo': totales.valorCosto,
      'Estado': '',
      'Última Actualización': '',
      'Sucursales': 0 as any,
      'Sucursales con Stock': ''
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Configurar el ancho de las columnas
    const colWidths = [
      { wch: 15 }, // Tipo de Producto
      { wch: 30 }, // Producto
      { wch: 20 }, // Variante
      { wch: 15 }, // SKU
      { wch: 10 }, // Stock
      { wch: 12 }, // Total Global
      { wch: 18 }, // Precio Unit.
      { wch: 15 }, // Costo Unit.
      { wch: 15 }, // Margen Unit.
      { wch: 10 }, // % Margen
      { wch: 18 }, // Valor Venta
      { wch: 15 }, // Valor Costo
      { wch: 12 }, // Estado
      { wch: 18 }, // Última Actualización
      { wch: 10 }, // Sucursales
      { wch: 25 }  // Sucursales con Stock
    ];
    ws['!cols'] = colWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Crear nombre del archivo con fecha
    const fechaFormat = new Date(fechaParam).toLocaleDateString('es-ES').replace(/\//g, '-');
    const sucursalesText = sucursalesParam ? sucursalesParam.replace(/,/g, '_') : 'todas';
    const filename = `inventario_${fechaFormat}_${sucursalesText}.xlsx`;

    // Retornar el archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exportando inventario:', error);
    return NextResponse.json(
      { success: false, error: 'Error exportando inventario' },
      { status: 500 }
    );
  }
} 