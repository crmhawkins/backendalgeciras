const { response, request } = require('express');
const bcryptjs = require('bcryptjs');

const  Usuario = require('../models/usuario');
const { validationResult } = require('express-validator');

const usuarioGet = async(req, res = response ) => {

    // const usuario = await Usuario.findById( id )
    const { id } = req.query;

    try {
        const usuario = await Usuario.findById(id);
        console.log(usuario);
        return res.json( {
            msg: 'Funciona',
            usuario
        });

    } catch (error) {
        return res.status(404).json({
            msg: `No existe un usuario con el id ${id}`
        })
    }
}

const usuarioPost = async(req, res = response ) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json(errors);
    }

    const {nombre, email, password, img, rol } = req.body;
    
    // Creamos el modelo usuario para añadir al DB
    const usuario = new Usuario( {
        nombre,
        email,
        password,
        img,
        rol
    });

    // verificar si el correo existe que
    const existeEmail = await Usuario.findOne({ email });
    if( existeEmail ) {
        return res.status(400).json({
            msg: 'Ese correo ya esta registrado'
        })
    }

    // encriptar la contraseña
    const salt = bcryptjs.genSaltSync();
    usuario.password = bcryptjs.hashSync(password, salt);

    // Guardamos el nuevo usuario
    await usuario.save();

    res.json({
        usuario
    });    
}

module.exports = {
    usuarioGet,
    usuarioPost
};