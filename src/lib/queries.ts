import { pool } from './database';

export interface VentasMensuales {
  mes: number;
  mes_nombre: string;
  ventas_2024: number | string;
  ventas_2025: number | string;
  diferencia: number | string;
  crecimiento_porcentual: number | string;
}

export interface VentasPorSucursal {
  sucursal: string;
  empresa: string;
  tipo_documento: string;
  plataforma: string;
  total_ventas: number;
  total_documentos: number;
  ticket_promedio: number;
}

export interface TopProductos {
  sku: string;
  producto_servicio: string;
  total_ventas: number;
  total_unidades: number;
  ranking: number;
}

export interface VentasPorPlataforma {
  plataforma: string;
  total_ventas: number;
  total_unidades: number;
  total_documentos: number;
  porcentaje_del_total: number;
  margen_total: number;
  porcentaje_margen: number;
}

export interface MargenPorSucursal {
  sucursal: string;
  empresa: string;
  total_ventas: number;
  margen_total: number;
  porcentaje_margen: number;
}

export interface VentasPorCategoria {
  tipo_producto_servicio: string;
  sku: string;
  producto_servicio: string;
  variante: string;
  total_ventas: number;
  total_unidades: number;
  total_margen: number;
  porcentaje_margen: number;
  total_documentos: number;
  ranking: number;
}

export interface VentasComparativas {
  periodo_actual: number;
  periodo_anterior: number;
  diferencia: number;
  crecimiento_porcentual: number;
  tipo: 'plataforma' | 'categoria' | 'producto';
  nombre: string;
}

export interface TipoDocumento {
  tipo_documento: string;
  total_documentos: number;
}

export interface Plataforma {
  plataforma: string;
  total_documentos: number;
}

export interface Filtros {
  tipoDocumento?: string[];
  empresa?: string[];
  sucursal?: string[];
  plataforma?: string[];
  años?: number[];
  meses?: number[];
  dias?: number[];
  fechaInicio?: string;
  fechaFin?: string;
}

export interface StockPorSucursal {
  sucursal: string;
  empresa: string;
  total_productos: number;
  stock_disponible: number;
  valor_stock: number;
  productos_stock_bajo: number;
  rotacion_promedio: number;
}

export interface StockBajo {
  sku: string;
  producto_servicio: string;
  variante: string;
  sucursal: string;
  stock_disponible: number;
  stock_minimo: number;
  dias_sin_stock: number;
  ventas_ultimos_30_dias: number;
}

export interface RotacionProductos {
  sku: string;
  producto_servicio: string;
  sucursal: string;
  stock_promedio: number;
  ventas_promedio_diarias: number;
  dias_rotacion: number;
  categoria_rotacion: string;
}

export interface ResumenStock {
  total_productos: number;
  valor_total_stock: number;
  productos_stock_bajo: number;
  productos_sin_stock: number;
  rotacion_promedio: number;
}

export interface VentasFiltradas {
  categoria: string;
  total_ventas: number;
  total_documentos: number;
  ticket_promedio: number;
}

export interface ComparacionCostos {
  sku: string;
  producto_servicio: string;
  variante: string;
  costo_stock_bodega: number;
  costo_ventas_bodega: number;
  diferencia: number;
  porcentaje_diferencia: number;
  stock_disponible_bodega: number;
  ventas_ultimos_30_dias: number;
}

// Helper function para convertir PostgreSQL bigints a números
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Helper function para procesar los resultados y convertir números
const processResults = (rows: any[]): any[] => {
  return rows.map(row => {
    const processed = { ...row };
    for (const [key, value] of Object.entries(processed)) {
      // Convertir campos numéricos específicos
      if (key.includes('ventas') || key.includes('total') || key.includes('promedio') || 
          key.includes('margen') || key.includes('diferencia') || key.includes('crecimiento') ||
          key.includes('registros') || key.includes('productos') || key.includes('documentos') ||
          key.includes('porcentaje') || key.includes('sucursales') || key.includes('ranking') ||
          key.includes('unidades') || (key.includes('mes') && key !== 'mes_nombre')) {
        processed[key] = toNumber(value);
      }
    }
    return processed;
  });
};

// Obtener tipos de documentos disponibles
export async function getTiposDocumento(): Promise<TipoDocumento[]> {
  const query = `
    SELECT 
      tipo_documento,
      COUNT(DISTINCT nro_documento) as total_documentos
    FROM ventas 
    WHERE fecha IS NOT NULL 
      AND tipo_documento IS NOT NULL
    GROUP BY tipo_documento
    ORDER BY total_documentos DESC;
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

// Obtener empresas disponibles
export async function getEmpresas(): Promise<string[]> {
  const query = `
    SELECT DISTINCT empresa
    FROM ventas 
    WHERE fecha IS NOT NULL 
      AND empresa IS NOT NULL
    ORDER BY empresa;
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => row.empresa);
}

// Obtener sucursales disponibles
export async function getSucursales(): Promise<{ sucursal: string; empresa: string }[]> {
  const query = `
    SELECT DISTINCT sucursal, empresa
    FROM stock_historico 
    WHERE fecha IS NOT NULL 
      AND sucursal IS NOT NULL
      AND empresa IS NOT NULL
    ORDER BY empresa, sucursal;
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => ({
    sucursal: row.sucursal,
    empresa: row.empresa
  }));
}

// Función helper para construir la cláusula WHERE con filtros múltiples
function buildWhereClause(filtros: Filtros): { whereClause: string; params: any[] } {
  const conditions = ['fecha IS NOT NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filtros.tipoDocumento && filtros.tipoDocumento.length > 0) {
    const placeholders = filtros.tipoDocumento.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`tipo_documento IN (${placeholders})`);
    params.push(...filtros.tipoDocumento);
  }

  if (filtros.empresa && filtros.empresa.length > 0) {
    const placeholders = filtros.empresa.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`empresa IN (${placeholders})`);
    params.push(...filtros.empresa);
  }

  if (filtros.sucursal && filtros.sucursal.length > 0) {
    const placeholders = filtros.sucursal.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`sucursal IN (${placeholders})`);
    params.push(...filtros.sucursal);
  }

  if (filtros.plataforma && filtros.plataforma.length > 0) {
    const placeholders = filtros.plataforma.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`plataforma IN (${placeholders})`);
    params.push(...filtros.plataforma);
  }

  if (filtros.años && filtros.años.length > 0) {
    const placeholders = filtros.años.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`EXTRACT(YEAR FROM fecha) IN (${placeholders})`);
    params.push(...filtros.años);
  }

  if (filtros.meses && filtros.meses.length > 0) {
    const placeholders = filtros.meses.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`EXTRACT(MONTH FROM fecha) IN (${placeholders})`);
    params.push(...filtros.meses);
  }

  if (filtros.dias && filtros.dias.length > 0) {
    const placeholders = filtros.dias.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`EXTRACT(DAY FROM fecha) IN (${placeholders})`);
    params.push(...filtros.dias);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

// Ventas mensuales comparativas (2024 vs 2025) con filtros
export async function getVentasMensuales(filtros: Filtros = {}, viewMode: 'mensual' | 'diaria' | 'anual' = 'mensual'): Promise<any[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  // Agregar filtros de fecha si existen
  let fechaWhereClause = '';
  if (filtros.fechaInicio || filtros.fechaFin) {
    fechaWhereClause = ' AND ';
    if (filtros.fechaInicio) {
      fechaWhereClause += `fecha >= '${filtros.fechaInicio}'`;
    }
    if (filtros.fechaInicio && filtros.fechaFin) {
      fechaWhereClause += ' AND ';
    }
    if (filtros.fechaFin) {
      fechaWhereClause += `fecha <= '${filtros.fechaFin}'`;
    }
  }

  let groupBy = '';
  let select = '';
  let orderBy = '';
  let label = '';
  if (viewMode === 'diaria') {
    select = `EXTRACT(DAY FROM fecha) as dia, TO_CHAR(fecha, 'DD') as dia_nombre`;
    groupBy = 'EXTRACT(DAY FROM fecha), TO_CHAR(fecha, \'DD\')';
    orderBy = 'EXTRACT(DAY FROM fecha)';
    label = 'dia';
  } else if (viewMode === 'anual') {
    select = `EXTRACT(YEAR FROM fecha) as año, TO_CHAR(fecha, 'YYYY') as año_nombre`;
    groupBy = 'EXTRACT(YEAR FROM fecha), TO_CHAR(fecha, \'YYYY\')';
    orderBy = 'EXTRACT(YEAR FROM fecha)';
    label = 'año';
  } else {
    select = `EXTRACT(MONTH FROM fecha) as mes, CASE EXTRACT(MONTH FROM fecha)
      WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo' WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio' WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre' WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre' END as mes_nombre`;
    groupBy = 'EXTRACT(MONTH FROM fecha)';
    orderBy = 'EXTRACT(MONTH FROM fecha)';
    label = 'mes';
  }

  const query = `
    SELECT 
      ${select},
      COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END), 0) as ventas_2024,
      COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN subtotal_neto ELSE 0 END), 0) as ventas_2025,
      COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN subtotal_neto ELSE 0 END), 0) - 
      COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END), 0) as diferencia,
      CASE 
        WHEN SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END) > 0 THEN
          ROUND(((SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN subtotal_neto ELSE 0 END) - 
                  SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END)) / 
                 SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END)) * 100, 2)
        ELSE 0 
      END as crecimiento_porcentual
    FROM ventas 
    ${whereClause}${fechaWhereClause}
    GROUP BY ${groupBy}
    HAVING SUM(subtotal_neto) > 0
    ORDER BY ${orderBy};
  `;
  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Ventas por sucursal con filtros
export async function getVentasPorSucursal(filtros: Filtros = {}): Promise<any[]> {
  const { whereClause, params } = buildWhereClause(filtros);

  // Si no hay filtro de meses ni días, limitar hasta el último día registrado de ventas del año más reciente
  let extraWhere = '';
  if ((!filtros.meses || filtros.meses.length === 0) && (!filtros.dias || filtros.dias.length === 0) && filtros.años && filtros.años.length > 1) {
    // Buscar el año más reciente
    const yearActual = Math.max(...filtros.años);
    const yearAnterior = Math.min(...filtros.años);
    // Obtener el último día con ventas del año más reciente
    const lastDayQuery = `SELECT MAX(fecha) as last_day FROM ventas WHERE EXTRACT(YEAR FROM fecha) = $1`;
    const lastDayResult = await pool.query(lastDayQuery, [yearActual]);
    const lastDay = lastDayResult.rows[0]?.last_day;
    const lastDayISO = lastDay ? new Date(lastDay).toISOString().slice(0, 10) : null;
    if (lastDayISO) {
      // Limitar ambas series hasta ese día (mismo mes y día para ambos años)
      extraWhere = `AND ( (EXTRACT(YEAR FROM fecha) = $${params.length + 1} AND fecha <= '${lastDayISO}') OR (EXTRACT(YEAR FROM fecha) = $${params.length + 2} AND fecha <= (DATE_TRUNC('year', fecha) + (DATE_PART('doy', DATE '${lastDayISO}') - 1) * INTERVAL '1 day')) )`;
      // Agregar los años a los parámetros para que coincidan con los placeholders
      params.push(yearActual, yearAnterior);
    }
  }

  const query = `
    SELECT 
      sucursal,
      EXTRACT(YEAR FROM fecha) as año,
      ROUND(SUM(subtotal_neto))::numeric as ventas,
      COUNT(DISTINCT nro_documento)::numeric as documentos,
      CASE 
        WHEN COUNT(DISTINCT nro_documento) > 0 
        THEN ROUND(SUM(subtotal_neto) / COUNT(DISTINCT nro_documento))::numeric
        ELSE 0 
      END as ticket_promedio
    FROM ventas 
    ${whereClause}
    ${extraWhere}
    GROUP BY sucursal, EXTRACT(YEAR FROM fecha)
    ORDER BY sucursal, año DESC;
  `;

  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Top productos con filtros
export async function getTopProductos(limit: number = 10, filtros: Filtros = {}): Promise<TopProductos[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  // Agregamos el parámetro limit al final
  const limitParam = params.length + 1;
  params.push(limit);
  
  const query = `
    SELECT 
      sku,
      producto_servicio,
      ROUND(SUM(subtotal_neto))::numeric as total_ventas,
      SUM(cantidad)::numeric as total_unidades,
      ROW_NUMBER() OVER (ORDER BY SUM(subtotal_neto) DESC) as ranking
    FROM ventas 
    ${whereClause}
      ${whereClause.includes('WHERE') ? 'AND' : 'WHERE'} sku IS NOT NULL
      AND producto_servicio IS NOT NULL
    GROUP BY sku, producto_servicio
    ORDER BY total_ventas DESC
    LIMIT $${limitParam};
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Resumen general con filtros
export async function getResumenGeneral(filtros: Filtros = {}) {
  const { whereClause, params } = buildWhereClause(filtros);
  
  const query = `
    SELECT 
      COUNT(*)::numeric as total_registros,
      COUNT(DISTINCT nro_documento)::numeric as total_documentos,
      COUNT(DISTINCT sku)::numeric as productos_diferentes,
      COUNT(DISTINCT sucursal)::numeric as sucursales_activas,
      ROUND(SUM(subtotal_neto))::numeric as ventas_totales,
      
      -- Información sobre registros con y sin costo
      COUNT(CASE WHEN margen_neto IS NOT NULL THEN 1 END)::numeric as registros_con_margen,
      COUNT(CASE WHEN margen_neto IS NULL THEN 1 END)::numeric as registros_sin_margen,
      
      -- Ventas solo de registros con costo registrado
      ROUND(SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END))::numeric as ventas_con_costo,
      ROUND(SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END))::numeric as margen_total,
      
      -- Porcentaje de margen calculado SOLO con ventas que tienen costo registrado
      CASE 
        WHEN SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END) > 0 
        THEN ROUND((SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END)::numeric / 
                    SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END)::numeric) * 100, 2)
        ELSE 0 
      END as porcentaje_margen_promedio,
      
      -- Porcentaje de registros sin información de costo
      ROUND((COUNT(CASE WHEN margen_neto IS NULL THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) as porcentaje_sin_margen
      
    FROM ventas 
    ${whereClause};
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows)[0];
}

// Ventas por plataforma con filtros
export async function getVentasPorPlataforma(filtros: Filtros = {}): Promise<VentasPorPlataforma[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  const query = `
    WITH ventas_totales AS (
      SELECT SUM(subtotal_neto) as total_general
      FROM ventas 
      ${whereClause}
    )
    SELECT 
      COALESCE(plataforma, 'Sin Especificar') as plataforma,
      ROUND(SUM(subtotal_neto))::numeric as total_ventas,
      SUM(cantidad)::numeric as total_unidades,
      COUNT(DISTINCT nro_documento)::numeric as total_documentos,
      ROUND((SUM(subtotal_neto) / vt.total_general) * 100, 2) as porcentaje_del_total,
      ROUND(SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END))::numeric as margen_total,
      CASE 
        WHEN SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END) > 0 
        THEN ROUND((SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END) / 
                    SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END)) * 100, 2)
        ELSE 0 
      END as porcentaje_margen
    FROM ventas 
    CROSS JOIN ventas_totales vt
    ${whereClause}
    GROUP BY COALESCE(plataforma, 'Sin Especificar'), vt.total_general
    ORDER BY total_ventas DESC;
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Margen por sucursal con filtros
export async function getMargenPorSucursal(filtros: Filtros = {}): Promise<MargenPorSucursal[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  const query = `
    SELECT 
      sucursal,
      empresa,
      ROUND(SUM(subtotal_neto))::numeric as total_ventas,
      ROUND(SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END))::numeric as margen_total,
      CASE 
        WHEN SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END) > 0 
        THEN ROUND((SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END) / 
                    SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END)) * 100, 2)
        ELSE 0 
      END as porcentaje_margen
    FROM ventas 
    ${whereClause}
    GROUP BY sucursal, empresa
    ORDER BY margen_total DESC;
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Ventas por categoría/productos con filtros
export async function getVentasPorCategoria(limit: number = 20, filtros: Filtros = {}): Promise<VentasPorCategoria[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  // Agregamos el parámetro limit al final
  const limitParam = params.length + 1;
  params.push(limit);
  
  const query = `
    SELECT 
      COALESCE(tipo_producto_servicio, 'Sin Categoría') as tipo_producto_servicio,
      sku,
      producto_servicio,
      COALESCE(variante, 'Sin Variante') as variante,
      ROUND(SUM(subtotal_neto))::numeric as total_ventas,
      SUM(cantidad)::numeric as total_unidades,
      ROUND(SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END))::numeric as total_margen,
      CASE 
        WHEN SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END) > 0 
        THEN ROUND((SUM(CASE WHEN margen_neto IS NOT NULL THEN margen_neto ELSE 0 END) / 
                    SUM(CASE WHEN margen_neto IS NOT NULL THEN subtotal_neto ELSE 0 END)) * 100, 2)
        ELSE 0 
      END as porcentaje_margen,
      COUNT(DISTINCT nro_documento)::numeric as total_documentos,
      ROW_NUMBER() OVER (ORDER BY SUM(subtotal_neto) DESC) as ranking
    FROM ventas 
    ${whereClause}
      ${whereClause.includes('WHERE') ? 'AND' : 'WHERE'} sku IS NOT NULL
      AND producto_servicio IS NOT NULL
    GROUP BY tipo_producto_servicio, sku, producto_servicio, variante
    ORDER BY total_ventas DESC
    LIMIT $${limitParam};
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Obtener plataformas disponibles
export async function getPlataformas(): Promise<string[]> {
  const query = `
    SELECT DISTINCT COALESCE(plataforma, 'Sin Especificar') as plataforma
    FROM ventas 
    WHERE fecha IS NOT NULL
    ORDER BY plataforma;
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => row.plataforma);
}

// Obtener categorías disponibles
export async function getCategorias(): Promise<string[]> {
  const query = `
    SELECT DISTINCT COALESCE(tipo_producto_servicio, 'Sin Categoría') as tipo_producto_servicio
    FROM ventas 
    WHERE fecha IS NOT NULL
    ORDER BY tipo_producto_servicio;
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => row.tipo_producto_servicio);
}

// Márgenes comparativos por sucursal (2024 vs 2025)
export interface MargenSucursalComparativo {
  sucursal: string;
  empresa: string;
  margen_2024: number;
  margen_2025: number;
  variacion_porcentual: number;
}

export async function getMargenPorSucursalComparativo(filtros: Filtros = {}): Promise<MargenSucursalComparativo[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  const query = `
    SELECT 
      sucursal,
      empresa,
      -- % margen 2024
      CASE WHEN SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END) > 0
        THEN ROUND((SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN margen_neto ELSE 0 END) / SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN subtotal_neto ELSE 0 END)) * 100, 2)
        ELSE 0 END as margen_2024,
      -- % margen 2025
      CASE WHEN SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN subtotal_neto ELSE 0 END) > 0
        THEN ROUND((SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN margen_neto ELSE 0 END) / SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN subtotal_neto ELSE 0 END)) * 100, 2)
        ELSE 0 END as margen_2025
    FROM ventas
    ${whereClause}
    GROUP BY sucursal, empresa
    ORDER BY sucursal, empresa;
  `;
  const result = await pool.query(query, params);
  // Calcular variación en JS
  return result.rows.map((row: any) => ({
    sucursal: row.sucursal,
    empresa: row.empresa,
    margen_2024: toNumber(row.margen_2024),
    margen_2025: toNumber(row.margen_2025),
    variacion_porcentual: toNumber(row.margen_2025) - toNumber(row.margen_2024)
  }));
}

// Stock por sucursal
export async function getStockPorSucursal(filtros: Filtros = {}): Promise<StockPorSucursal[]> {
  const query = `
    WITH stock_actual AS (
      SELECT DISTINCT ON (sucursal, sku) 
        sucursal, empresa, sku, producto_servicio, stock_disponible, valor_total_stock
      FROM stock_historico 
      ORDER BY sucursal, sku, fecha DESC
    ),
    ventas_recientes AS (
      SELECT 
        sucursal, sku,
        COALESCE(SUM(cantidad), 0) as ventas_30_dias
      FROM ventas 
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sucursal, sku
    )
    SELECT 
      s.sucursal,
      s.empresa,
      COUNT(s.sku)::numeric as total_productos,
      ROUND(SUM(s.stock_disponible))::numeric as stock_disponible,
      ROUND(SUM(s.valor_total_stock))::numeric as valor_stock,
      COUNT(CASE WHEN s.stock_disponible <= 5 THEN 1 END)::numeric as productos_stock_bajo,
      CASE 
        WHEN AVG(CASE WHEN v.ventas_30_dias > 0 THEN s.stock_disponible / (v.ventas_30_dias / 30.0) END) IS NOT NULL
        THEN ROUND(AVG(CASE WHEN v.ventas_30_dias > 0 THEN s.stock_disponible / (v.ventas_30_dias / 30.0) END), 1)
        ELSE 0 
      END as rotacion_promedio
    FROM stock_actual s
    LEFT JOIN ventas_recientes v ON s.sucursal = v.sucursal AND s.sku = v.sku
    GROUP BY s.sucursal, s.empresa
    ORDER BY valor_stock DESC;
  `;
  
  const result = await pool.query(query);
  return processResults(result.rows);
}

// Productos con stock bajo
export async function getStockBajo(limite: number = 20): Promise<StockBajo[]> {
  const query = `
    WITH stock_actual AS (
      SELECT DISTINCT ON (sucursal, sku) 
        sucursal, sku, producto_servicio, variante, stock_disponible
      FROM stock_historico 
      ORDER BY sucursal, sku, fecha DESC
    ),
    ventas_recientes AS (
      SELECT 
        sucursal, sku,
        COALESCE(SUM(cantidad), 0) as ventas_30_dias
      FROM ventas 
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sucursal, sku
    )
    SELECT 
      s.sku,
      s.producto_servicio,
      s.variante,
      s.sucursal,
      s.stock_disponible::numeric,
      5::numeric as stock_minimo,
      CASE 
        WHEN s.stock_disponible <= 0 THEN 999
        WHEN v.ventas_30_dias > 0 THEN ROUND(s.stock_disponible / (v.ventas_30_dias / 30.0))
        ELSE 0 
      END::numeric as dias_sin_stock,
      COALESCE(v.ventas_30_dias, 0)::numeric as ventas_ultimos_30_dias
    FROM stock_actual s
    LEFT JOIN ventas_recientes v ON s.sucursal = v.sucursal AND s.sku = v.sku
    WHERE s.stock_disponible <= 10
    ORDER BY s.stock_disponible ASC, v.ventas_30_dias DESC
    LIMIT $1;
  `;
  
  const result = await pool.query(query, [limite]);
  return processResults(result.rows);
}

// Análisis de rotación de productos
export async function getRotacionProductos(limite: number = 20): Promise<RotacionProductos[]> {
  const query = `
    WITH stock_actual AS (
      SELECT DISTINCT ON (sucursal, sku) 
        sucursal, sku, producto_servicio, stock_disponible
      FROM stock_historico 
      ORDER BY sucursal, sku, fecha DESC
    ),
    ventas_recientes AS (
      SELECT 
        sucursal, sku,
        COALESCE(SUM(cantidad), 0) as ventas_30_dias,
        COALESCE(SUM(cantidad) / 30.0, 0) as ventas_diarias_promedio
      FROM ventas 
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sucursal, sku
    )
    SELECT 
      s.sku,
      s.producto_servicio,
      s.sucursal,
      s.stock_disponible::numeric as stock_promedio,
      ROUND(v.ventas_diarias_promedio, 2)::numeric as ventas_promedio_diarias,
      CASE 
        WHEN v.ventas_diarias_promedio > 0 
        THEN ROUND(s.stock_disponible / v.ventas_diarias_promedio, 1)
        ELSE 999 
      END::numeric as dias_rotacion,
      CASE 
        WHEN v.ventas_diarias_promedio = 0 THEN 'Sin Ventas'
        WHEN s.stock_disponible / NULLIF(v.ventas_diarias_promedio, 0) <= 7 THEN 'Rápida'
        WHEN s.stock_disponible / NULLIF(v.ventas_diarias_promedio, 0) <= 30 THEN 'Normal'
        WHEN s.stock_disponible / NULLIF(v.ventas_diarias_promedio, 0) <= 90 THEN 'Lenta'
        ELSE 'Muy Lenta'
      END as categoria_rotacion
    FROM stock_actual s
    LEFT JOIN ventas_recientes v ON s.sucursal = v.sucursal AND s.sku = v.sku
    WHERE s.stock_disponible > 0
    ORDER BY dias_rotacion ASC
    LIMIT $1;
  `;
  
  const result = await pool.query(query, [limite]);
  return processResults(result.rows);
}

// Resumen general de stock
export async function getResumenStock(): Promise<ResumenStock> {
  const query = `
    WITH stock_actual AS (
      SELECT DISTINCT ON (sucursal, sku) 
        sucursal, sku, stock_disponible, valor_total_stock
      FROM stock_historico 
      ORDER BY sucursal, sku, fecha DESC
    ),
    ventas_recientes AS (
      SELECT 
        sucursal, sku,
        COALESCE(SUM(cantidad) / 30.0, 0) as ventas_diarias_promedio
      FROM ventas 
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sucursal, sku
    )
    SELECT 
      COUNT(*)::numeric as total_productos,
      ROUND(SUM(valor_total_stock))::numeric as valor_total_stock,
      COUNT(CASE WHEN stock_disponible <= 5 THEN 1 END)::numeric as productos_stock_bajo,
      COUNT(CASE WHEN stock_disponible <= 0 THEN 1 END)::numeric as productos_sin_stock,
      ROUND(AVG(CASE 
        WHEN v.ventas_diarias_promedio > 0 
        THEN s.stock_disponible / v.ventas_diarias_promedio 
        ELSE NULL 
      END), 1)::numeric as rotacion_promedio
    FROM stock_actual s
    LEFT JOIN ventas_recientes v ON s.sucursal = v.sucursal AND s.sku = v.sku;
  `;
  
  const result = await pool.query(query);
  return processResults(result.rows)[0];
}

// Ventas filtradas
export async function getVentasFiltradas(filtros: Filtros = {}): Promise<VentasFiltradas[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  const query = `
    SELECT 
      COALESCE(tipo_producto_servicio, 'Sin Categoría') as categoria,
      ROUND(SUM(subtotal_neto))::numeric as total_ventas,
      COUNT(DISTINCT nro_documento)::numeric as total_documentos,
      CASE 
        WHEN COUNT(DISTINCT nro_documento) > 0 
        THEN ROUND(SUM(subtotal_neto) / COUNT(DISTINCT nro_documento))::numeric
        ELSE 0 
      END as ticket_promedio
    FROM ventas 
    ${whereClause}
    GROUP BY COALESCE(tipo_producto_servicio, 'Sin Categoría')
    ORDER BY total_ventas DESC;
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows);
} 

// Comparación de costos entre stock de bodega y ventas de bodega
export async function getComparacionCostos(limite: number = 50): Promise<ComparacionCostos[]> {
  const query = `
    WITH stock_bodega AS (
      SELECT DISTINCT ON (sku) 
        sku, producto_servicio, variante, costo_unitario, stock_disponible
      FROM stock_historico 
      WHERE sucursal ILIKE '%bodega%'
      ORDER BY sku, fecha DESC
    ),
    ventas_bodega AS (
      SELECT 
        sku,
        AVG(costo_neto / NULLIF(cantidad, 0)) as costo_promedio_ventas,
        SUM(cantidad) as ventas_ultimos_30_dias
      FROM ventas 
      WHERE sucursal ILIKE '%bodega%'
        AND fecha >= CURRENT_DATE - INTERVAL '30 days'
        AND costo_neto IS NOT NULL
        AND cantidad > 0
      GROUP BY sku
    )
    SELECT 
      s.sku,
      s.producto_servicio,
      COALESCE(s.variante, 'Sin Variante') as variante,
      COALESCE(s.costo_unitario, 0)::numeric as costo_stock_bodega,
      COALESCE(v.costo_promedio_ventas, 0)::numeric as costo_ventas_bodega,
      COALESCE(v.costo_promedio_ventas, 0) - COALESCE(s.costo_unitario, 0) as diferencia,
      CASE 
        WHEN COALESCE(s.costo_unitario, 0) > 0 
        THEN ROUND(((COALESCE(v.costo_promedio_ventas, 0) - COALESCE(s.costo_unitario, 0)) / COALESCE(s.costo_unitario, 0)) * 100, 2)
        ELSE 0 
      END as porcentaje_diferencia,
      COALESCE(s.stock_disponible, 0)::numeric as stock_disponible_bodega,
      COALESCE(v.ventas_ultimos_30_dias, 0)::numeric as ventas_ultimos_30_dias
    FROM stock_bodega s
    LEFT JOIN ventas_bodega v ON s.sku = v.sku
    WHERE s.costo_unitario IS NOT NULL 
      AND s.costo_unitario > 0
    ORDER BY ABS(COALESCE(v.costo_promedio_ventas, 0) - COALESCE(s.costo_unitario, 0)) DESC
    LIMIT $1;
  `;
  
  const result = await pool.query(query, [limite]);
  return processResults(result.rows);
} 