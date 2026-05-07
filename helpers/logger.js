'use strict';

const winston = require('winston');

// In-memory buffer for /api/logs backward compat
const logs = [];
const MAX_LOGS = 1000;

function addLog(entry) {
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
}

const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                })
            )
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

const logger = {
    log: (message, data = null) => {
        const entry = { timestamp: new Date().toISOString(), level: 'log', message, data };
        addLog(entry);
        winstonLogger.info(message, data ? { data } : {});
    },

    error: (message, error = null) => {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            message,
            error: error ? { name: error.name, message: error.message, stack: error.stack } : null,
        };
        addLog(entry);
        winstonLogger.error(message, error ? { error: error.message } : {});
    },

    warn: (message, data = null) => {
        const entry = { timestamp: new Date().toISOString(), level: 'warn', message, data };
        addLog(entry);
        winstonLogger.warn(message, data ? { data } : {});
    },

    info: (message, data = null) => {
        const entry = { timestamp: new Date().toISOString(), level: 'info', message, data };
        addLog(entry);
        winstonLogger.info(message, data ? { data } : {});
    },

    getLogs: (limit = 100, level = null) => {
        let filtered = logs;
        if (level) filtered = logs.filter(l => l.level === level);
        return filtered.slice(-limit);
    },

    clearLogs: () => {
        logs.length = 0;
    },
};

// Keep console intercept for existing code that uses console.log/error/warn/info
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
};

console.log = (...args) => {
    originalConsole.log(...args);
    addLog({ timestamp: new Date().toISOString(), level: 'log', message: args.join(' '), data: null });
};

console.error = (...args) => {
    originalConsole.error(...args);
    const error = args.find(a => a instanceof Error) || null;
    const message = args.filter(a => !(a instanceof Error)).join(' ') || 'Error';
    addLog({ timestamp: new Date().toISOString(), level: 'error', message, error: error ? { name: error.name, message: error.message, stack: error.stack } : null });
};

console.warn = (...args) => {
    originalConsole.warn(...args);
    addLog({ timestamp: new Date().toISOString(), level: 'warn', message: args.join(' '), data: null });
};

console.info = (...args) => {
    originalConsole.info(...args);
    addLog({ timestamp: new Date().toISOString(), level: 'info', message: args.join(' '), data: null });
};

module.exports = logger;
