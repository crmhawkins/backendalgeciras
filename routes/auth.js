const { Router } = require('express');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticatePost, enviarRecuperacion, resetPassword, authenticateGoogleUser,logInWordpress } = require('../controllers/auth');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Demasiados intentos de recuperación. Intenta de nuevo en 1 hora.' }
});

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */

/**
 * @swagger
 * /api/authenticate/login:
 *   post:
 *     summary: Login usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: usuario@algecirascf.es }
 *               password: { type: string, example: miPassword123 }
 *     responses:
 *       200:
 *         description: Token JWT generado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthToken'
 *       400:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
], authenticatePost);

/**
 * @swagger
 * /api/authenticate/recuperar-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Email de recuperación enviado
 *       400:
 *         description: Email inválido
 */
router.post('/recuperar-password', resetPasswordLimiter, [
    check('email', 'Email no válido').isEmail(),
    validarCampos
], enviarRecuperacion);

router.post('/reset-password/:token', resetPasswordLimiter, [
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
