'use strict';
const { Router } = require('express');
const { Op } = require('sequelize');
const Asiento     = require('../models/asiento');
const Sector      = require('../models/sector');
const Entrada     = require('../models/entrada');
const Partido     = require('../models/partido');

const router = Router();

router.get('/', (req, res) => {
    res.json({
        nombre: 'Estadio Municipal El Mirador',
        ciudad: 'Algeciras',
        provincia: 'Cádiz',
        capacidad: 8500,
        inauguracion: 1967,
        direccion: 'Calle El Mirador, s/n, Algeciras, Cádiz',
        coordenadas: { lat: 36.1271, lng: -5.4536 },
        cesped: 'Natural',
        iluminacion: true,
        temporada: process.env.TEMPORADA || '2025/2026',
        competicion: 'Primera RFEF · Grupo 2',
        fundacion_club: 1912,
        colores: ['Rojo', 'Blanco'],
        imagen: 'https://backend-algeciras.hawkins.es/acf/2025/10/Diseno-sin-titulo-94.png',
    });
});

/**
 * GET /api/estadio/disponibilidad/:partidoId
 * Público — no auth. Muestra disponibilidad por sector sin datos sensibles.
 */
router.get('/disponibilidad/:partidoId', async (req, res) => {
    const partidoId = parseInt(req.params.partidoId);
    if (isNaN(partidoId)) {
        return res.status(400).json({ ok: false, msg: 'partidoId inválido' });
    }

    try {
        const partido = await Partido.findByPk(partidoId, {
            attributes: ['id', 'equipoLocal', 'equipoVisitante', 'fecha', 'hora']
        });
        if (!partido) return res.status(404).json({ ok: false, msg: 'Partido no encontrado' });

        // Todos los asientos con sector
        const asientos = await Asiento.findAll({
            include: [{ model: Sector, attributes: ['id', 'nombre'], required: true }]
        });

        // Asientos ocupados por entradas activas para este partido
        const entradasActivas = await Entrada.findAll({
            where: {
                partidoId,
                estado: { [Op.in]: ['pendiente', 'valida', 'usada'] }
            },
            attributes: ['asientoId']
        });
        const ocupadosSet = new Set(entradasActivas.map(e => e.asientoId));

        // Abonos activos
        const Abono = require('../models/abono');
        const abonosActivos = await Abono.findAll({
            where: { activo: true },
            attributes: ['asientoId']
        });
        const abonadosSet = new Set(abonosActivos.map(a => a.asientoId));

        // Agrupar por sector
        const sectoresMap = {};
        for (const asiento of asientos) {
            const sId   = asiento.Sector.id;
            const sNom  = asiento.Sector.nombre;
            if (!sectoresMap[sId]) {
                sectoresMap[sId] = { sector: sNom, total: 0, libres: 0, ocupados: 0 };
            }
            sectoresMap[sId].total++;
            if (ocupadosSet.has(asiento.id) || abonadosSet.has(asiento.id)) {
                sectoresMap[sId].ocupados++;
            } else {
                sectoresMap[sId].libres++;
            }
        }

        const sectores = Object.values(sectoresMap).map(s => ({
            sector:      s.sector,
            total:       s.total,
            libres:      s.libres,
            ocupados:    s.ocupados,
            porcentaje:  s.total > 0 ? Math.round((s.ocupados / s.total) * 100) : 0
        }));

        return res.json({
            ok: true,
            partido: `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
            fecha:   partido.fecha,
            hora:    partido.hora,
            sectores
        });
    } catch (e) {
        console.error('[estadio/disponibilidad] Error:', e.message);
        return res.status(500).json({ ok: false, msg: 'Error al obtener disponibilidad' });
    }
});

module.exports = router;
