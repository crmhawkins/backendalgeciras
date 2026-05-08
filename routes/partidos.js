const { Router } = require('express');
const { check, param, validationResult } = require('express-validator');
const { partidoGet, partidoPost, eventosGet, partidoGetById } = require('../controllers/partidos');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { esAdmin } = require('../middlewares/es-admin');

const router = Router();

const validarId = [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un entero positivo'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ ok: false, msg: errors.array()[0].msg });
    next();
  }
];

/**
 * @swagger
 * tags:
 *   name: Partidos
 *   description: Calendario y detalle de partidos
 */

/**
 * @swagger
 * /api/partidos:
 *   get:
 *     summary: Listar todos los partidos
 *     tags: [Partidos]
 *     responses:
 *       200:
 *         description: Lista de partidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:       { type: boolean }
 *                 partidos: { type: array, items: { type: object } }
 */

/**
 * @swagger
 * /api/partidos/{id}:
 *   get:
 *     summary: Detalle de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del partido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:      { type: boolean }
 *                 partido: { type: object }
 *       404:
 *         description: Partido no encontrado
 */

router.get('/', partidoGet);

router.get('/eventos/:id', validarId, eventosGet);

router.get('/:id', validarId, partidoGetById);

router.post('/create', [
    validarJWT,
    esAdmin,
    check('fecha', 'La fecha es obligatoria').isDate(),
    check('hora', 'La hora es obligatoria').not().isEmpty(),
    check('equipoLocal', 'El equipo local es obligatorio').not().isEmpty(),
    check('equipoVisitante', 'El equipo visitante es obligatorio').not().isEmpty(),
    validarCampos
], partidoPost);


module.exports = router;