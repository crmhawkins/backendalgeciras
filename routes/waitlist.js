const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { unirseWaitlist, salirWaitlist, misWaitlists } = require('../controllers/waitlist');

const router = Router();

// POST /api/waitlist — unirse
router.post('/', validarJWT, [
    check('asientoId', 'asientoId es obligatorio y numérico').isInt(),
    validarCampos
], unirseWaitlist);

// DELETE /api/waitlist/:asientoId — salir
router.delete('/:asientoId', validarJWT, salirWaitlist);

// GET /api/waitlist — mis waitlists
router.get('/', validarJWT, misWaitlists);

module.exports = router;
