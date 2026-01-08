// Sistema de logging en memoria para visualización en tiempo real
const logs = [];
const MAX_LOGS = 1000; // Mantener solo los últimos 1000 logs

// Interceptar console.log, console.error, etc. para capturar todos los logs
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

const logger = {
    log: (message, data = null) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'log',
            message,
            data
        };
        addLog(logEntry);
        originalConsole.log(`[${logEntry.timestamp}]`, message, data || '');
    },

    error: (message, error = null) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null
        };
        addLog(logEntry);
        originalConsole.error(`[${logEntry.timestamp}]`, message, error || '');
    },

    warn: (message, data = null) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            message,
            data
        };
        addLog(logEntry);
        originalConsole.warn(`[${logEntry.timestamp}]`, message, data || '');
    },

    info: (message, data = null) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            message,
            data
        };
        addLog(logEntry);
        originalConsole.info(`[${logEntry.timestamp}]`, message, data || '');
    },

    getLogs: (limit = 100, level = null) => {
        let filteredLogs = logs;
        if (level) {
            filteredLogs = logs.filter(log => log.level === level);
        }
        return filteredLogs.slice(-limit);
    },

    clearLogs: () => {
        logs.length = 0;
    }
};

function addLog(logEntry) {
    logs.push(logEntry);
    // Mantener solo los últimos MAX_LOGS
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }
}

// Interceptar console para capturar logs automáticamente
console.log = (...args) => {
    originalConsole.log(...args);
    logger.log(args.join(' '), args.length > 1 ? args.slice(1) : null);
};

console.error = (...args) => {
    originalConsole.error(...args);
    const error = args.find(arg => arg instanceof Error) || null;
    const message = args.filter(arg => !(arg instanceof Error)).join(' ') || 'Error';
    logger.error(message, error);
};

console.warn = (...args) => {
    originalConsole.warn(...args);
    logger.warn(args.join(' '), args.length > 1 ? args.slice(1) : null);
};

console.info = (...args) => {
    originalConsole.info(...args);
    logger.info(args.join(' '), args.length > 1 ? args.slice(1) : null);
};

module.exports = logger;
