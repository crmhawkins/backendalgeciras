const { Router } = require('express');
const { getPlantilla, getJugador } = require('../controllers/jugadores');
const Jugador = require('../models/jugador');
const JugadorStats = require('../models/jugadorStats');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jugadores
 *   description: Plantilla y estadísticas de jugadores
 */

/**
 * @swagger
 * /api/jugadores:
 *   get:
 *     summary: Obtener plantilla completa
 *     tags: [Jugadores]
 *     responses:
 *       200:
 *         description: Lista de jugadores con estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:       { type: boolean }
 *                 jugadores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:          { type: integer }
 *                       nombre:      { type: string }
 *                       posicion:    { type: string }
 *                       dorsal:      { type: integer }
 *                       foto:        { type: string, format: uri }
 *                       nacionalidad:{ type: string }
 */

/**
 * @swagger
 * /api/jugadores/{id}:
 *   get:
 *     summary: Detalle de un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del jugador con stats de la temporada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:      { type: boolean }
 *                 jugador: { type: object }
 *       404:
 *         description: Jugador no encontrado
 */

const TEMPORADA = process.env.TEMPORADA || '2025/2026';
const SYNC_SECRET = process.env.SYNC_SECRET;

router.get('/', getPlantilla);
router.get('/:id', getJugador);

/**
 * POST /api/jugadores/import
 * Importa jugadores + stats desde script local (SofaScore bloqueado en servidor).
 * Protegido por header x-sync-secret (no requiere JWT).
 */
router.post('/import', async (req, res) => {
    const secret = req.headers['x-sync-secret'];
    if (!SYNC_SECRET) return res.status(503).json({ ok: false, error: 'SYNC_SECRET no configurado' });
    if (secret !== SYNC_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { jugadores } = req.body;
    if (!Array.isArray(jugadores) || jugadores.length === 0) {
        return res.status(400).json({ ok: false, error: 'Body debe incluir array jugadores no vacío' });
    }

    let procesados = 0;

    for (const j of jugadores) {
        try {
            if (!j.sofascoreId || !j.nombre) continue;

            await Jugador.upsert({
                sofascoreId: j.sofascoreId,
                nombre: j.nombre,
                nombreCorto: j.nombreCorto || null,
                posicion: j.posicion || null,
                dorsal: j.dorsal || null,
                foto: j.foto || null,
                edad: j.edad || null,
                nacionalidad: j.nacionalidad || null,
                altura: j.altura || null,
                piePref: j.piePref || null,
                valorMercado: j.valorMercado || null
            });

            const jugador = await Jugador.findOne({ where: { sofascoreId: j.sofascoreId } });

            await JugadorStats.upsert({
                jugadorId: jugador.id,
                temporada: TEMPORADA,
                goles: j.goles || 0,
                asistencias: j.asistencias || 0,
                minutosJugados: j.minutosJugados || 0,
                partidos: j.partidos || 0,
                titularidades: j.titularidades || 0,
                tarjetasAmarillas: j.tarjetasAmarillas || 0,
                tarjetasRojas: j.tarjetasRojas || 0,
                disparos: j.disparos || 0,
                disparosPuerta: j.disparosPuerta || 0,
                rating: j.rating || null
            }, {
                conflictFields: ['jugadorId', 'temporada']
            });

            procesados++;
            console.log(`[import] Jugador OK: ${j.nombre} (sofascoreId=${j.sofascoreId})`);
        } catch (err) {
            console.error(`[import] Error jugador sofascoreId=${j.sofascoreId}:`, err.message);
        }
    }

    res.json({ ok: true, procesados });
});

module.exports = router;
