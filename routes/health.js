'use strict';

const { Router } = require('express');
const { db } = require('../database/config');

const router = Router();

router.get('/', async (req, res) => {
    const start = Date.now();
    let dbStatus = 'ok';
    let dbLatency = 0;

    try {
        const dbStart = Date.now();
        await db.authenticate();
        dbLatency = Date.now() - dbStart;
    } catch (e) {
        dbStatus = 'error';
    }

    res.json({
        ok: true,
        status: 'healthy',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        db: { status: dbStatus, latency: `${dbLatency}ms` },
        responseTime: `${Date.now() - start}ms`,
    });
});

module.exports = router;
