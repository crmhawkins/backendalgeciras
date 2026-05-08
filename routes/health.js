'use strict';

const { Router } = require('express');
const { db } = require('../database/config');

const router = Router();

// Global cron last-run registry — populated by cron jobs via global.cronLastRun
if (!global.cronLastRun) global.cronLastRun = {};

router.get('/', async (req, res) => {
    const start = Date.now();
    let dbStatus  = 'ok';
    let dbLatency = 0;

    try {
        const dbStart = Date.now();
        await db.authenticate();
        dbLatency = Date.now() - dbStart;
    } catch (e) {
        dbStatus = 'error';
    }

    const mem = process.memoryUsage();

    const smtpConfigured   = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_live_...');

    res.json({
        ok:        true,
        status:    dbStatus === 'ok' ? 'healthy' : 'degraded',
        uptime:    Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version:   process.env.npm_package_version || '1.0.0',
        db: {
            status:  dbStatus,
            latency: `${dbLatency}ms`
        },
        memory: {
            rss:       `${Math.round(mem.rss       / 1024 / 1024)}MB`,
            heapUsed:  `${Math.round(mem.heapUsed  / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`
        },
        services: {
            smtp:   smtpConfigured   ? 'configurado' : 'no configurado',
            stripe: stripeConfigured ? 'configurado' : 'no configurado'
        },
        crons: {
            liberarAsientos:        global.cronLastRun.liberarAsientos        || null,
            eliminarAbonos:         global.cronLastRun.eliminarAbonos         || null,
            cronPartidos:           global.cronLastRun.cronPartidos           || null,
            cronSync:               global.cronLastRun.cronSync               || null,
            cronJugadores:          global.cronLastRun.cronJugadores          || null
        },
        responseTime: `${Date.now() - start}ms`
    });
});

module.exports = router;
