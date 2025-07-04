/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const { Router } = require('express');
const { check } = require('express-validator');

const { cargarArchivo, actualizarImagen, mostrarImagen } = require('../controllers/uploads');
const { coleccionesPermitidas } = require('../helpers/db-validators');
const { validarArchivoSubir } = require('../middlewares/validar-archivo');
const { validarCampos } = require('../middlewares/validar-campos');
    
const router = Router();



 router.post('/', validarArchivoSubir, cargarArchivo );

 router.put('/:coleccion/:id', [
    validarArchivoSubir,
    check('id', 'El id debe ser de mongo').isMongoId(),
    check('coleccion').custom( c => coleccionesPermitidas ( c, ['anuncios'] ) ),
    validarCampos
 ], actualizarImagen );

 router.get('/:coleccion/:id', [
    check('id', 'El id debe ser de mongo').isMongoId(),
    check('coleccion').custom( c => coleccionesPermitidas ( c, ['anuncios'] ) ),
    validarCampos
 ], mostrarImagen );


module.exports = router;