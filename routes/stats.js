'use strict';

const { Router } = require('express');
const { Op, fn, col, literal } = require('sequelize');
const crypto = require('crypto');
const Partido     = require('../models/partido');
const Jugador     = require('../models/jugador');
const Abono       = require('../models/abono');
const Noticia     = require('../models/noticia');
const PagoSession = require('../models/pagoSession');
const Entrada     = require('../models/entrada');

const router = Router();

// ─── Basic Auth ───────────────────────────────────────────────────────────────
function basicAuth(req, res, next) {
    const adminUser = process.env.INTERNO_USER || 'admin';
    const adminPass = process.env.INTERNO_PASS;
    if (!adminPass) return res.status(503).json({ ok: false, msg: 'Panel interno no configurado' });

    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Basic ')) return res.status(401).json({ ok: false, msg: 'Autenticación requerida' });

    let decoded;
    try { decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8'); }
    catch { return res.status(401).json({ ok: false, msg: 'Credenciales inválidas' }); }

    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return res.status(401).json({ ok: false, msg: 'Credenciales inválidas' });

    const user = decoded.slice(0, colonIdx);
    const pass = decoded.slice(colonIdx + 1);

    try {
        const pu = Buffer.from(user, 'utf8'), eu = Buffer.from(adminUser, 'utf8');
        const pp = Buffer.from(pass, 'utf8'), ep = Buffer.from(adminPass, 'utf8');
        const uMatch = pu.length === eu.length && crypto.timingSafeEqual(pu, eu);
        const pMatch = pp.length === ep.length && crypto.timingSafeEqual(pp, ep);
        if (uMatch && pMatch) return next();
    } catch { /* fall through */ }

    return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
}

// ─── GET /api/stats/ — resumen público ───────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const [totalPartidos, totalJugadores, totalAbonados, totalNoticias] = await Promise.all([
            Partido.count(),
            Jugador.count(),
            Abono.count({ where: { activo: true } }),
            Noticia.count({ where: { activo: true } }),
        ]);

        res.json({
            ok: true,
            stats: {
                partidos:  totalPartidos,
                jugadores: totalJugadores,
                abonados:  totalAbonados,
                noticias:  totalNoticias,
                temporada: process.env.TEMPORADA || '2025/2026',
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, msg: 'Error al obtener estadísticas' });
    }
});

// ─── GET /api/interno/stats/ingresos — Basic Auth ────────────────────────────
router.get('/interno/ingresos', basicAuth, async (req, res) => {
    try {
        const hace30 = new Date();
        hace30.setDate(hace30.getDate() - 30);

        const [pagosCompletos, abonosMes, entradasMes, porDia] = await Promise.all([
            // Total mes completo
            PagoSession.sum('monto', {
                where: { estado: 'completado', createdAt: { [Op.gte]: hace30 } }
            }),
            // Total abonos
            PagoSession.sum('monto', {
                where: { estado: 'completado', tipo: 'abono', createdAt: { [Op.gte]: hace30 } }
            }),
            // Total entradas
            PagoSession.sum('monto', {
                where: { estado: 'completado', tipo: 'entrada', createdAt: { [Op.gte]: hace30 } }
            }),
            // Por día
            PagoSession.findAll({
                attributes: [
                    [fn('DATE', col('createdAt')), 'fecha'],
                    [fn('SUM', col('monto')), 'monto'],
                    [fn('COUNT', col('id')), 'cantidad']
                ],
                where: { estado: 'completado', createdAt: { [Op.gte]: hace30 } },
                group: [fn('DATE', col('createdAt'))],
                order: [[fn('DATE', col('createdAt')), 'ASC']],
                raw: true
            })
        ]);

        res.json({
            ok: true,
            total_mes:      parseFloat(pagosCompletos) || 0,
            total_abonos:   parseFloat(abonosMes)      || 0,
            total_entradas: parseFloat(entradasMes)    || 0,
            por_dia: porDia.map(d => ({
                fecha:    d.fecha,
                monto:    parseFloat(d.monto),
                cantidad: parseInt(d.cantidad)
            }))
        });
    } catch (err) {
        console.error('[stats/ingresos]', err);
        res.status(500).json({ ok: false, msg: 'Error al obtener ingresos' });
    }
});

// ─── GET /api/interno/stats/conversion — Basic Auth ──────────────────────────
router.get('/interno/conversion', basicAuth, async (req, res) => {
    try {
        const partidos = await Partido.findAll({ attributes: ['id', 'equipoLocal', 'equipoVisitante', 'fecha'] });

        const resultado = await Promise.all(partidos.map(async partido => {
            const [completados, pendientes, cancelados] = await Promise.all([
                PagoSession.count({ where: { estado: 'completado',  datosCompra: { [Op.like]: `%"partidoId":${partido.id}%` } } }),
                PagoSession.count({ where: { estado: 'pendiente',   datosCompra: { [Op.like]: `%"partidoId":${partido.id}%` } } }),
                PagoSession.count({ where: { estado: { [Op.in]: ['cancelado', 'expirado'] }, datosCompra: { [Op.like]: `%"partidoId":${partido.id}%` } } })
            ]);
            const total = completados + pendientes + cancelados;
            return {
                partido:         `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
                fecha:           partido.fecha,
                completados,
                pendientes,
                cancelados,
                tasa_conversion: total > 0 ? Math.round((completados / total) * 100) : 0
            };
        }));

        res.json({ ok: true, conversion: resultado });
    } catch (err) {
        console.error('[stats/conversion]', err);
        res.status(500).json({ ok: false, msg: 'Error al obtener conversión' });
    }
});

// ─── GET /api/interno/stats/asistencia/:partidoId — Basic Auth ───────────────
router.get('/interno/asistencia/:partidoId', basicAuth, async (req, res) => {
    const partidoId = parseInt(req.params.partidoId);
    if (isNaN(partidoId)) return res.status(400).json({ ok: false, msg: 'partidoId inválido' });

    try {
        const partido = await Partido.findByPk(partidoId, {
            attributes: ['id', 'equipoLocal', 'equipoVisitante', 'fecha']
        });
        if (!partido) return res.status(404).json({ ok: false, msg: 'Partido no encontrado' });

        const [vendidas, usadas] = await Promise.all([
            Entrada.count({ where: { partidoId, estado: { [Op.in]: ['valida', 'usada'] } } }),
            Entrada.count({ where: { partidoId, estado: 'usada' } })
        ]);

        res.json({
            ok: true,
            partido:               `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
            fecha:                 partido.fecha,
            vendidas,
            usadas,
            no_presentados:        vendidas - usadas,
            porcentaje_asistencia: vendidas > 0 ? Math.round((usadas / vendidas) * 100) : 0
        });
    } catch (err) {
        console.error('[stats/asistencia]', err);
        res.status(500).json({ ok: false, msg: 'Error al obtener asistencia' });
    }
});

module.exports = router;
