const { Router } = require('express');
const { check } = require('express-validator');
const { usuarioGet, usuarioPost, cambiarPassword, showUserImage, updateUserImage, showMyUserImage } = require('../controllers/usuarios');
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

router.put('/change-password', [
    validarJWT,
    check('passwordActual', 'La contraseña actual es obligatoria').not().isEmpty(),
    check('passwordNueva', 'La nueva contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validarCampos
], cambiarPassword);

router.put('/profile-image', [
    validarJWT,
    upload.single('imagen') 
], updateUserImage);

router.get('/profile-image-view/:filename', validarJWT, showUserImage);

router.get('/profile-image-get', validarJWT, showMyUserImage);

module.exports = router;
