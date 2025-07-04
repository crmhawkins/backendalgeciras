/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const { Router } = require('express');
const { check } = require('express-validator');

const Usuario = require('../models/usuario');
const { usuarioGet, usuarioPost } = require('../controllers/usuarios');

const { validarCampos } = require('../middlewares/validar-campos');
    
const router = Router();


router.get('/', usuarioGet);

router.get('/:id', usuarioGet);

router.put('/:id', usuarioGet);

router.post('/create',[
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es valido').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    check('password', 'El password debe de ser de mas 6 de letras').isLength({ min: 6 }),
    check('rol', 'No es un rol permitido').isIn(['ADMIN_ROLE', 'USER_ROLE']),
    validarCampos
], usuarioPost);

router.patch('/', usuarioGet);

router.delete('/:id', usuarioGet);

 router.post('/upload', usuarioGet);



module.exports = router;