const { Router } = require('express');
const { check } = require('express-validator');
const { entradaGet, entradaPost, buscarEntradaLiberada, generarPDFEntrada } = require('../controllers/entradas');
const { validarCampos } = require('../middlewares/validar-campos');
const Entrada = require('../models/entrada');
const Usuario = require('../models/usuario');
const Partido = require('../models/partido');
const Sector = require('../models/sector');
const Asiento = require('../models/asiento');

const router = Router();

router.get('/', [
  check('id', 'El ID debe ser un número').isInt(),
  validarCampos
], entradaGet);

router.post('/create', [
  check('asientoId', 'El asiento es obligatorio y numérico').isInt(),
  check('precio', 'El precio debe ser numérico').isNumeric(),
  check('partidoId', 'El ID del partido es obligatorio y numérico').isInt(),
  check('email', 'Email inválido').isEmail(),
  check('nombre', 'El nombre es obligatorio').notEmpty(),
  check('apellidos', 'Los apellidos son obligatorios').notEmpty(),
  check('dni', 'El DNI no es válido').matches(/^[0-9]{8}[A-Z]$/),
  check('telefono', 'Teléfono inválido').matches(/^\+?\d{9,15}$/),
  check('fechaNacimiento', 'Fecha de nacimiento inválida').isDate(),
  check('genero', 'El género es obligatorio').isIn(['masculino', 'femenino']),
  check('pais').notEmpty(),
  check('provincia').notEmpty(),
  check('localidad').notEmpty(),
  check('domicilio').notEmpty(),
  check('codigoPostal').notEmpty(),
  validarCampos
], entradaPost);

router.get('/usuario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const entradas = await Entrada.findAll({
      where: { usuarioId: id },
      include: [
        Partido,
        {
          model: Asiento,
          include: [{ model: Sector, attributes: ['nombre'] }]
        }
      ]
    });

    res.json({ entradas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener las entradas del usuario' });
  }
});

router.get('/buscar-liberada', [
  check('asientoId', 'El asientoId es obligatorio y numérico').isInt(),
  check('partidoId', 'El partidoId es obligatorio y numérico').isInt(),
  validarCampos
], async (req, res) => {
  const { asientoId, partidoId } = req.query;

  try {
    const entrada = await Entrada.findOne({
      where: { asientoId, partidoId }
    });

    if (!entrada) {
      return res.json({ entrada: null });
    }

    res.json({ entrada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al buscar la entrada liberada' });
  }
});

// Ruta para generar PDF de entrada con QR
router.get('/pdf/:entradaId', generarPDFEntrada);

module.exports = router;

