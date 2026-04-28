require('dotenv').config();

const Server = require('./server/server');

const server = new Server();

server.listen();

// Cron después de listen para garantizar que DB está lista
require('./cron/cronPartidos');
require('./cron/cronSync');
