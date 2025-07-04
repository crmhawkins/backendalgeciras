const { Router } = require('express');
const { check } = require('express-validator');
const { authenticatePost, enviarRecuperacion, resetPassword, authenticateGoogleUser,logInWordpress } = require('../controllers/auth');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post('/login', [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
], authenticatePost);

router.post('/recuperar-password', [
    check('email', 'Email no válido').isEmail(),
    validarCampos
], enviarRecuperacion);

router.post('/reset-password/:token', [
    check('password', 'La nueva contraseña es obligatoria').isLength({ min: 6 }),
    validarCampos
], resetPassword);

router.post('/googleUser', [
    validarJWT
], authenticateGoogleUser);

router.get('/log_in_wordpress',[
    validarJWT,
], logInWordpress);


module.exports = router;
