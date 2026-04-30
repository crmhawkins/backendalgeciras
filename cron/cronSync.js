const cron = require('node-cron');
const { sincronizarButacasDesdeCompralaentrada } = require('../services/compralaentradaScraper');
const { procesarNotificaciones } = require('../services/notificacionesService');

const ejecutarSincronizacion = async () => {
    try {
        await sincronizarButacasDesdeCompralaentrada();
    } catch (err) {
        console.error(`[cronSync] Error fatal:`, err.message);
    }
};

// Cada 5 minutos — butacas individuales por partido activo
cron.schedule('*/5 * * * *', ejecutarSincronizacion);

// Notificaciones de partidos — cada 5 minutos (desactivado por defecto via NOTIFICACIONES_ACTIVAS)
cron.schedule('*/5 * * * *', async () => {
    await procesarNotificaciones().catch(e => console.error('[notificaciones] Error:', e.message));
});

module.exports = { ejecutarSincronizacion };
