const { Router } = require('express');

const { getClasificacion } = require('../controllers/clasificacion');

const router= Router();

router.get('/', getClasificacion);

module.exports = router;
