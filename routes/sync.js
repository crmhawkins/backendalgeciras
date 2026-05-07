const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { sincronizarZonas, obtenerDisponibilidadZona } = require('../services/compralaentradaService');
const { ejecutarSincronizacion } = require('../cron/cronSync');
const { sincronizarJugadores } = require('../services/sofascoreService');
const { db } = require('../database/config');

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
    const SYNC_SECRET = process.env.SYNC_SECRET || 'hawkins-sync-2026';
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


router.post('/cleanup-db', async (req, res) => {
    const secret = req.headers['x-sync-secret'];
    const SYNC_SECRET = process.env.SYNC_SECRET || 'hawkins-sync-2026';
    if (secret !== SYNC_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    try {
        const [r1] = await db.query('DELETE FROM jugador_stats WHERE jugadorId IN (SELECT id FROM jugadores WHERE sofascoreId = 999)');
        const [r2] = await db.query('DELETE FROM jugadores WHERE sofascoreId = 999');
        const [r3] = await db.query('DELETE FROM partidos WHERE id = 27');
        const [r4] = await db.query(`
            DELETE js FROM jugador_stats js
            INNER JOIN (
                SELECT MIN(id) as min_id, jugadorId, temporada
                FROM jugador_stats
                GROUP BY jugadorId, temporada
            ) t ON js.jugadorId = t.jugadorId AND js.temporada = t.temporada AND js.id > t.min_id
        `);
        const [[{ jugadores }]] = await db.query('SELECT COUNT(*) as jugadores FROM jugadores');
        const [[{ stats }]] = await db.query('SELECT COUNT(*) as stats FROM jugador_stats');
        const [[{ partidos }]] = await db.query('SELECT COUNT(*) as partidos FROM partidos');
        res.json({ ok: true, jugadores, stats, partidos });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
