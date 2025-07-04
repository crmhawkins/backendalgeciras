/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const i18n = require('../lib/i18nConfigure');




const { dbConnection } = require('../database/config');

class Server {

    constructor() {
        this.app  = express();
        this.port = process.env.PORT;
        this.paths = {
            anuncios: '/api/anuncios',
            uploads: '/api/uploads',
            authenticate: '/api/authenticate',
            usuarios: '/api/user',
        };

        //Conectar a base de datos para
        this.conectarDB();

        // Middlewares
        this.middlewares();

        // Rutas de mi aplicación
        this.routes();
    }

    conectarDB() {
        dbConnection();
    }

    middlewares() {

        // CORS
        this.app.use( cors() );

        // Lectura y parseo del body
        this.app.use( express.json() );
        
        // Subida de archivo
        this.app.use( fileUpload({
            useTempFiles : true,
            tempFileDir : '/tmp/',
            createParentPath: true
        }));

        // Directorio Público
        this.app.use( express.static('public') );

        this.app.use( i18n.init );

    }

    routes() {
        this.app.use( this.paths.anuncios, require('../routes/anuncios'));
        this.app.use( this.paths.uploads, require('../routes/uploads'));
        this.app.use( this.paths.authenticate, require('../routes/auth'));
        this.app.use( this.paths.usuarios, require('../routes/usuarios'));



    }

    listen() {
        this.app.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }

}




module.exports = Server;
