const Jugador = require('../models/jugador');
const JugadorStats = require('../models/jugadorStats');

const TEMPORADA = '2025/2026';

const POSICION_MAP = {
  G: 'porteros',
  D: 'defensas',
  M: 'centrocampistas',
  F: 'delanteros'
};

const getPlantilla = async (req, res) => {
  try {
    const jugadores = await Jugador.findAll({
      include: [{
        model: JugadorStats,
        as: 'stats',
        where: { temporada: TEMPORADA },
        required: false
      }],
      order: [['posicion', 'ASC'], ['dorsal', 'ASC']]
    });

    const agrupados = {
      porteros: [],
      defensas: [],
      centrocampistas: [],
      delanteros: []
    };

    for (const j of jugadores) {
      const grupo = POSICION_MAP[j.posicion] || 'delanteros';
      agrupados[grupo].push(j);
    }

    res.json({ ok: true, plantilla: agrupados });
  } catch (err) {
    console.error('[jugadores] getPlantilla error:', err.message);
    res.status(500).json({ ok: false, msg: 'Error obteniendo plantilla' });
  }
};

const getJugador = async (req, res) => {
  const { id } = req.params;
  try {
    const jugador = await Jugador.findByPk(id, {
      include: [{
        model: JugadorStats,
        as: 'stats',
        required: false
      }]
    });

    if (!jugador) {
      return res.status(404).json({ ok: false, msg: 'Jugador no encontrado' });
    }

    res.json({ ok: true, jugador });
  } catch (err) {
    console.error('[jugadores] getJugador error:', err.message);
    res.status(500).json({ ok: false, msg: 'Error obteniendo jugador' });
  }
};

module.exports = { getPlantilla, getJugador };
