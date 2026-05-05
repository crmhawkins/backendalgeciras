const Asiento = require('./asiento');
const Sector = require('./sector');
const Jugador = require('./jugador');
const JugadorStats = require('./jugadorStats');

// Relación Sector - Asiento
Sector.hasMany(Asiento, { foreignKey: 'sectorId' });
Asiento.belongsTo(Sector, { foreignKey: 'sectorId' });

// Relación Jugador - JugadorStats
Jugador.hasMany(JugadorStats, { foreignKey: 'jugadorId', as: 'stats' });
JugadorStats.belongsTo(Jugador, { foreignKey: 'jugadorId' });

module.exports = {
    Asiento,
    Sector,
    Jugador,
    JugadorStats
}; 