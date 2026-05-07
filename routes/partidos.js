const { Router } = require('express');
const { check } = require('express-validator');
const { partidoGet, partidoPost, eventosGet, partidoGetById } = require('../controllers/partidos');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', partidoGet);

router.get('/eventos/:id', eventosGet);

router.get('/:id', partidoGetById);

router.post('/create', [
    validarJWT,
    check('fecha', 'La fecha es obligatoria').isDate(),
    check('hora', 'La hora es obligatoria').not().isEmpty(),
    check('equipoLocal', 'El equipo local es obligatorio').not().isEmpty(),
    check('equipoVisitante', 'El equipo visitante es obligatorio').not().isEmpty(),
    validarCampos
], partidoPost);


module.exports = router;