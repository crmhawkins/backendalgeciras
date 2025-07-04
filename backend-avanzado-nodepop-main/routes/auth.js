/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const { Router } = require('express');
const { check } = require('express-validator');

const Usuario = require('../models/usuario');
const { authenticatePost } = require('../controllers/auth');
const { validarCampos } = require('../middlewares/validar-campos');
    
const router = Router();


router.post('/',[
    check('email', 'El email es obligatorio').not().isEmpty(),
    check('email', 'El email no es valido').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarCampos
],authenticatePost);


module.exports = router;