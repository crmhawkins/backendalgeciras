const { validationResult } = require('express-validator');
const Grada = require('../models/grada');

const gradaGet = async (req, res) => {
    const gradas = await Grada.findAll();
    res.json({ gradas });
};

const gradaPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    const { nombre, descripcion } = req.body;
    const grada = await Grada.create({ nombre, descripcion });
    res.status(201).json({ msg: 'Grada creada', grada });
};

module.exports = {
    gradaGet,
    gradaPost
};
