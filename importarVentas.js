// Lista de empresas y sus tokens
const EMPRESAS = [
  { nombre: 'COMERCIALIZADORA BATH & WHITE LTDA', token: 'b25d458dcb5d2e56623ae21e82ee49702d48aea5' }, // TIENDA LA LAGUNA y TIENDA CHICUREO
  { nombre: 'EMILIA FT SPA', token: 'f34c17a90239b939453eca3b2f64130a78a681e1' }, // TIENDA MUT
  { nombre: 'MARÍA IGNACIA TURULL Y CIA LTDA', token: '5acd859fe88c533d9d57eb3d2457fda867e6838a' },
  { nombre: 'MARIA JOSE TURULL SPA', token: 'd88f1995256144b945ed2f9e54708ba4f55c3e3e' },
  { nombre: 'TURULL GUZMAN MARIA JOSE Y OTRA', token: 'ca17eaaecb20c1693890cfc538bdd36fcf54babe' }, // TIENDA EL RODEO
];

const BSALE_API_URL = 'https://api.bsale.io/v1/documents.json';
const { Pool } = require('pg');
const fetch = require('node-fetch');

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Crear tabla si no existe
async function crearTablaVentas() {
  const client = await pool.connect();
  try {
    // Creamos la tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        id_bsale INTEGER,
        id_detalle INTEGER,
        empresa VARCHAR(100),
        sucursal VARCHAR(100),
        fecha TIMESTAMP WITH TIME ZONE,
        sku VARCHAR(100),
        producto_servicio VARCHAR(255),
        tipo_producto_servicio VARCHAR(100),
        variante VARCHAR(255),
        descripcion_completa TEXT,
        subtotal_bruto NUMERIC,
        subtotal_neto NUMERIC,
        margen_neto NUMERIC,
        costo_neto NUMERIC,
        impuestos NUMERIC,
        cantidad NUMERIC,
        vendedor VARCHAR(100),
        plataforma VARCHAR(100),
        tipo_documento VARCHAR(100),
        nro_documento VARCHAR(50),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_detalle, sucursal)
      );
    `);
    console.log('Tabla ventas verificada/creada');
  } catch (err) {
    console.error('Error creando tabla:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function guardarVentasEnDB(datos) {
  console.log(`\nIntentando guardar ${datos.length} filas en la base de datos...`);
  const client = await pool.connect();
  try {
    console.log('Iniciando transacción...');
    await client.query('BEGIN');
    
    let filasInsertadas = 0;
    let filasDuplicadas = 0;
    for (const venta of datos) {
      try {
        await client.query(`
          INSERT INTO ventas (
              id_bsale, id_detalle, empresa, sucursal, fecha, sku, producto_servicio, tipo_producto_servicio,
              variante, descripcion_completa, subtotal_bruto, subtotal_neto,
              margen_neto, costo_neto, impuestos, cantidad,
              vendedor, plataforma, tipo_documento, nro_documento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id_detalle, sucursal) DO NOTHING
        `, venta);
        filasInsertadas++;
        if (filasInsertadas % 1000 === 0) {
          console.log(`Insertadas ${filasInsertadas} filas...`);
        }
      } catch (err) {
        if (err.code === '23505') { // Código de error para violación de restricción única
          filasDuplicadas++;
          continue;
        }
        console.error('Error insertando fila:', err);
        console.error('Datos de la fila:', venta);
        throw err;
      }
    }
    
    console.log('Confirmando transacción...');
    await client.query('COMMIT');
    console.log(`${filasInsertadas} ventas guardadas exitosamente en la base de datos`);
    if (filasDuplicadas > 0) {
      console.log(`${filasDuplicadas} filas duplicadas fueron ignoradas`);
    }
  } catch (err) {
    console.error('Error en la transacción:', err);
    console.log('Intentando hacer rollback...');
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function obtenerFechasAyerUnix() {
  const ahora = new Date();
  // Día anterior en UTC
  const ayer = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() - 1));
  // Inicio del día (00:00:00)
  const inicio = Math.floor(ayer.getTime() / 1000);
  // Fin del día (23:59:59)
  const fin = inicio + 86399; // 24*60*60 - 1
  return { fechaInicio: inicio, fechaFin: fin };
}

async function obtenerVentasBsaleEmpresaDia(token, fechaInicio, fechaFin, nombreEmpresa, startOffset = 0) {
  // Formateamos las fechas para el log en formato chileno
  const formatearFecha = (timestamp) => {
    const fecha = new Date(timestamp * 1000);
    // Si es la fecha fin (20:59:59 UTC), forzamos mostrar 23:59:59
    if (fecha.getUTCHours() === 20 && fecha.getUTCMinutes() === 59 && fecha.getUTCSeconds() === 59) {
      return `${fecha.getUTCDate().toString().padStart(2, '0')}-${(fecha.getUTCMonth() + 1).toString().padStart(2, '0')}-${fecha.getUTCFullYear()} 23:59:59`;
    }
    return fecha.toLocaleString('es-CL', { 
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  console.log(`Consultando ventas para fechas: ${formatearFecha(fechaInicio)} a ${formatearFecha(fechaFin)}`);
  const options = {
    method: 'get',
    headers: {
      'access_token': token
    }
  };

  let offset = startOffset;
  let hasMore = true;
  const limit = 50; // Registros por página
  let totalCount = 0;
  let totalProcesados = 0;
  let totalDocumentos = 0;

  const expandParam = encodeURIComponent('details,office,payments,sellers,document_types');
  const emissionDateParam = encodeURIComponent(`[${fechaInicio},${fechaFin}]`);

  while (hasMore) {
    const url = `${BSALE_API_URL}?expand=${expandParam}&emissiondaterange=${emissionDateParam}&offset=${offset}&limit=${limit}`;
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Guardamos el count total en la primera respuesta
    if (totalCount === 0 && data.count) {
      totalCount = data.count;
      console.log(`\nTotal de documentos disponibles: ${totalCount}`);
    }
    
    if (data.items && data.items.length > 0) {
      totalDocumentos += data.items.length;
      // Procesamos y guardamos este lote de datos
      const datos = await procesarVentas(data.items, nombreEmpresa, token);
      if (datos.length > 0) {
        await guardarVentasEnDB(datos);
        totalProcesados += datos.length;
      }
      
      console.log(`Progreso: ${totalDocumentos} documentos procesados (${Math.round((totalDocumentos/totalCount)*100)}%) - ${totalProcesados} líneas de detalle - Offset: ${offset}`);
      offset += limit; // Incrementamos el offset para la siguiente página
    } else {
      console.log(`\nNo se encontraron más documentos (items vacío). Deteniendo paginación.`);
      hasMore = false;
    }
  }
  
  console.log(`\nTotal: ${totalDocumentos} documentos procesados, ${totalProcesados} líneas de detalle`);
  return totalProcesados;
}

async function procesarVentas(ventas, nombreSucursal, tokenSucursal) {
  console.log(`Procesando ${ventas.length} ventas para sucursal: ${nombreSucursal}`);
  const datos = [];
  for (const documento of ventas) {
    if (documento.details && Array.isArray(documento.details.items)) {
      const officeName = documento.office && documento.office.name ? documento.office.name : nombreSucursal;
      
      let sellerName = '';
      if (documento.sellers && documento.sellers.items && documento.sellers.items.length > 0) {
        const seller = documento.sellers.items[0];
        sellerName = `${seller.firstName} ${seller.lastName}`.trim();
      }

      let tipoDocumento = '';
      if (documento.document_type) {
        tipoDocumento = documento.document_type.name || '';
      }

      let paymentTypeName = '';
      if (documento.payments && documento.payments.items && documento.payments.items.length > 0) {
        paymentTypeName = documento.payments.items[0].name || '';
      }
      else if (documento.payments && Array.isArray(documento.payments) && documento.payments.length > 0) {
        paymentTypeName = documento.payments[0].name || '';
      }

      for (const detalle of documento.details.items) {
        let variantDescription = detalle.variant && detalle.variant.description ? detalle.variant.description : '';
        let variantId = detalle.variant && detalle.variant.id ? detalle.variant.id : null;
        let productName = '';
        let productTypeName = '';
        let sku = detalle.variant && detalle.variant.code ? detalle.variant.code : '';
        let averageCost = '';
        let margenNeto = '';

        if (variantId) {
          try {
            const variantUrl = `https://api.bsale.io/v1/variants/${variantId}.json?expand=product,product_type`;
            const variantOptions = {
              method: 'get',
              headers: {
                'access_token': tokenSucursal
              }
            };
            const variantResponse = await fetch(variantUrl, variantOptions);
            const variantData = await variantResponse.json();
            
            if (variantData.product) {
              productName = variantData.product.name || '';
              if (variantData.product.product_type) {
                productTypeName = variantData.product.product_type.name || '';
              }
            }
            
            const costUrl = `https://api.bsale.io/v1/variants/${variantId}/costs.json`;
            const costResponse = await fetch(costUrl, variantOptions);
            const costData = await costResponse.json();
            averageCost = costData.averageCost ? Math.round(Number(costData.averageCost)) : '';
          } catch (e) {
            console.error(`Error obteniendo datos para variante ${variantId}: ${e.message}`);
          }
        }

        let netUnitValue = detalle.netUnitValue || 0;
        let costo = parseFloat(averageCost) || 0;
        margenNeto = netUnitValue - costo;

        function formatCLP(value) {
          if (value === '' || value === undefined || value === null || isNaN(value)) return null;
          // Removemos los puntos de miles y convertimos a número
          return Number(value.toString().replace(/\./g, ''));
        }

        let nroDocumento = documento.number || '';
        datos.push([
          documento.id,
          detalle.id,
          EMPRESAS.find(e => e.token === tokenSucursal)?.nombre || '',
          officeName,
          new Date(documento.emissionDate * 1000 + (3 * 60 * 60 * 1000)).toISOString(),  // Ajustamos a UTC sumando 3 horas
          sku || null,
          productName || null,
          productTypeName || null,
          variantDescription || null,
          `${productName} ${variantDescription}`.trim() || null,
          formatCLP(detalle.totalAmount),
          formatCLP(detalle.netAmount),
          formatCLP(margenNeto),
          formatCLP(averageCost),
          formatCLP(detalle.taxAmount),
          detalle.quantity || null,
          sellerName || null,
          paymentTypeName || null,
          tipoDocumento || null,
          nroDocumento || null
        ]);
      }
    }
  }
  console.log(`Procesadas ${datos.length} filas para ${nombreSucursal}`);
  return datos;
}

async function importarVentasBsale2024(startOffset = 0, startSucursalIndex = 0, fechaInicioPersonalizada = null, fechaFinPersonalizada = null) {
  // Creamos la fecha en la zona horaria de Chile (UTC-3)
  let fechaInicio, fechaFin;
  
  if (fechaInicioPersonalizada && fechaFinPersonalizada) {
    // Si se proporcionan fechas personalizadas, las usamos
    // Creamos las fechas directamente en la zona horaria de Chile
    const fechaInicioChile = new Date(`${fechaInicioPersonalizada}T00:00:01-03:00`);
    // Ajustamos la fecha fin para que termine a las 20:59:59 UTC (23:59:59 Chile)
    const fechaFinChile = new Date(`${fechaFinPersonalizada}T20:59:59Z`);
    
    fechaInicio = Math.floor(fechaInicioChile.getTime() / 1000);
    fechaFin = Math.floor(fechaFinChile.getTime() / 1000);
  } else {
    // Si no se proporcionan, usamos el rango completo de 2024
    const fechaInicioChile = new Date('2024-01-01T00:00:01-03:00');
    const fechaFinChile = new Date('2025-12-31T20:59:59Z');
    
    fechaInicio = Math.floor(fechaInicioChile.getTime() / 1000);
    fechaFin = Math.floor(fechaFinChile.getTime() / 1000);
  }

  // Formateamos las fechas para el log en formato chileno
  const formatearFecha = (timestamp) => {
    const fecha = new Date(timestamp * 1000);
    // Si es la fecha fin (20:59:59 UTC), forzamos mostrar 23:59:59
    if (fecha.getUTCHours() === 20 && fecha.getUTCMinutes() === 59 && fecha.getUTCSeconds() === 59) {
      return `${fecha.getUTCDate().toString().padStart(2, '0')}-${(fecha.getUTCMonth() + 1).toString().padStart(2, '0')}-${fecha.getUTCFullYear()} 23:59:59`;
    }
    return fecha.toLocaleString('es-CL', { 
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  console.log(`\nImportando ventas desde ${formatearFecha(fechaInicio)} hasta ${formatearFecha(fechaFin)}`);
  
  let totalProcesado = 0;
  
  // Nos aseguramos que la tabla existe
  await crearTablaVentas();
  
  // Filtramos las empresas desde el índice especificado
  const empresasRestantes = EMPRESAS.slice(startSucursalIndex);
  
  for (const empresa of empresasRestantes) {
    console.log(`\n--- Procesando ${empresa.nombre} ---`);
    const procesados = await obtenerVentasBsaleEmpresaDia(empresa.token, fechaInicio, fechaFin, empresa.nombre, startOffset);
    totalProcesado += procesados;
  }
  
  console.log(`\nProceso completado. Total de filas procesadas: ${totalProcesado}`);
}

// Exportar funciones para uso en otros archivos
module.exports = {
  importarVentasBsale2024,
  crearTablaVentas
};