const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { sincronizarZonas, obtenerDisponibilidadZona } = require('../services/compralaentradaService');
const { ejecutarSincronizacion } = require('../cron/cronSync');
const { sincronizarJugadores } = require('../services/sofascoreService');

const router = Router();

/**
 * GET /api/sync/compralaentrada
 * Sincronización manual — protegida por JWT
 */
router.get('/compralaentrada', validarJWT, async (req, res) => {
    try {
        const resultados = await ejecutarSincronizacion();
        res.json({
            msg: 'Sincronización completada',
            timestamp: new Date().toISOString(),
            resultados
        });
    } catch (err) {
        console.error('[sync route] Error en sincronización manual:', err.message);
        res.status(500).json({ msg: 'Error al sincronizar con compralaentrada', error: err.message });
    }
});

/**
 * GET /api/sync/disponibilidad/:zonaId
 * Disponibilidad en tiempo real de una zona desde compralaentrada
 */
router.get('/disponibilidad/:zonaId', async (req, res) => {
    const { zonaId } = req.params;
    try {
        const disponibilidad = await obtenerDisponibilidadZona(zonaId);
        res.json({
            zonaId,
            timestamp: new Date().toISOString(),
            ...disponibilidad
        });
    } catch (err) {
        console.error(`[sync route] Error obteniendo disponibilidad zona ${zonaId}:`, err.message);
        res.status(502).json({ msg: 'Error al consultar compralaentrada', error: err.message });
    }
});

router.post('/jugadores', async (req, res) => {
    const secret = req.headers['x-sync-secret'];
    const SYNC_SECRET = process.env.SYNC_SECRET;
    if (!SYNC_SECRET) return res.status(503).json({ ok: false, error: 'SYNC_SECRET no configurado' });
    if (secret !== SYNC_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    try {
        await sincronizarJugadores();
        res.json({ msg: 'Sync plantilla completado', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ msg: 'Error sync jugadores', error: err.message });
    }
});


// cleanup-db — datos de prueba ya eliminados en producción, endpoint desactivado
router.post('/cleanup-db', async (req, res) => {
    const secret = req.headers['x-sync-secret'];
    const SYNC_SECRET = process.env.SYNC_SECRET;
    if (!SYNC_SECRET) return res.status(503).json({ ok: false, error: 'SYNC_SECRET no configurado' });
    if (secret !== SYNC_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    res.json({ ok: true, msg: 'Nothing to clean' });
});

module.exports = router;
