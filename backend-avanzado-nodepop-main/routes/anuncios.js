/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const { Router } = require('express');
const { check } = require('express-validator');

const Anuncio = require('../models/anuncio');

const { anunciosGet,
    anunciosPost,
    anunciosPut,
    anunciosPatch,
    anunciosDelete,
    anunciosGetId
                    } = require('../controllers/anuncios');
const { cargarArchivo } = require('../controllers/uploads');

const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { existeAnuncioPorId } = require('../helpers/db-validators');
    
const router = Router();


router.get('/',[
    validarJWT
], anunciosGet);

router.get('/:id',[
    check('id', 'No es un id de Mongo válido').isMongoId(),
    check('id').custom( existeAnuncioPorId ),
    validarCampos
], anunciosGetId);

router.put('/:id',[
    check('id', 'No es un id de Mongo válido').isMongoId(),
    check('id').custom( existeAnuncioPorId ),
    validarCampos
], anunciosPut );

router.post('/', [
    check('nombre', 'El nombre del anuncio no es válido').not().isEmpty().trim().escape(),
    check('venta', 'La opción de venta no es válida').toBoolean(),
    check('precio', 'El precio no es válido').isNumeric(),
    validarCampos
], anunciosPost );

router.patch('/', anunciosPatch );

router.delete('/:id',[ 
    check('id', 'No es un id de Mongo válido').isMongoId(),
    check('id').custom( existeAnuncioPorId ),
    validarCampos
 ], anunciosDelete );

 router.post('/upload', cargarArchivo );



module.exports = router;