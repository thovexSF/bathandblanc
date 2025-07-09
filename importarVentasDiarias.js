require('dotenv').config();
const { importarVentasBsale2024 } = require('./importarVentas.js');

async function main() {
  try {
    const fechaHoy = new Date();
    const fechaAyer = new Date(fechaHoy);
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    
    // Configurar para importar el día anterior completo (00:00:00 a 23:59:59)
    const fechaInicio = fechaAyer.toISOString().split('T')[0];
    const fechaFin = fechaAyer.toISOString().split('T')[0]; // Mismo día (ayer)
    
    console.log('🔄 IMPORTACIÓN DIARIA DE VENTAS');
    console.log('================================');
    console.log(`📅 Fecha: ${fechaHoy.toLocaleDateString('es-CL')}`);
    console.log(`⏰ Hora: ${fechaHoy.toLocaleTimeString('es-CL')}`);
    console.log(`📊 Período: ${fechaInicio} (día anterior completo)`);
    console.log(`⏰ Horario: 00:00:00 a 23:59:59 del ${fechaInicio}`);
    console.log('🏢 Procesando todas las empresas...\n');
    
    // Configuración para importar ventas del día anterior
    const configuracion = {
      startOffset: 0,           // Empezar desde el principio
      startSucursalIndex: 0,    // Empezar desde la primera empresa
      fechaInicio: fechaInicio,
      fechaFin: fechaFin
    };
    
    console.log('⚙️  CONFIGURACIÓN:');
    console.log(`   Offset inicial: ${configuracion.startOffset}`);
    console.log(`   Sucursal inicial: ${configuracion.startSucursalIndex} (primera empresa)`);
    console.log(`   Fecha inicio: ${configuracion.fechaInicio}`);
    console.log(`   Fecha fin: ${configuracion.fechaFin}\n`);
    
    console.log('🔄 Iniciando importación diaria...\n');
    
    await importarVentasBsale2024(
      configuracion.startOffset,
      configuracion.startSucursalIndex,
      configuracion.fechaInicio,
      configuracion.fechaFin
    );
    
    console.log('\n✅ Importación diaria completada exitosamente');
    console.log(`📊 Ventas del ${fechaInicio} (día completo) importadas correctamente`);
    
    // Log para cron
    console.log(`[CRON] ${new Date().toISOString()} - Importación diaria completada`);
    
  } catch (error) {
    console.error('❌ Error en la importación diaria:', error.message);
    console.error(`[CRON] ${new Date().toISOString()} - Error: ${error.message}`);
    
    // Log detallado del error para debugging
    console.error('📋 Detalles del error:');
    console.error(error.stack);
    
    process.exit(1); // Exit con código de error para que cron lo detecte
  }
}

// Manejar interrupción del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Proceso interrumpido');
  console.log(`[CRON] ${new Date().toISOString()} - Proceso interrumpido por el usuario`);
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error.message);
  console.error(`[CRON] ${new Date().toISOString()} - Error no capturado: ${error.message}`);
  process.exit(1);
});

main(); 