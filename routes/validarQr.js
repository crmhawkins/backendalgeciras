/**
 * POST /api/validar-qr
 *
 * Endpoint para scanner QR en tornos/entrada del estadio.
 * Sin JWT — autenticación via header: x-scanner-secret = env SCANNER_SECRET
 *
 * Env vars requeridas:
 *   SCANNER_SECRET — secret compartido con el dispositivo scanner
 */

const { Router } = require('express');
const { Op } = require('sequelize');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Entrada = require('../models/entrada');
const Abono   = require('../models/abono');
const Asiento = require('../models/asiento');
const Sector  = require('../models/sector');
const Partido = require('../models/partido');

const router = Router();

// FIX-11: 5 req/min per IP rate limit
const qrLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { msg: 'Demasiadas peticiones' }
});

// Middleware: valida x-scanner-secret with timing-safe compare
function scannerAuth(req, res, next) {
    const secret = process.env.SCANNER_SECRET;
    if (!secret) {
        return res.status(503).json({ ok: false, msg: 'Scanner no configurado (SCANNER_SECRET vacío)' });
    }
    const provided = Buffer.from(req.headers['x-scanner-secret'] || '');
    const expected = Buffer.from(secret);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
        return res.status(401).json({ ok: false, msg: 'Scanner secret inválido' });
    }
    next();
}

/**
 * POST /api/validar-qr
 * Body: { codigo: string }
 */
router.post('/', qrLimiter, scannerAuth, async (req, res) => {
    const { codigo } = req.body;

    if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
        return res.status(400).json({ ok: false, msg: 'Campo codigo requerido' });
    }

    const codigoTrim = codigo.trim();
    // Búsqueda case-insensitive: probar original y uppercase
    const buscarCodigos = [codigoTrim, codigoTrim.toUpperCase()];

    try {
        // --- Buscar en Entradas ---
        const entrada = await Entrada.findOne({
            where: {
                [Op.or]: [
                    { codigoAcceso: { [Op.in]: buscarCodigos } },
                    { qrCode: { [Op.in]: buscarCodigos } },
                    { token: { [Op.in]: buscarCodigos } }
                ]
            },
            include: [
                {
                    model: Partido,
                    attributes: ['equipoLocal', 'equipoVisitante', 'fecha', 'hora'],
                    required: false
                },
                {
                    model: Asiento,
                    attributes: ['numero', 'fila'],
                    required: false,
                    include: [{
                        model: Sector,
                        attributes: ['nombre'],
                        required: false
                    }]
                }
            ]
        });

        if (entrada) {
            if (entrada.estado === 'usada') {
                return res.status(400).json({
                    ok: false,
                    tipo: 'ya_usado',
                    msg: 'Ya utilizado',
                    usadoEn: entrada.usadoAt,
                    titular: `Usuario #${entrada.usuarioId}`,
                    asiento: entrada.Asiento
                        ? `Sector ${entrada.Asiento?.Sector?.nombre || 'N/A'} - Fila ${entrada.Asiento?.fila || 'N/A'} - Asiento ${entrada.Asiento?.numero || 'N/A'}`
                        : null,
                    partido: entrada.Partido
                        ? `${entrada.Partido.equipoLocal} vs ${entrada.Partido.equipoVisitante}`
                        : null
                });
            }
            if (entrada.estado === 'cancelada') {
                return res.status(400).json({ ok: false, tipo: 'invalido', msg: 'Entrada cancelada' });
            }
            if (entrada.estado === 'pendiente') {
                return res.status(400).json({ ok: false, tipo: 'invalido', msg: 'Entrada pendiente de pago' });
            }

            // Marcar como usada
            entrada.estado  = 'usada';
            entrada.usadoAt = new Date();
            await entrada.save();

            const sector   = entrada.Asiento?.Sector?.nombre || 'N/A';
            const fila     = entrada.Asiento?.fila            || 'N/A';
            const asientoN = entrada.Asiento?.numero          || 'N/A';
            const partido  = entrada.Partido
                ? `${entrada.Partido.equipoLocal} vs ${entrada.Partido.equipoVisitante}`
                : 'N/A';

            return res.json({
                ok: true,
                tipo: 'entrada',
                titular: `Usuario #${entrada.usuarioId}`,
                asiento: `Sector ${sector} - Fila ${fila} - Asiento ${asientoN}`,
                partido
            });
        }

        // --- Buscar en Abonos ---
        const abono = await Abono.findOne({
            where: {
                codigoAcceso: { [Op.in]: buscarCodigos }
            },
            include: [
                {
                    model: Asiento,
                    attributes: ['numero', 'fila'],
                    required: false,
                    include: [{
                        model: Sector,
                        attributes: ['nombre'],
                        required: false
                    }]
                }
            ]
        });

        if (abono) {
            if (!abono.activo) {
                return res.status(400).json({ ok: false, msg: 'Abono inactivo o cancelado' });
            }
            const ahora    = new Date();
            const caducado = abono.fechaFin && new Date(abono.fechaFin) < ahora;
            if (caducado) {
                return res.status(400).json({ ok: false, tipo: 'caducado', msg: 'Abono caducado', titular: `${abono.nombre} ${abono.apellidos || ''}`.trim() });
            }

            const sector   = abono.Asiento?.Sector?.nombre || 'N/A';
            const fila     = abono.Asiento?.fila            || 'N/A';
            const asientoN = abono.Asiento?.numero          || 'N/A';
            const titular  = `${abono.nombre} ${abono.apellidos || ''}`.trim();

            return res.json({
                ok: true,
                tipo: 'abono',
                titular,
                asiento: `Sector ${sector} - Fila ${fila} - Asiento ${asientoN}`,
                partido: 'Abono de temporada'
            });
        }

        // No encontrado
        return res.status(404).json({ ok: false, msg: 'QR no encontrado' });

    } catch (err) {
        console.error('[validarQr] Error:', err.message);
        return res.status(500).json({ ok: false, msg: 'Error interno al validar QR' });
    }
});

module.exports = router;
