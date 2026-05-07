const { validationResult } = require('express-validator');
const Sector = require('../models/sector');
const Asiento = require('../models/asiento');

const sectorGet = async (req, res) => {
    try {
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
