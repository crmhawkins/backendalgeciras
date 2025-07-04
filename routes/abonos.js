const { Router } = require('express');
const { check } = require('express-validator');
const { abonoGet, abonoPost, renovarAbono, getAbonosPorUsuario, liberarAsiento, cancelarLiberacionAsiento  } = require('../controllers/abonos');
const { validarCampos } = require('../middlewares/validar-campos');
const {validarJWT} = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', abonoGet);

router.get('/usuario/:id',validarJWT, getAbonosPorUsuario);

router.post('/create', [
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

router.post('/liberar', liberarAsiento);

router.post('/renovar', [
    check('dni', 'El DNI es obligatorio').not().isEmpty(),
    check('codigo', 'El código de abonado debe ser un número').isInt(),
    validarCampos
], renovarAbono);

router.post('/cancelar-liberacion', cancelarLiberacionAsiento);

module.exports = router;

