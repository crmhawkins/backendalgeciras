const FanzoneVoto = require('../models/fanzoneVoto');
const { Op } = require('sequelize');
const { db } = require('../database/config');

const getVotos = async (req, res) => {
  const { partidoId } = req.params;
  try {
    const votos = await FanzoneVoto.findAll({ where: { partidoId } });
    const conteo = {};
    for (const v of votos) {
      conteo[v.jugador] = (conteo[v.jugador] || 0) + 1;
    }
    const total = votos.length;
    const resultado = Object.entries(conteo)
      .map(([jugador, votos]) => ({ jugador, votos, porcentaje: total ? Math.round((votos / total) * 100) : 0 }))
      .sort((a, b) => b.votos - a.votos);
    res.json({ ok: true, total, resultado });
  } catch (e) {
    res.status(500).json({ ok: false, msg: 'Error al obtener votos' });
  }
};

const getMiVoto = async (req, res) => {
  const { partidoId } = req.params;
  const uid = req.uid;
  try {
    const voto = await FanzoneVoto.findOne({ where: { partidoId, userId: uid } });
    res.json({ ok: true, voto: voto ? voto.jugador : null });
  } catch (e) {
    res.status(500).json({ ok: false, msg: 'Error al obtener voto' });
  }
};

const votar = async (req, res) => {
  const { partidoId } = req.params;
  const { jugador } = req.body;
  const uid = req.uid;

  if (!jugador || !jugador.trim()) {
    return res.status(400).json({ ok: false, msg: 'Jugador requerido' });
  }

  try {
    const [voto, created] = await FanzoneVoto.findOrCreate({
      where: { partidoId, userId: uid },
      defaults: { jugador: jugador.trim() },
    });

    if (!created) {
      await voto.update({ jugador: jugador.trim() });
    }

    res.json({ ok: true, msg: created ? 'Voto registrado' : 'Voto actualizado', jugador: jugador.trim() });
  } catch (e) {
    res.status(500).json({ ok: false, msg: 'Error al registrar voto' });
  }
};

module.exports = { getVotos, getMiVoto, votar };
