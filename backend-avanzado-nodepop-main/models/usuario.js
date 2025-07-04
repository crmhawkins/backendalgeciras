/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/
'use strict';

// Importaciones (dependencias)
const { Schema, model } = require('mongoose');

// Definimos el esquema para la DB
const UsuarioSchema = Schema({
    nombre:{
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    email:{
        type: String,
        required: [true, 'El campo email es obligatorio'],
        unique: true
    },
    password:{
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    img:{
        type: String,
    },
    rol:{
        type: String,
        required: true,
        emun: ['ADMIN_ROLE', 'USER_ROLE'],
        default: 'USER_ROLE'
   },
    estado:{
        type: Boolean,
        default: true
    },
});

UsuarioSchema.methods.toJSON = function() {
    const { __v, password, _id, ...usuario  } = this.toObject();
    usuario.uid = _id;
    return usuario;
}

module.exports = model('Usuario', UsuarioSchema);