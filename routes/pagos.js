const { Router } = require('express');
const { check } = require('express-validator');
const { 
    crearSesionPagoEntrada, 
    crearSesionPagoAbono, 
    confirmarPago,
    webhookStripe 
} = require('../controllers/pagos');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

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

module.exports = { router, webhookRouter };
