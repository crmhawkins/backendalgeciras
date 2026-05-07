const { Router } = require('express');
const { check } = require('express-validator');
const { gradaGet, gradaPost } = require('../controllers/gradas');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { esAdmin } = require('../middlewares/es-admin');

const router = Router();

router.get('/', gradaGet);

router.post('/create', validarJWT, esAdmin, [
    check('nombre', 'El nombre de la grada es obligatorio').not().isEmpty(),
    validarCampos
], gradaPost);

module.exports = router;
