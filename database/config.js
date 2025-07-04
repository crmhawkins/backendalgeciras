const { Sequelize } = require('sequelize');
require('dotenv').config();  // Cargar las variables del archivo .env

// Conexión a la base de datos de WordPress (furbo)
const wpDb = new Sequelize(process.env.WP_DB_NAME, process.env.WP_DB_USER, process.env.WP_DB_PASSWORD, {
    host: process.env.WP_DB_HOST,  // Usamos la IP del servidor WordPress
    dialect: 'mysql',
    logging: false,
});

// Función para probar la conexión a la base de datos de WordPress
const wpDBConnection = async () => {
    try {
        await wpDb.authenticate();
        console.log('Conexión a MySQL (WordPress) establecida correctamente');
    } catch (error) {
        console.error('Error al conectar a MySQL (WordPress):', error);
    }
};

// Conexión a la base de datos de tu aplicación (futbol_db)
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
});


const dbConnection = async () => {
    try {
        await db.authenticate();
        console.log('Conexión a MySQL establecida correctamente');

        require('../models/usuario');
        require('../models/entrada');
        require('../models/asiento');
        require('../models/grada');
        require('../models/sector');
        require('../models/abono');

        const Usuario = require('../models/usuario');
        const Entrada = require('../models/entrada');
        const Asiento = require('../models/asiento');
        const Grada = require('../models/grada');
        const Sector = require('../models/sector');
        const Abono = require('../models/abono');
        const Partido = require('../models/partido');
        const EventoPartido = require('../models/eventoPartido');

        Partido.hasMany(EventoPartido, { foreignKey: 'partidoId', onDelete: 'CASCADE' });
        EventoPartido.belongsTo(Partido, { foreignKey: 'partidoId' });

        Usuario.hasMany(Entrada, { foreignKey: 'usuarioId' });
        Entrada.belongsTo(Usuario, { foreignKey: 'usuarioId' });

        Usuario.hasMany(Abono, { foreignKey: 'usuarioId' });
        Abono.belongsTo(Usuario, { foreignKey: 'usuarioId' });

        Grada.hasMany(Sector, { foreignKey: 'gradaId' });
        Sector.belongsTo(Grada, { foreignKey: 'gradaId' });

        Sector.hasMany(Asiento, { foreignKey: 'sectorId' });
        Asiento.belongsTo(Sector, { foreignKey: 'sectorId' });

        Abono.belongsTo(Asiento, { foreignKey: 'asientoId' });
        Asiento.hasMany(Abono, { foreignKey: 'asientoId' });

        Partido.hasMany(Asiento, { foreignKey: 'partidoId' });
        Asiento.belongsTo(Partido, { foreignKey: 'partidoId' });

        Partido.hasMany(Entrada, { foreignKey: 'partidoId' });
        Entrada.belongsTo(Partido, { foreignKey: 'partidoId' });

        Asiento.hasMany(Entrada, { foreignKey: 'asientoId' });
        Entrada.belongsTo(Asiento, { foreignKey: 'asientoId' });

        Sector.hasMany(Entrada, { foreignKey: 'sectorId' });
        Entrada.belongsTo(Sector, { foreignKey: 'sectorId' });

        //await db.sync({ force: true });
        console.log('Modelos sincronizados con la base de datos');

    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        throw new Error('Error en la conexión con la base de datos');
    }
};

module.exports = {
    db,
    wpDb,
    dbConnection,
    wpDBConnection
};



