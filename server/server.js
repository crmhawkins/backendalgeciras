const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const i18n = require('../lib/i18nConfigure');

// Inicializar el sistema de logging (debe ser lo primero para capturar todos los logs)
require('../helpers/logger');

const { dbConnection, wpDBConnection } = require('../database/config');
const { insertGradas,insertSectores,insertAsientos } = require('../services/initFieldData');

// Importar las relaciones
require('../models/associations');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Demasiados intentos, espera 15 minutos' }
});

class Server {

    constructor() {
        this.app  = express();
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
            jugadores: '/api/jugadores'
        };
        

        //Conectar a base de datos para
        this.conectarDB();

        // Middlewares
        this.middlewares();

        // Rutas de mi aplicación
        this.routes();
    }
    async conectarDB() {
        try {
            await dbConnection();
            console.log('Conexión a la base de datos principal establecida');
        } catch (error) {
            console.error('Error al conectar a la base de datos principal:', error);
            process.exit(1);
        }
        try {
            await wpDBConnection();
        } catch (error) {
            console.warn('WP DB no disponible (no crítico):', error.message);
        }
    }

    middlewares() {

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

    }

    routes() {
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

    }

    listen() {
        this.app.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }

}

module.exports = Server;
