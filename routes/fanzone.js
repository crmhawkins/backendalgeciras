const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { getVotos, getMiVoto, votar } = require('../controllers/fanzone');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Fanzone
 *   description: Votaciones de aficionados por partido
 */

/**
 * @swagger
 * /api/fanzone/{partidoId}/votos:
 *   get:
 *     summary: Obtener votos del partido
 *     tags: [Fanzone]
 *     parameters:
 *       - in: path
 *         name: partidoId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Resultados de votación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:    { type: boolean }
 *                 votos: { type: array, items: { type: object } }
 */

/**
 * @swagger
 * /api/fanzone/{partidoId}/votar:
 *   post:
 *     summary: Votar al mejor jugador del partido
 *     tags: [Fanzone]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partidoId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jugadorId]
 *             properties:
 *               jugadorId: { type: integer, example: 7 }
 *     responses:
 *       200:
 *         description: Voto registrado
 *       401:
 *         description: Token requerido
 *       429:
 *         description: Demasiados votos
 */

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
