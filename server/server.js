const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const i18n = require('../lib/i18nConfigure');
const { Server: SocketIOServer } = require('socket.io');
const { initChatSocket } = require('../sockets/chatSocket');

// Inicializar el sistema de logging (debe ser lo primero para capturar todos los logs)
require('../helpers/logger');

const { dbConnection, wpDBConnection } = require('../database/config');
const { insertGradas,insertSectores,insertAsientos } = require('../services/initFieldData');

// Importar las relaciones
require('../models/associations');

const logger = require('../helpers/logger');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Demasiados intentos, espera 15 minutos' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, msg: 'Demasiadas peticiones, intenta más tarde' },
});

class Server {

    constructor() {
        this.app        = express();
        this.httpServer = http.createServer(this.app);
        const allowedSocketOrigins = (process.env.CORS_ORIGINS || 'https://backend-algeciras.hawkins.es').split(',');
        this.io         = new SocketIOServer(this.httpServer, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin || allowedSocketOrigins.includes(origin)) return callback(null, true);
                    callback(new Error('Not allowed by CORS'));
                },
                methods: ['GET', 'POST'],
            },
        });
        this.port = process.env.PORT || 3000;
        this.paths = {
            authenticate: '/api/authenticate',
            usuarios: '/api/user',
            entradas: '/api/entradas',
            asientos: '/api/asientos',
            gradas: '/api/gradas',
            sectores: '/api/sectores',
            abonos: '/api/abonos',
            partidos: '/api/partidos',
            clasificacion: '/api/clasificacion',
            pagos: '/api/pagos',
            logs: '/api/logs',
            sync: '/api/sync',
            fanzone: '/api/fanzone',
            jugadores: '/api/jugadores',
            validarQr: '/api/validar-qr',
            productos: '/api/productos',
            noticias: '/api/noticias',
            estadio: '/api/estadio',
            patrocinadores: '/api/patrocinadores',
            health: '/api/health',
            stats: '/api/stats',
            export: '/api/interno',
        };
        

        // Middlewares
        this.middlewares();

        // Rutas de mi aplicación
        this.routes();

        // Socket.io chat
        initChatSocket(this.io);
    }

    async conectarDB() {
        try {
            await dbConnection();
            logger.info('Conexión a la base de datos principal establecida');
        } catch (error) {
            logger.error('Error al conectar a la base de datos principal:', error);
            process.exit(1);
        }
        try {
            await wpDBConnection();
        } catch (error) {
            logger.warn('WP DB no disponible (no crítico): ' + error.message);
        }
    }

    middlewares() {

        // Gzip compression
        this.app.use(compression());

        // Security headers
        this.app.use(helmet());

        // CORS
        const allowedOrigins = (process.env.CORS_ORIGINS || 'https://backend-algeciras.hawkins.es').split(',');
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true
        }));

        // Webhook de Stripe necesita el body raw, así que lo excluimos del parseo JSON
        this.app.use('/api/pagos/webhook', express.raw({ type: 'application/json' }));

        // Lectura y parseo del body
        this.app.use( express.json() );
        
        // // Subida de archivo
        // this.app.use( fileUpload({
        //     useTempFiles : true,
        //     tempFileDir : '/tmp/',
        //     createParentPath: true
        // }));

        // Directorio Público
        this.app.use( express.static('public') );
        this.app.use('/components', express.static('components'));

        this.app.use( i18n.init );

        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                logger.info('request', {
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    ms: Date.now() - start,
                    ip: req.ip,
                });
            });
            next();
        });

    }

    routes() {
        // Public endpoints (no auth, no rate limit)
        this.app.use(this.paths.health, require('../routes/health'));
        this.app.use(this.paths.stats, require('../routes/stats'));

        // General API rate limit
        this.app.use('/api/', apiLimiter);

        this.app.use( this.paths.authenticate, loginLimiter, require('../routes/auth'));
        this.app.use( this.paths.usuarios, require('../routes/usuarios'));
        this.app.use(this.paths.entradas, require('../routes/entradas'));
        this.app.use(this.paths.asientos, require('../routes/asientos'));
        this.app.use(this.paths.gradas, require('../routes/gradas'));
        this.app.use(this.paths.sectores, require('../routes/sectores'));
        this.app.use(this.paths.abonos, require('../routes/abonos'));
        this.app.use(this.paths.partidos, require('../routes/partidos'));
        this.app.use(this.paths.clasificacion,require('../routes/clasificacion'));
        
        // Rutas de pagos
        const { router: pagosRouter, webhookRouter } = require('../routes/pagos');
        this.app.use(this.paths.pagos, pagosRouter);
        this.app.use(this.paths.pagos, webhookRouter);
        
        // Panel interno
        this.app.use('/api/interno', require('../routes/interno'));

        // Rutas de logs (solo para debugging)
        this.app.use(this.paths.logs, require('../routes/logs'));

        // Rutas de sincronización con compralaentrada
        this.app.use(this.paths.sync, require('../routes/sync'));
        this.app.use(this.paths.fanzone, require('../routes/fanzone'));
        this.app.use(this.paths.jugadores, require('../routes/jugadores'));

        // Validación QR scanner (portería)
        this.app.use(this.paths.validarQr, require('../routes/validarQr'));

        // Tienda
        this.app.use(this.paths.productos, require('../routes/productos'));

        // Noticias
        this.app.use(this.paths.noticias, require('../routes/noticias'));

        // Estadio
        this.app.use(this.paths.estadio, require('../routes/estadio'));

        // Patrocinadores
        this.app.use(this.paths.patrocinadores, require('../routes/patrocinadores'));

    }

    async listen() {
        await this.conectarDB();
        this.httpServer.listen( this.port, () => {
            logger.info('Servidor corriendo en puerto ' + this.port);
            logger.info('Socket.io chat activo');
        });
    }

}

module.exports = Server;
