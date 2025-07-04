/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const path = require('path');
const fs = require('fs');('path');

const { response } = require("express");

const { subirArchivo } = require("../helpers/subir-archivo");
const  Anuncio = require('../models/anuncio');


const cargarArchivo = async(req, res = response ) => {
  
    try {
      // const nombre = await subirArchivo( req.files, ['txt','md'], 'textos' );
      // Imagenes
      const nombre = await subirArchivo( req.files, undefined, 'imgs' );
      res.json({ nombre });
      
    } catch (msg) {
      res.status(400).json({ msg });
    };

}



const actualizarImagen = async( req, res = response ) => {

  const { id, coleccion } = req.params;
  
  let modelo;

  switch (coleccion) {
    case 'anuncios':
        modelo = await Anuncio.findById(id);
        if ( !modelo ) {
            return res.status(400).json({ 
              msg: `No existe un anuncio con el id - ${ id }`
            });
        };

      break;
  
    default:
      return res.status(500).json({ msg: 'Se me olvido validar esto' });
  }

  // Limpiar imágenes previas
  if ( modelo.img ) {
      // Hay que borrar la imagen del servidor
      const pathImagen = path.join(__dirname, '../uploads/', coleccion, modelo.img);
      if ( fs.existsSync( pathImagen ) ) {
          fs.unlinkSync( pathImagen );
      };
  }


  const nombre = await subirArchivo( req.files, undefined, coleccion );
  modelo.img = nombre; 

  await modelo.save();


  res.json( modelo );

}


const mostrarImagen = async( req, res = response ) => {

  const { id, coleccion } = req.params;
  
  let modelo;

  switch (coleccion) {
    case 'anuncios':
        modelo = await Anuncio.findById(id);
        if ( !modelo ) {
            return res.status(400).json({ 
              msg: `No existe un anuncio con el id - ${ id }`
            });
        };

      break;
  
    default:
      return res.status(500).json({ msg: 'Se me olvido validar esto' });
  }

  // Enviar imágenes
  if ( modelo.img ) {
    // Hay que enviar la imagen del servidor
    const pathImagen = path.join(__dirname, '../uploads/', coleccion, modelo.img);

    if ( fs.existsSync( pathImagen ) ) {
      return res.sendFile( pathImagen );
    };
  }
  const pathImagenDefault = path.join(__dirname, '../public/assets/no-image.jpg');

  res.sendFile( pathImagenDefault );
}



module.exports = {
    cargarArchivo,
    actualizarImagen,
    mostrarImagen
}