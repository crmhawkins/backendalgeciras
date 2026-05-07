const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { getVotos, getMiVoto, votar } = require('../controllers/fanzone');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

const votarLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.uid || req.ip,
  message: { ok: false, msg: 'Demasiados votos. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:partidoId/votos', getVotos);
router.get('/:partidoId/mi-voto', validarJWT, getMiVoto);
router.post('/:partidoId/votar', validarJWT, votarLimiter, votar);

module.exports = router;
