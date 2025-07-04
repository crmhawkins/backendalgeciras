const { response } = require('express');
const { validationResult } = require('express-validator');
const Asiento = require('../models/asiento');

const asientoGet = async (req, res = response) => {
    const { id } = req.query;

    try {
        const asiento = await Asiento.findByPk(id, {
            include: ['Partido']
        });

        if (!asiento) {
            return res.status(404).json({
                msg: `No existe un asiento con el id ${id}`
            });
        }

        res.json({
            msg: 'Asiento encontrado',
            asiento
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Error al buscar el asiento'
        });
    }
};

const asientoPost = async (req, res = response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }

    const { numero, disponible, partidoId, sectorId } = req.body;

    try {
        const existeAsiento = await Asiento.findOne({
            where: { numero, partidoId, sectorId }
        });

        if (existeAsiento) {
            return res.status(400).json({
                msg: 'Ese asiento ya existe para el partido y sector seleccionados'
            });
        }

        const asiento = await Asiento.create({
            numero,
            disponible,
            partidoId,
            sectorId
        });

        res.status(201).json({
            msg: 'Asiento creado correctamente',
            asiento
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Error al crear el asiento'
        });
    }
};

module.exports = {
    asientoGet,
    asientoPost
};

