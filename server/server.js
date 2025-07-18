const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const i18n = require('../lib/i18nConfigure');

const { dbConnection, wpDBConnection } = require('../database/config');
const { insertGradas,insertSectores,insertAsientos } = require('../services/initFieldData');

// Importar las relaciones
require('../models/associations');

class Server {

    constructor() {
        this.app  = express();
        this.port = process.env.PORT;
        this.paths = {
            authenticate: '/api/authenticate',
            usuarios: '/api/user',
            entradas: '/api/entradas',
            asientos: '/api/asientos',
            gradas: '/api/gradas',
            sectores: '/api/sectores',
            abonos: '/api/abonos',
            partidos: '/api/partidos',
            clasificacion: '/api/clasificacion'
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
            // Connect to both databases
            await dbConnection();  // Connect to your main MySQL database (futbol_db)
            await wpDBConnection();  // Connect to WordPress MySQL database (furbo)
            
//            console.log('Insertando datos del campo...')
//            await insertGradas();
//            await insertSectores();
//            await insertAsientos();

            console.log('Conexión a las bases de datos establecidas correctamente');
        } catch (error) {
            console.error('Error al conectar a la base de datos:', error);
            process.exit(1); // Stop the application if the database connection fails
        }
    }

    middlewares() {

        // CORS
        this.app.use( cors() );

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
        this.app.use( this.paths.authenticate, require('../routes/auth'));
        this.app.use( this.paths.usuarios, require('../routes/usuarios'));
        this.app.use(this.paths.entradas, require('../routes/entradas'));
        this.app.use(this.paths.asientos, require('../routes/asientos'));
        this.app.use(this.paths.gradas, require('../routes/gradas'));
        this.app.use(this.paths.sectores, require('../routes/sectores'));
        this.app.use(this.paths.abonos, require('../routes/abonos'));
        this.app.use(this.paths.partidos, require('../routes/partidos'));
        this.app.use(this.paths.clasificacion,require('../routes/clasificacion'));

    }

    listen() {
        this.app.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }

}

module.exports = Server;
