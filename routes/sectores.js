const { Router } = require('express');
const { check } = require('express-validator');
const { sectorGet, sectorPost } = require('../controllers/sectores');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/', sectorGet);


module.exports = router;
