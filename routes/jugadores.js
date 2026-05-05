const { Router } = require('express');
const { getPlantilla, getJugador } = require('../controllers/jugadores');
const Jugador = require('../models/jugador');
const JugadorStats = require('../models/jugadorStats');

const router = Router();

const TEMPORADA = '2025/2026';
const SYNC_SECRET = process.env.SYNC_SECRET || 'hawkins-sync-2026';

router.get('/', getPlantilla);
router.get('/:id', getJugador);

/**
 * POST /api/jugadores/import
 * Importa jugadores + stats desde script local (SofaScore bloqueado en servidor).
 * Protegido por header x-sync-secret (no requiere JWT).
 */
router.post('/import', async (req, res) => {
    const secret = req.headers['x-sync-secret'];
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
