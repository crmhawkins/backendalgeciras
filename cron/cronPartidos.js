const cron = require('node-cron');
const { obtenerPartidos } = require('../services/scrappingPartidos');
const liberarAsientosPasados = require('./liberarAsientos');
const eliminarAbonosTemporada = require('./eliminarAbonos');
const { obtenerClasificacion} = require('../services/scrapingClasificacion');
const { verificarProximosPartidos } = require('../notificaciones/verificarPartido');


cron.schedule('*/15 * * * *', async () => {
  console.log('⏰ Ejecutando scraping automático...');
  try {
    await obtenerPartidos();
    await obtenerClasificacion();
    console.log('✅ Scraping automático completado');
  } catch (err) {
    console.error('❌ Error en scraping automático:', err.message);
  }
});

cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Ejecutando limpieza...');
  try {
    await obtenerPartidos();
    await liberarAsientosPasados();
    await eliminarAbonosTemporada();
  } catch (err) {
    console.error('❌ Error en limpieza nocturna:', err.message);
  }
});

// Ejecuta todos los días a las 03:00 UTC (05:00 España)
cron.schedule('0 3 * * *', async () => {
  console.log('🔔 Verificando partidos próximos...');
  try {
    await verificarProximosPartidos();
  } catch (err) {
    console.error('❌ Error en verificarProximosPartidos:', err.message);
  }
});
