const { Router } = require('express');
const logger = require('../helpers/logger');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// All log routes require a valid JWT — no password-in-querystring

// Ruta para ver los logs
router.get('/', validarJWT, (req, res) => {
    const { limit = 100, level } = req.query;

    const logs = logger.getLogs(parseInt(limit), level || null);

    res.json({
        total: logs.length,
        logs: logs
    });
});

// Ruta para limpiar los logs
router.delete('/', validarJWT, (req, res) => {
    logger.clearLogs();
    res.json({ msg: 'Logs limpiados correctamente' });
});

// Ruta para ver logs en tiempo real con Server-Sent Events
router.get('/stream', validarJWT, (req, res) => {

    // Configurar Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Enviar logs existentes primero
    const existingLogs = logger.getLogs(50);
    existingLogs.reverse().forEach(log => {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
    });

    // Mantener la conexión abierta (en una implementación real, usarías un sistema de eventos)
    const interval = setInterval(() => {
        // Enviar un ping para mantener la conexión viva
        res.write(': ping\n\n');
    }, 30000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

module.exports = router;
