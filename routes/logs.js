const { Router } = require('express');
const logger = require('../helpers/logger');

const router = Router();

// Middleware para verificar si estamos en desarrollo o si hay autenticación
const isDevelopment = process.env.NODE_ENV === 'development';
const LOGS_PASSWORD = process.env.LOGS_PASSWORD || 'admin123'; // Cambiar en producción

// Ruta para ver los logs (protegida con contraseña simple)
router.get('/', (req, res) => {
    const { password, limit = 100, level } = req.query;

    // En desarrollo, permitir sin contraseña. En producción, requerir contraseña
    if (!isDevelopment && password !== LOGS_PASSWORD) {
        return res.status(401).json({ 
            msg: 'Acceso no autorizado. Proporciona la contraseña correcta en el parámetro ?password=...' 
        });
    }

    const logs = logger.getLogs(parseInt(limit), level || null);
    
    res.json({
        total: logs.length,
        logs: logs.reverse() // Mostrar los más recientes primero
    });
});

// Ruta para limpiar los logs
router.delete('/', (req, res) => {
    const { password } = req.query;

    if (!isDevelopment && password !== LOGS_PASSWORD) {
        return res.status(401).json({ msg: 'Acceso no autorizado' });
    }

    logger.clearLogs();
    res.json({ msg: 'Logs limpiados correctamente' });
});

// Ruta para ver logs en tiempo real con Server-Sent Events
router.get('/stream', (req, res) => {
    const { password } = req.query;

    if (!isDevelopment && password !== LOGS_PASSWORD) {
        return res.status(401).json({ msg: 'Acceso no autorizado' });
    }

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
