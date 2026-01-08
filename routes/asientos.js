const { Router } = require('express');
const { check } = require('express-validator');
const { asientoGet, asientoPost } = require('../controllers/asientos');
const { validarCampos } = require('../middlewares/validar-campos');
const Entrada = require('../models/entrada');
const Abono = require('../models/abono');
const Partido = require('../models/partido');

const router = Router();
const Asiento = require('../models/asiento');

router.get('/sector/:id', async (req, res) => {
    const { id } = req.params;
    const { partidoId } = req.query;
    const { Op } = require("sequelize");

    try {
        const asientos = await Asiento.findAll({
            where: { sectorId: id }
        });

        let entradas = [];
        if (partidoId === "proximos") {
            const hoy = new Date();
            // Primero obtener los partidos futuros
            const partidosFuturos = await Partido.findAll({
                where: {
                    fecha: { [Op.gte]: hoy }
                }
            });
            const partidosIds = partidosFuturos.map(p => p.id);
            // Luego obtener las entradas para esos partidos
            if (partidosIds.length > 0) {
                entradas = await Entrada.findAll({
                    where: {
                        partidoId: { [Op.in]: partidosIds }
                    }
                });
            }
        } else if (partidoId) {
            entradas = await Entrada.findAll({ where: { partidoId } });
        }

        const abonos = await Abono.findAll({
            where: {
                asientoId: asientos.map(a => a.id),
                activo: true
            }
        });

        const resultado = asientos.map(asiento => {
            let estado = asiento.estado;
            let ocupadoReal = false;

            const entrada = entradas.find(e => e.asientoId === asiento.id);
            const abono = abonos.find(a => a.asientoId === asiento.id);

            if (entrada) {
                if (entrada.usuarioId === 1) {
                    estado = 'liberado';
                } else {
                    estado = 'ocupado';
                    ocupadoReal = true;
                }
            } else if (abono) {
                estado = 'ocupado';
            }

            return {
                ...asiento.dataValues,
                estado,
                ocupadoReal
            };
});



        res.json({ asientos: resultado });
    } catch (error) {
        console.error('Error al obtener los asientos del sector:', error);
        res.status(500).json({ 
            msg: 'Error al obtener los asientos del sector',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/', [
    check('id', 'El ID debe ser un número').isInt(),
    validarCampos
], asientoGet);

router.post('/create', [
    check('numero', 'El número de asiento es obligatorio').not().isEmpty(),
    check('sectorId', 'El ID del sector es obligatorio y numérico').isInt(),
    check('partidoId', 'El ID del partido es obligatorio y numérico').isInt(),
    validarCampos
], asientoPost);

module.exports = router;

