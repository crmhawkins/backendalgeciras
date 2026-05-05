const { Router } = require('express');
const { getVotos, getMiVoto, votar } = require('../controllers/fanzone');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/:partidoId/votos', getVotos);
router.get('/:partidoId/mi-voto', validarJWT, getMiVoto);
router.post('/:partidoId/votar', validarJWT, votar);

module.exports = router;
