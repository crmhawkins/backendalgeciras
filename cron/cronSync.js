const cron = require('node-cron');
const { sincronizarButacasDesdeCompralaentrada } = require('../services/compralaentradaScraper');
const { procesarNotificaciones } = require('../services/notificacionesService');

// FIX-7: lock flags — prevent cron overlap
let isSyncRunning = false;
let isNotificacionesRunning = false;

const ejecutarSincronizacion = async () => {
    try {
        await sincronizarButacasDesdeCompralaentrada();
    } catch (err) {
        console.error(`[cronSync] Error fatal:`, err.message);
    }
};

// Cada 5 minutos — butacas individuales por partido activo
cron.schedule('*/5 * * * *', async () => {
    if (isSyncRunning) { console.warn('[cronSync] anterior ejecución aún activa, saltando'); return; }
    isSyncRunning = true;
    try {
        await ejecutarSincronizacion();
        if (!global.cronLastRun) global.cronLastRun = {};
        global.cronLastRun.cronSync = new Date().toISOString();
    } finally {
        isSyncRunning = false;
    }
});

// Notificaciones de partidos — cada 5 minutos (desactivado por defecto via NOTIFICACIONES_ACTIVAS)
cron.schedule('*/5 * * * *', async () => {
    if (isNotificacionesRunning) { console.warn('[notificaciones] anterior ejecución aún activa, saltando'); return; }
    isNotificacionesRunning = true;
    try {
        await procesarNotificaciones().catch(e => console.error('[notificaciones] Error:', e.message));
    } finally {
        isNotificacionesRunning = false;
    }
});

module.exports = { ejecutarSincronizacion };
