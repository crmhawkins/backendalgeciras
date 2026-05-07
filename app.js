require('dotenv').config();

const Server = require('./server/server');

const server = new Server();

server.listen().then(() => {
    // Crons cargados después de que DB esté lista
    require('./cron/cronPartidos');
    require('./cron/cronSync');
    require('./cron/cronJugadores');
}).catch((err) => {
    console.error('Error fatal al iniciar servidor:', err);
    process.exit(1);
});
