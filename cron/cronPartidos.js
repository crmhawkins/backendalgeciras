const cron = require('node-cron');
const { Op } = require('sequelize');
const { obtenerPartidos } = require('../services/scrappingPartidos');
const liberarAsientosPasados = require('./liberarAsientos');
const eliminarAbonosTemporada = require('./eliminarAbonos');
const { obtenerClasificacion} = require('../services/scrapingClasificacion');
const { verificarProximosPartidos } = require('../notificaciones/verificarPartido');
const Asiento = require('../models/asiento');

// FIX-7: lock flags — prevent cron overlap
let isPartidosRunning = false;
let isLimpiezaRunning = false;
let isVerificarRunning = false;
let isReservasRunning = false;

cron.schedule('*/15 * * * *', async () => {
  if (isPartidosRunning) { console.warn('[cronPartidos] anterior ejecución aún activa, saltando'); return; }
  isPartidosRunning = true;
  try {
    console.log('⏰ Ejecutando scraping automático...');
    await obtenerPartidos();
    await obtenerClasificacion();
    if (!global.cronLastRun) global.cronLastRun = {};
    global.cronLastRun.cronPartidos = new Date().toISOString();
    console.log('✅ Scraping automático completado');
  } catch (err) {
    console.error('❌ Error en scraping automático:', err.message);
  } finally {
    isPartidosRunning = false;
  }
});

cron.schedule('0 2 * * *', async () => {
  if (isLimpiezaRunning) { console.warn('[cronLimpieza] anterior ejecución aún activa, saltando'); return; }
  isLimpiezaRunning = true;
  try {
    console.log('⏰ Ejecutando limpieza...');
    await obtenerPartidos();
    await liberarAsientosPasados();
    await eliminarAbonosTemporada();
    if (!global.cronLastRun) global.cronLastRun = {};
    global.cronLastRun.liberarAsientos = new Date().toISOString();
    global.cronLastRun.eliminarAbonos  = new Date().toISOString();
  } catch (err) {
    console.error('❌ Error en limpieza nocturna:', err.message);
  } finally {
    isLimpiezaRunning = false;
  }
});

// Ejecuta todos los días a las 03:00 UTC (05:00 España)
cron.schedule('0 3 * * *', async () => {
  if (isVerificarRunning) { console.warn('[cronVerificar] anterior ejecución aún activa, saltando'); return; }
  isVerificarRunning = true;
  try {
    console.log('🔔 Verificando partidos próximos...');
    await verificarProximosPartidos();
  } catch (err) {
    console.error('❌ Error en verificarProximosPartidos:', err.message);
  } finally {
    isVerificarRunning = false;
  }
});

// Cada minuto: liberar reservas temporales expiradas
cron.schedule('* * * * *', async () => {
  if (isReservasRunning) return;
  isReservasRunning = true;
  try {
    await Asiento.update(
      { reservadoHasta: null },
      {
        where: {
          reservadoHasta: { [Op.lt]: new Date() },
          estado: 'disponible'
        }
      }
    );
  } catch (err) {
    console.error('Error limpiando reservas:', err);
  } finally {
    isReservasRunning = false;
  }
});
