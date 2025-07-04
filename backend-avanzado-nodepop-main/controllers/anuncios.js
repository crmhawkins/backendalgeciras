/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const { response, request } = require('express');
const  Anuncio = require('../models/anuncio');
const { subirArchivo } = require("../helpers/subir-archivo");



const anunciosGet = async(req = request, res = response) => {

    // Establecemos los valores por defecto
    const { 
        limite = 0,
        desde = 0,
        sort = '',
        order = 'asc'
            } = req.query;
    
    // Declaramos la variable que pasaremos por el filtro
    const query = {};

    // Si en la request viene el nombre lo pasamos a la query para filtrar
    if (req.query.nombre) {
        query.nombre = { $regex: req.query.nombre, $options: 'i' };
    }

    // Si en la request viene el venta lo pasamos a la query para filtrar
    if (req.query.venta) {
        query.venta = req.query.venta;
    }

    // Si en la request tags el nombre lo pasamos a la query para filtrar
    if (req.query.tags) {
        query.tags = { $regex: req.query.tags, $options: 'i' };
    }

    // Si en la request maxPrice o minPrice el nombre lo pasamos a la query para filtrar
    if (req.query.maxPrice && req.query.minPrice) {
        query.precio = { '$gte': req.query.minPrice, '$lte': req.query.maxPrice };
    }else if (req.query.maxPrice && !req.query.minPrice) {
        query.precio = { '$lte': req.query.maxPrice };
    }else if (!req.query.maxPrice && req.query.minPrice) {
        query.precio = { '$gte': req.query.minPrice };
    };
    
    // Realizamos la busqueda de anuncios pasandole las variables recibidas como filtros
    const [ total, anuncios ] = await Promise.all([
        Anuncio.countDocuments(query),
        Anuncio.find(query)
            .skip( Number( desde ))
            .limit( Number( limite ))
            .sort(sort)
            .sort({ precio: order })
    ]);

    // Retornamos los anuncios con el numero total en un JSON
    res.json({
        total,
        anuncios
    });
}

const anunciosPost = async (req, res = response) => {

    // Desestructuramos los parametros que vienen en la Request
    const { nombre, venta, precio, tags } = req.body;  
    
    const {nombreTemp:img, response:thumbnail} = await subirArchivo( req.files, undefined, 'imgs' );
    console.log(img)
    
    // Creamos el modelo anuncio para añadir al DB
    const anuncio = new Anuncio( {
        nombre,
        venta,
        precio,
        img,
        tags
    } );

    // Guardamos el nuevo anuncio
    await anuncio.save();
console.log('ruta thumbnail',thumbnail)
    res.json({
        anuncio,
        thumbnail
    });
}

const anunciosPut = async(req, res = response) => {
    
    // Desestructuramos la ID que viene en la Request
    const { id } = req.params;
    // Creamos la variable data para guardar lo que viene en el la request.boby
    const data = req.body;
    const anuncio = await Anuncio.findByIdAndUpdate(id, data);

    res.json({
        msg: 'put API - usuariosPut',
        anuncio
    });
}

const anunciosPatch = (req, res = response) => {
    res.json({
        msg: 'patch API - usuariosPatch'
    });
}

const anunciosDelete = async(req, res = response) => {
    
    const { id } = req.params;
    const anuncioBorrado = await Anuncio.findByIdAndDelete( id );

    res.json( anuncioBorrado );

}

const anunciosGetId = async(req, res = response ) => {

    const { id } = req.params;
    const anuncio = await Anuncio.findById( id )

    res.json( anuncio );
}



module.exports = {
    anunciosGet,
    anunciosPost,
    anunciosPut,
    anunciosPatch,
    anunciosDelete,
    anunciosGetId
}