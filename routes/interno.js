const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { enviarPushMasivo, enviarPushUsuario } = require('../services/notificacionesService');

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

module.exports = router;
