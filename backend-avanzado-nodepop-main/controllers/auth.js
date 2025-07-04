const bcryptjs = require('bcryptjs');
const { response, request } = require('express');

const { generarJWT } = require('../helpers/generarJWt');
const  Usuario = require('../models/usuario');

const authenticatePost = async(req, res = response ) => {

    const { email, password } = req.body;

    try {

        // _Verificar si el email existe el
        const usuario = await Usuario.findOne({ email });
        if(!usuario){
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - email'
            });
        };

        // Si el usuario esta activo
        if(!usuario.estado){
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - estado: false'
            });
        };

        // Verificar la contraseña usuario
        const validPassword = bcryptjs.compareSync ( password, usuario.password );
        if (!validPassword) {
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - password'
            });
        };

        // Generar el JWT
        const token = await generarJWT( usuario.id );


        res.json( {
            usuario,
            token
        } );
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    };
}


module.exports = {
    authenticatePost
};