const Partido = require('../models/partido');
const { validationResult } = require('express-validator');
const EventoPartido = require('../models/eventoPartido');
const logger = require('../helpers/logger');

const eventosGet = async (req, res) => {
  const { id } = req.params;

  try {
    const eventos = await EventoPartido.findAll({
      where: { partidoId: id },
      order: [['minuto', 'ASC']]
    });

    res.json({
      ok: true,
      eventos
    });
  } catch (error) {
    console.error('❌ Error al obtener eventos:', error.message);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener los eventos del partido'
    });
  }
};

const partidoGet = async (req, res) => {
    try {
      const partidos = await Partido.findAll({ order: [['fecha', 'ASC']] });
      logger.info('Partidos obtenidos correctamente', { count: partidos.length });
      const proximoPartido = partidos.find(p => !p.marcador && new Date(p.fecha) >= new Date()) || null;
      res.json({ partidos, proximoPartido });
    } catch (error) {
      logger.error('Error en partidoGet', error);
      console.error('❌ Error en partidoGet:', error);
      res.status(500).json({ msg: 'Error al obtener los partidos', error });
    }
  };

const partidoPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    const { fecha, hora, equipoLocal, equipoVisitante } = req.body;

    try {
        const partido = await Partido.create({ fecha, hora, equipoLocal, equipoVisitante });
        res.status(201).json({ msg: 'Partido creado correctamente', partido });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear el partido', error });
    }
};

module.exports = {
    partidoGet,
    partidoPost,
    eventosGet
};