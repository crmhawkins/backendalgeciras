const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

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

module.exports = router;
