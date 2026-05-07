'use strict';

const { Router } = require('express');
const Partido = require('../models/partido');
const Jugador = require('../models/jugador');
const Abono = require('../models/abono');
const Noticia = require('../models/noticia');

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [totalPartidos, totalJugadores, totalAbonados, totalNoticias] = await Promise.all([
            Partido.count(),
            Jugador.count(),
            Abono.count({ where: { activo: true } }),
            Noticia.count({ where: { activo: true } }),
        ]);

        res.json({
            ok: true,
            stats: {
                partidos: totalPartidos,
                jugadores: totalJugadores,
                abonados: totalAbonados,
                noticias: totalNoticias,
                temporada: process.env.TEMPORADA || '2025/2026',
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, msg: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
