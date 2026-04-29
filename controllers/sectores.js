const { validationResult } = require('express-validator');
const Sector = require('../models/sector');
const Asiento = require('../models/asiento');

const sectorGet = async (req, res) => {
    const sectores = await Sector.findAll();

    const sectoresConDisponibles = await Promise.all(
        sectores.map(async (sector) => {
            const asientosDisponibles = await Asiento.count({
                where: { sectorId: sector.id, estado: 'disponible' }
            });
            return { ...sector.toJSON(), asientosDisponibles };
        })
    );

    res.json({ sectores: sectoresConDisponibles });
};

const sectorPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    const { nombre, capacidad, gradaId } = req.body;
    const sector = await Sector.create({ nombre, capacidad, gradaId });
    res.status(201).json({ msg: 'Sector creado', sector });
};

module.exports = {
    sectorGet,
    sectorPost
};
