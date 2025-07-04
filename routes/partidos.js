const { Router } = require('express');
const { check } = require('express-validator');
const { partidoGet, partidoPost, eventosGet } = require('../controllers/partidos');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/', partidoGet);

router.post('/create', [
    check('fecha', 'La fecha es obligatoria').isDate(),
    check('hora', 'La hora es obligatoria').not().isEmpty(),
    check('equipoLocal', 'El equipo local es obligatorio').not().isEmpty(),
    check('equipoVisitante', 'El equipo visitante es obligatorio').not().isEmpty(),
    validarCampos
], partidoPost);

router.get('/eventos/:id', eventosGet);


module.exports = router;