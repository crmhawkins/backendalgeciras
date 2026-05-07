const { validationResult } = require('express-validator');
const Grada = require('../models/grada');

const gradaGet = async (req, res) => {
    try {
        const gradas = await Grada.findAll();
        res.json({ gradas });
    } catch (error) {
        console.error('[gradaGet]', error.message);
        res.status(500).json({ msg: 'Error al obtener las gradas' });
    }
};

const gradaPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    try {
        const { nombre, descripcion } = req.body;
        const grada = await Grada.create({ nombre, descripcion });
        res.status(201).json({ msg: 'Grada creada', grada });
    } catch (error) {
        console.error('[gradaPost]', error.message);
        res.status(500).json({ msg: 'Error al crear la grada' });
    }
};

module.exports = {
    gradaGet,
    gradaPost
};
