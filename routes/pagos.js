const { Router } = require('express');
const { check } = require('express-validator');
const {
    crearSesionPagoEntrada,
    crearSesionPagoAbono,
    confirmarPago,
    webhookStripe,
    crearSesionPagoUnificada,
    estadoPago,
    paginaPagoExitoso,
    paginaPagoCancelado
} = require('../controllers/pagos');
const { aplicarCodigo } = require('../controllers/codigos');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWTOpcional } = require('../middlewares/validar-jwt-opcional');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Sesiones de pago con Stripe
 */

/**
 * @swagger
 * /api/pagos/create-checkout:
 *   post:
 *     summary: Crear sesión de pago unificada (app móvil)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [asientoId, dni]
 *             properties:
 *               asientoId: { type: integer, example: 42 }
 *               dni:       { type: string,  example: '12345678A' }
 *     responses:
 *       200:
 *         description: URL de checkout Stripe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:  { type: boolean }
 *                 url: { type: string, format: uri }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/pagos/status:
 *   get:
 *     summary: Estado de pago por session_id (para verificar tras browser)
 *     tags: [Pagos]
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Estado del pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:     { type: boolean }
 *                 status: { type: string, example: paid }
 *       400:
 *         description: session_id requerido
 */

// Router para webhook (el middleware raw se aplica en server.js antes de express.json())
const webhookRouter = Router();
webhookRouter.post('/webhook', webhookStripe);

// Ruta para crear sesión de pago de entrada
router.post('/entrada', [
    check('asientoId', 'El asiento es obligatorio y numérico').isInt(),
    check('precio', 'El precio debe ser numérico').isNumeric(),
    check('partidoId', 'El ID del partido es obligatorio y numérico').isInt(),
    check('email', 'Email inválido').isEmail(),
    check('nombre', 'El nombre es obligatorio').notEmpty(),
    check('apellidos', 'Los apellidos son obligatorios').notEmpty(),
    check('dni', 'El DNI no es válido').matches(/^[0-9]{8}[A-Z]$/),
    check('telefono', 'Teléfono inválido').matches(/^\+?\d{9,15}$/),
    check('fechaNacimiento', 'Fecha de nacimiento inválida').isDate(),
    check('genero', 'El género es obligatorio').isIn(['masculino', 'femenino']),
    check('pais').notEmpty(),
    check('provincia').notEmpty(),
    check('localidad').notEmpty(),
    check('domicilio').notEmpty(),
    check('codigoPostal').notEmpty(),
    validarCampos
], crearSesionPagoEntrada);

// Ruta para crear sesión de pago de abono
router.post('/abono', [
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
], crearSesionPagoAbono);

// Ruta para confirmar pago después de Stripe Checkout
router.get('/confirmar', [
    check('session_id', 'El session_id es requerido').notEmpty(),
    validarCampos
], confirmarPago);

// Ruta unificada para la app móvil
router.post('/create-checkout', [
    check('asientoId', 'El asiento es obligatorio').isInt(),
    check('dni', 'El DNI es obligatorio').notEmpty(),
    validarCampos
], crearSesionPagoUnificada);

// Aplicar código de descuento (requiere JWT)
router.post('/aplicar-codigo', validarJWT, [
    check('codigo', 'codigo es obligatorio').notEmpty(),
    check('tipo', 'tipo debe ser abono o entrada').isIn(['abono', 'entrada']),
    check('monto', 'monto debe ser numérico').isNumeric(),
    validarCampos
], aplicarCodigo);

// Estado de pago (para que la app verifique tras el browser)
router.get('/status', estadoPago);

// Páginas de resultado de Stripe
router.get('/pago-exitoso', paginaPagoExitoso);
router.get('/pago-cancelado', paginaPagoCancelado);

module.exports = { router, webhookRouter };
