/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/
'use strict';

// Importaciones (dependencias)
const { Schema, model } = require('mongoose');


// Definimos el esquema para la DB
const AnuncioSchema = Schema({
    nombre:{
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    venta:{
        type: Boolean,
        required: [true, 'El campo venta es obligatorio']
    },
    precio:{
        type: Number,
        required: [true, 'El precio es obligatorio']
    },
    estado:{
        type: Boolean,
        default: true
    },
    img:{
        type: String,
    },
    tags:{
        type: [String],
    },

});

AnuncioSchema.methods.toJSON = function() {
    const { __v, ...data  } = this.toObject();
    return data;
}


module.exports = model('Anuncio', AnuncioSchema);