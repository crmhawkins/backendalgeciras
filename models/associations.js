const Jugador = require('./jugador');
const JugadorStats = require('./jugadorStats');

// Estas asociaciones no están en database/config.js
Jugador.hasMany(JugadorStats, { foreignKey: 'jugadorId', as: 'stats' });
JugadorStats.belongsTo(Jugador, { foreignKey: 'jugadorId' });

// Las demás asociaciones (Sector-Asiento, Entrada-Partido, Abono-Asiento, etc.)
// están definidas en database/config.js dentro de dbConnection()

module.exports = {
    Jugador,
    JugadorStats,
    Asiento: require('./asiento'),
    Sector: require('./sector'),
    Entrada: require('./entrada'),
    Abono: require('./abono'),
    Partido: require('./partido')
};
