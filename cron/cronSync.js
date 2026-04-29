const cron = require('node-cron');
const { sincronizarZonas } = require('../services/compralaentradaService');
const { procesarNotificaciones } = require('../services/notificacionesService');

/**
 * Ejecuta sincronización manual y loguea resultado
 */
const ejecutarSincronizacion = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [cronSync] Iniciando sincronización compralaentrada...`);
    try {
        const resultados = await sincronizarZonas();
        const ok = resultados.filter((r) => r.estado === 'sincronizado').length;
        const errores = resultados.filter((r) => r.estado === 'error').length;
        console.log(`[${new Date().toISOString()}] [cronSync] Sync completado: ${ok} zonas OK, ${errores} errores`);
        resultados.forEach((r) => {
            if (r.estado === 'error') {
                console.error(`[cronSync] Zona ${r.zonaId} (${r.nombre}): ${r.error}`);
            } else {
                console.log(`[cronSync] Zona ${r.zonaId} (${r.nombre}): ${r.estado} | libres=${r.libres ?? '-'} | actualizados=${r.asientosActualizados ?? '-'}`);
            }
        });
        return resultados;
    } catch (err) {
        console.error(`[${new Date().toISOString()}] [cronSync] Error fatal en sincronización:`, err.message);
        return [];
    }
};

// Cada 1 minuto
cron.schedule('* * * * *', ejecutarSincronizacion);

// Notificaciones de partidos — cada 5 minutos (desactivado por defecto via NOTIFICACIONES_ACTIVAS)
cron.schedule('*/5 * * * *', async () => {
    await procesarNotificaciones().catch(e => console.error('[notificaciones] Error:', e.message));
});

module.exports = { ejecutarSincronizacion };
