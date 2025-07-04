const { Router } = require('express');
const { check } = require('express-validator');
const { usuarioGet, usuarioPost, showUserImage, updateUserImage,showMyUserImage } = require('../controllers/usuarios');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const {upload} = require('../middlewares/subir-archivo');



const router = Router();

router.get('/', [
    validarJWT
], usuarioGet);

router.post('/create', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validarCampos
], usuarioPost);

router.post('/create-pagina', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('dni', 'El DNI es obligatorio').not().isEmpty(),
    validarCampos
], usuarioPost);

router.put('/profile-image', [
    validarJWT,
    upload.single('imagen') 
], updateUserImage);

router.get('/profile-image-view/:filename', validarJWT, showUserImage);

router.get('/profile-image-get', validarJWT, showMyUserImage);

module.exports = router;
