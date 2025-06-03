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

export interface TipoDocumento {
  tipo_documento: string;
  total_documentos: number;
}

export interface Filtros {
  tipoDocumento?: string[];
  empresa?: string[];
  sucursal?: string[];
  años?: number[];
  meses?: number[];
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
export async function getSucursales(): Promise<string[]> {
  const query = `
    SELECT DISTINCT sucursal
    FROM ventas 
    WHERE fecha IS NOT NULL 
      AND sucursal IS NOT NULL
    ORDER BY sucursal;
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => row.sucursal);
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

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

// Ventas mensuales comparativas (2024 vs 2025) con filtros
export async function getVentasMensuales(filtros: Filtros = {}): Promise<VentasMensuales[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  const query = `
    SELECT 
      EXTRACT(MONTH FROM fecha) as mes,
      CASE EXTRACT(MONTH FROM fecha)
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN 'Febrero'
        WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
      END as mes_nombre,
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
    ${whereClause}
    GROUP BY EXTRACT(MONTH FROM fecha)
    HAVING SUM(subtotal_neto) > 0
    ORDER BY EXTRACT(MONTH FROM fecha);
  `;
  
  const result = await pool.query(query, params);
  return processResults(result.rows);
}

// Ventas por sucursal con filtros
export async function getVentasPorSucursal(filtros: Filtros = {}): Promise<VentasPorSucursal[]> {
  const { whereClause, params } = buildWhereClause(filtros);
  
  const query = `
    SELECT 
      sucursal,
      empresa,
      ROUND(SUM(subtotal_neto))::numeric as total_ventas,
      COUNT(DISTINCT nro_documento)::numeric as total_documentos,
      CASE 
        WHEN COUNT(DISTINCT nro_documento) > 0 
        THEN ROUND(SUM(subtotal_neto) / COUNT(DISTINCT nro_documento))::numeric
        ELSE 0 
      END as ticket_promedio
    FROM ventas 
    ${whereClause}
    GROUP BY sucursal, empresa
    ORDER BY total_ventas DESC;
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