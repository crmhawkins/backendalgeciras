const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { enviarPushMasivo, enviarPushUsuario } = require('../services/notificacionesService');
const Entrada = require('../models/entrada');
const Abono   = require('../models/abono');
const Asiento = require('../models/asiento');
const Partido = require('../models/partido');
const Sector  = require('../models/sector');
const Grada   = require('../models/grada');
const { enviarEmailEntrada } = require('../services/emailEntradaService');

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Middleware Basic Auth para rutas internas protegidas
function basicAuth(req, res, next) {
    const adminUser = process.env.INTERNO_USER || 'admin';
    const adminPass = process.env.INTERNO_PASS;

    if (!adminPass) {
        return res.status(503).json({ ok: false, msg: 'Panel interno no configurado' });
    }

    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Basic ')) {
        return res.status(401).json({ ok: false, msg: 'Autenticación requerida' });
    }

    let decoded;
    try {
        decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    } catch {
        return res.status(401).json({ ok: false, msg: 'Credenciales inválidas' });
    }

    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) {
        return res.status(401).json({ ok: false, msg: 'Credenciales inválidas' });
    }

    const user = decoded.slice(0, colonIdx);
    const pass = decoded.slice(colonIdx + 1);

    if (user === adminUser && pass === adminPass) {
        return next();
    }

    return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
}

router.post('/login', limiter, (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.INTERNO_USER || 'admin';
    const adminPass = process.env.INTERNO_PASS;

    if (!adminPass) {
        return res.status(503).json({ ok: false, msg: 'Panel interno no configurado' });
    }

    if (username === adminUser && password === adminPass) {
        return res.json({ ok: true });
    }

    return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
});

// POST /api/interno/push-todos — envía push a todos los usuarios con token
router.post('/push-todos', basicAuth, async (req, res) => {
    const { titulo, cuerpo, data } = req.body;

    if (!titulo || !cuerpo) {
        return res.status(400).json({ ok: false, msg: 'titulo y cuerpo son obligatorios' });
    }

    try {
        const resultado = await enviarPushMasivo(titulo, cuerpo, data || {});
        return res.json({ ok: true, ...resultado });
    } catch (e) {
        console.error('[interno] Error en push-todos:', e.message);
        return res.status(500).json({ ok: false, msg: 'Error interno al enviar notificaciones' });
    }
});

// POST /api/interno/push-usuario — envía push a un usuario específico
router.post('/push-usuario', basicAuth, async (req, res) => {
    const { userId, titulo, cuerpo, data } = req.body;

    if (!userId || !titulo || !cuerpo) {
        return res.status(400).json({ ok: false, msg: 'userId, titulo y cuerpo son obligatorios' });
    }

    try {
        const resultado = await enviarPushUsuario(Number(userId), titulo, cuerpo, data || {});
        return res.json({ ok: true, ...resultado });
    } catch (e) {
        console.error('[interno] Error en push-usuario:', e.message);
        return res.status(500).json({ ok: false, msg: 'Error interno al enviar notificación' });
    }
});

// ─────────────────────────────────────────────
// TAQUILLA — venta presencial de entradas/abonos
// ─────────────────────────────────────────────

/** Genera código de acceso único tipo ABCD-123456 */
function generarCodigoAcceso() {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${p1}-${p2}`;
}

/**
 * POST /api/interno/taquilla/entrada
 * Body: { partidoId, asientoId, nombre, email?, telefono?, dni?, metodoPago, precioManual? }
 */
router.post('/taquilla/entrada', basicAuth, async (req, res) => {
    const {
        partidoId, asientoId,
        nombre, email, telefono, dni,
        metodoPago, precioManual
    } = req.body;

    if (!partidoId || !asientoId || !nombre || !metodoPago) {
        return res.status(400).json({ ok: false, msg: 'partidoId, asientoId, nombre y metodoPago son obligatorios' });
    }

    try {
        // Verificar partido existe
        const partido = await Partido.findByPk(parseInt(partidoId));
        if (!partido) return res.status(404).json({ ok: false, msg: 'Partido no encontrado' });

        // Verificar asiento existe
        const asiento = await Asiento.findByPk(parseInt(asientoId), {
            include: [{ model: Sector, attributes: ['nombre', 'precio'], required: false }]
        });
        if (!asiento) return res.status(404).json({ ok: false, msg: 'Asiento no encontrado' });

        // Verificar no hay entrada activa para asiento+partido
        const entradaExistente = await Entrada.findOne({
            where: {
                asientoId: parseInt(asientoId),
                partidoId: parseInt(partidoId),
                estado: { [Op.in]: ['pendiente', 'valida'] }
            }
        });
        if (entradaExistente) {
            return res.status(409).json({ ok: false, msg: 'Asiento ya vendido para este partido' });
        }

        // Verificar no tiene abono activo
        const abonoExistente = await Abono.findOne({
            where: { asientoId: parseInt(asientoId), activo: true }
        });
        if (abonoExistente) {
            return res.status(409).json({ ok: false, msg: 'Asiento tiene abono activo — no se puede vender entrada' });
        }

        // Precio: manual o del sector
        const precio = precioManual !== undefined
            ? parseFloat(precioManual)
            : parseFloat(asiento.Sector?.precio || 0);

        const codigoAcceso = generarCodigoAcceso();
        const qrCode       = generarCodigoAcceso(); // código interno distinto

        const entrada = await Entrada.create({
            token:        codigoAcceso,
            qrCode,
            codigoAcceso,
            precio,
            usuarioId:    1, // taquilla presencial
            partidoId:    parseInt(partidoId),
            asientoId:    parseInt(asientoId),
            estado:       'valida',
            tipo:         'taquilla',
            metodoPago:   metodoPago || 'efectivo',
            enviadoEmail: false
        });

        // Marcar asiento como ocupado
        await asiento.update({ estado: 'ocupado', partidoId: parseInt(partidoId) });

        console.log(`[taquilla/entrada] Vendida: ${codigoAcceso} | Partido ${partidoId} | Asiento ${asientoId} | ${nombre}`);

        // Enviar email si se proporcionó
        if (email) {
            const usuarioObj = { nombre, email };
            enviarEmailEntrada(entrada, partido, asiento, usuarioObj).catch(err =>
                console.error('[taquilla/entrada] Email falló:', err.message)
            );
        }

        return res.json({
            ok: true,
            entradaId:    entrada.id,
            codigoAcceso,
            qrCode,
            precio,
            partido:      `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
            asientoInfo:  `Sector ${asiento.Sector?.nombre || 'N/A'} - Fila ${asiento.fila} - Asiento ${asiento.numero}`
        });

    } catch (e) {
        console.error('[taquilla/entrada] Error:', e.message);
        return res.status(500).json({ ok: false, msg: 'Error interno al registrar la venta' });
    }
});

/**
 * POST /api/interno/taquilla/abono
 * Body: { asientoId, nombre, email?, telefono?, dni?, metodoPago, precio }
 */
router.post('/taquilla/abono', basicAuth, async (req, res) => {
    const {
        asientoId,
        nombre, apellidos, email, telefono, dni,
        metodoPago, precio
    } = req.body;

    if (!asientoId || precio === undefined || !nombre || !metodoPago) {
        return res.status(400).json({ ok: false, msg: 'asientoId, precio, nombre y metodoPago son obligatorios' });
    }

    try {
        const asiento = await Asiento.findByPk(parseInt(asientoId), {
            include: [{ model: Sector, attributes: ['nombre'], required: false }]
        });
        if (!asiento) return res.status(404).json({ ok: false, msg: 'Asiento no encontrado' });

        const abonoExistente = await Abono.findOne({
            where: { asientoId: parseInt(asientoId), activo: true }
        });
        if (abonoExistente) {
            return res.status(409).json({ ok: false, msg: 'Asiento ya tiene abono activo' });
        }

        const codigoAcceso = generarCodigoAcceso();

        // Temporada actual — configurable via env vars
        const fechaInicio = new Date(process.env.TEMPORADA_INICIO || '2025-07-01');
        const fechaFin    = new Date(process.env.TEMPORADA_FIN    || '2026-06-30');

        const abono = await Abono.create({
            codigoAcceso,
            fechaInicio,
            fechaFin,
            activo:     true,
            nombre,
            apellidos:  apellidos  || '',
            dni:        dni        || null,
            email:      email      || null,
            telefono:   telefono   || null,
            pais:       'España',
            provincia:  'Cádiz',
            localidad:  'Algeciras',
            domicilio:  '',
            codigoPostal: '',
            usuarioId:  1,
            asientoId:  parseInt(asientoId),
            precio:     parseFloat(precio)
        });

        console.log(`[taquilla/abono] Vendido: ${codigoAcceso} | Asiento ${asientoId} | ${nombre} ${apellidos || ''}`);

        return res.json({
            ok: true,
            abonoId:      abono.id,
            codigoAcceso,
            asientoInfo:  `Sector ${asiento.Sector?.nombre || 'N/A'} - Fila ${asiento.fila} - Asiento ${asiento.numero}`,
            temporada:    '2025/26'
        });

    } catch (e) {
        console.error('[taquilla/abono] Error:', e.message);
        return res.status(500).json({ ok: false, msg: 'Error interno al registrar el abono' });
    }
});

/**
 * GET /api/interno/taquilla/disponibilidad/:partidoId
 * Devuelve mapa de asientos: libre / ocupado / abonado, agrupado por sector > fila
 */
router.get('/taquilla/disponibilidad/:partidoId', basicAuth, async (req, res) => {
    const { partidoId } = req.params;

    if (!partidoId || isNaN(parseInt(partidoId))) {
        return res.status(400).json({ ok: false, msg: 'partidoId inválido' });
    }

    try {
        const pId = parseInt(partidoId);

        // Verificar partido
        const partido = await Partido.findByPk(pId, {
            attributes: ['id', 'equipoLocal', 'equipoVisitante', 'fecha', 'hora']
        });
        if (!partido) return res.status(404).json({ ok: false, msg: 'Partido no encontrado' });

        // Todos los asientos con sector
        const asientos = await Asiento.findAll({
            include: [{
                model: Sector,
                attributes: ['id', 'nombre'],
                required: true
            }],
            order: [
                [Sector, 'nombre', 'ASC'],
                ['fila', 'ASC'],
                ['numero', 'ASC']
            ]
        });

        // Entradas activas para este partido
        const entradasOcupadas = await Entrada.findAll({
            where: {
                partidoId: pId,
                estado: { [Op.in]: ['pendiente', 'valida', 'usada'] }
            },
            attributes: ['asientoId']
        });
        const idsOcupadosEntrada = new Set(entradasOcupadas.map(e => e.asientoId));

        // Abonos activos
        const abonosActivos = await Abono.findAll({
            where: { activo: true },
            attributes: ['asientoId']
        });
        const idsAbonados = new Set(abonosActivos.map(a => a.asientoId));

        // Agrupar por sector > fila
        const sectoresMap = {};
        for (const asiento of asientos) {
            const sNombre = asiento.Sector.nombre;
            const fila    = asiento.fila;

            let estadoAsiento = 'libre';
            if (idsAbonados.has(asiento.id))        estadoAsiento = 'abonado';
            else if (idsOcupadosEntrada.has(asiento.id)) estadoAsiento = 'ocupado';

            if (!sectoresMap[sNombre]) sectoresMap[sNombre] = { sectorId: asiento.Sector.id, filas: {} };
            if (!sectoresMap[sNombre].filas[fila]) sectoresMap[sNombre].filas[fila] = [];

            sectoresMap[sNombre].filas[fila].push({
                id:      asiento.id,
                numero:  asiento.numero,
                estado:  estadoAsiento
            });
        }

        // Convertir a array
        const sectores = Object.entries(sectoresMap).map(([nombre, data]) => ({
            nombre,
            sectorId: data.sectorId,
            filas: Object.entries(data.filas).map(([fila, asientosArr]) => ({
                fila,
                asientos: asientosArr
            }))
        }));

        const totalLibres   = asientos.filter(a => !idsOcupadosEntrada.has(a.id) && !idsAbonados.has(a.id)).length;
        const totalOcupados = idsOcupadosEntrada.size;
        const totalAbonados = idsAbonados.size;

        return res.json({
            ok: true,
            partido: `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
            fecha:   partido.fecha,
            hora:    partido.hora,
            resumen: { total: asientos.length, libres: totalLibres, ocupados: totalOcupados, abonados: totalAbonados },
            sectores
        });

    } catch (e) {
        console.error('[taquilla/disponibilidad] Error:', e.message);
        return res.status(500).json({ ok: false, msg: 'Error interno al obtener disponibilidad' });
    }
});

module.exports = router;
