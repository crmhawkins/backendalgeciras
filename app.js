require('dotenv').config();
require('./cron/cronPartidos'); // ✅ se activa al arrancar


const Server = require('./server/server');


const server = new Server();


server.listen();


