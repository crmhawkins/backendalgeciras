const { Router } = require('express');
const { getPlantilla, getJugador } = require('../controllers/jugadores');

const router = Router();

router.get('/', getPlantilla);
router.get('/:id', getJugador);

module.exports = router;
