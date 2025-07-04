/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const  Anuncio = require('../models/anuncio');

const existeAnuncioPorId = async( id ) => {
    const existeAnuncio = await Anuncio.findById(id);
    if ( !existeAnuncio ) {
        throw new Error(`El ${id} no pertenece a ningun anuncio`);
    }
};

const coleccionesPermitidas = async(coleccion = '', colecciones = []) =>{

    const incluida = colecciones.includes( coleccion );

    if (!incluida) {
        throw new Error(`La coleccion ${ coleccion } no es permitida, ${ colecciones }`);
    }

    return true;
}



module.exports = {
    existeAnuncioPorId,
    coleccionesPermitidas
}