const { validationResult } = require('express-validator');
const { db } = require('../database/config');
const { fn, col, literal } = require('sequelize');
const Sector = require('../models/sector');
const Asiento = require('../models/asiento');

const sectorGet = async (req, res) => {
    try {
        const where = {};
        if (req.query.gradaId) where.gradaId = req.query.gradaId;
        const sectores = await Sector.findAll({ where });

        // Fix N+1: single GROUP BY query instead of Asiento.count() per sector
        const counts = await Asiento.findAll({
            attributes: ['sectorId', [fn('COUNT', col('id')), 'total']],
            where: { estado: 'disponible' },
            group: ['sectorId'],
            raw: true
        });
        const countMap = {};
        for (const row of counts) {
            countMap[row.sectorId] = parseInt(row.total, 10);
        }

        const sectoresConDisponibles = sectores.map((sector) => ({
            ...sector.toJSON(),
            asientosDisponibles: countMap[sector.id] || 0
        }));

        res.json({ sectores: sectoresConDisponibles });
    } catch (error) {
        console.error('[sectorGet]', error.message);
        res.status(500).json({ msg: 'Error al obtener los sectores' });
    }
};

const sectorPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    try {
        const { nombre, capacidad, gradaId } = req.body;
        const sector = await Sector.create({ nombre, capacidad, gradaId });
        res.status(201).json({ msg: 'Sector creado', sector });
    } catch (error) {
        console.error('[sectorPost]', error.message);
        res.status(500).json({ msg: 'Error al crear el sector' });
    }
};

module.exports = {
    sectorGet,
    sectorPost
};
