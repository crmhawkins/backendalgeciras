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
    try {
        await sincronizarJugadores();
        res.json({ msg: 'Sync plantilla completado', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ msg: 'Error sync jugadores', error: err.message });
    }
});

router.get('/jugadores/test', async (req, res) => {
    const axios = require('axios');
    const HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://www.sofascore.com/',
        'Origin': 'https://www.sofascore.com',
        'sec-ch-ua': '"Chromium";v="124"',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
    };
    try {
        const r = await axios.get('https://www.sofascore.com/api/v1/team/4489/players', { headers: HEADERS, timeout: 10000 });
        res.json({ status: r.status, keys: Object.keys(r.data), playerCount: r.data.players?.length, first: r.data.players?.[0]?.player?.name });
    } catch (err) {
        res.status(502).json({ error: err.message, status: err.response?.status, data: err.response?.data });
    }
});

module.exports = router;
