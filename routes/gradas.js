const { Router } = require('express');
const { check } = require('express-validator');
const { gradaGet, gradaPost } = require('../controllers/gradas');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/', gradaGet);

router.post('/create', [
    check('nombre', 'El nombre de la grada es obligatorio').not().isEmpty(),
    validarCampos
], gradaPost);

module.exports = router;
