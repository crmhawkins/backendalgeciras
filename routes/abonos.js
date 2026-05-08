const { Router } = require('express');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { abonoGet, abonoPost, renovarAbono, getAbonosPorUsuario, liberarAsiento, cancelarLiberacionAsiento  } = require('../controllers/abonos');
const { validarCampos } = require('../middlewares/validar-campos');
const {validarJWT} = require('../middlewares/validar-jwt');
const { esAdmin } = require('../middlewares/es-admin');

const renovarAbonoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { msg: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Abonos
 *   description: Gestión de abonados
 */

/**
 * @swagger
 * /api/abonos/usuario/{id}:
 *   get:
 *     summary: Listar abonos de un usuario
 *     tags: [Abonos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de abonos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:     { type: boolean }
 *                 abonos: { type: array, items: { type: object } }
 *       401:
 *         description: Token requerido
 */

/**
 * @swagger
 * /api/abonos/renovar:
 *   post:
 *     summary: Renovar abono existente
 *     tags: [Abonos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dni, codigo]
 *             properties:
 *               dni:    { type: string, example: '12345678A' }
 *               codigo: { type: integer, example: 1001 }
 *     responses:
 *       200:
 *         description: URL de checkout para renovación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:  { type: boolean }
 *                 url: { type: string, format: uri }
 *       400:
 *         description: Datos inválidos o abono no encontrado
 */

router.get('/', validarJWT, esAdmin, abonoGet);

router.get('/usuario/:id', validarJWT, getAbonosPorUsuario);

router.post('/create', validarJWT, esAdmin, [
    check('fechaInicio').isISO8601().withMessage('Fecha de inicio inválida'),
    check('fechaFin').isISO8601().withMessage('Fecha de fin inválida'),

    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('apellidos', 'Los apellidos son obligatorios').not().isEmpty(),
    check('genero', 'El género es obligatorio').isIn(['masculino', 'femenino']),
    check('dni', 'El DNI no es válido').matches(/^[0-9]{8}[A-Z]$/),
    check('fechaNacimiento', 'Fecha de nacimiento inválida').isDate(),

    check('email', 'Email inválido').isEmail(),
    check('telefono', 'Teléfono inválido').matches(/^\+?\d{9,15}$/),
    check('pais', 'El país es obligatorio').not().isEmpty(),
    check('provincia', 'La provincia es obligatoria').not().isEmpty(),
    check('localidad', 'La localidad es obligatoria').not().isEmpty(),
    check('domicilio', 'El domicilio es obligatorio').not().isEmpty(),
    check('codigoPostal', 'Código postal obligatorio').not().isEmpty(),

    check('asientoId', 'El ID del asiento es obligatorio y numérico').isInt(),

    validarCampos
], abonoPost);

router.post('/liberar', validarJWT, liberarAsiento);

router.post('/renovar', renovarAbonoLimiter, validarJWT, [
    check('dni', 'El DNI es obligatorio').not().isEmpty(),
    check('codigo', 'El código de abonado debe ser un número').isInt(),
    validarCampos
], renovarAbono);

router.post('/cancelar-liberacion', validarJWT, cancelarLiberacionAsiento);

module.exports = router;

