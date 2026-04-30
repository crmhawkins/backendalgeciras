const cron = require('node-cron');
const { obtenerPartidos } = require('../services/scrappingPartidos');
const liberarAsientosPasados = require('./liberarAsientos');
const eliminarAbonosTemporada = require('./eliminarAbonos');
const { obtenerClasificacion} = require('../services/scrapingClasificacion');
const { verificarProximosPartidos } = require('../notificaciones/verificarPartido');


cron.schedule('*/15 * * * *', async () => {
  console.log('⏰ Ejecutando scraping automático...');
  await obtenerPartidos();
  await obtenerClasificacion();
  console.log('✅ Scraping automático completado');
});

cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Ejecutando limpieza...');
  await obtenerPartidos();
  await liberarAsientosPasados();
  await eliminarAbonosTemporada();
});

// Ejecuta todos los días a las 19:00 PM
cron.schedule('0 3 * * *', async () => {
  console.log('🔔 Verificando partidos próximos...');
  verificarProximosPartidos();
});
