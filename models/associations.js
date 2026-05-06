const Asiento = require('./asiento');
const Sector = require('./sector');
const Jugador = require('./jugador');
const JugadorStats = require('./jugadorStats');
const Entrada = require('./entrada');
const Abono = require('./abono');
const Partido = require('./partido');

// Relación Sector - Asiento
Sector.hasMany(Asiento, { foreignKey: 'sectorId' });
Asiento.belongsTo(Sector, { foreignKey: 'sectorId' });

// Relación Jugador - JugadorStats
Jugador.hasMany(JugadorStats, { foreignKey: 'jugadorId', as: 'stats' });
JugadorStats.belongsTo(Jugador, { foreignKey: 'jugadorId' });

// Relaciones Entrada
Entrada.belongsTo(Partido, { foreignKey: 'partidoId' });
Entrada.belongsTo(Asiento, { foreignKey: 'asientoId' });
Partido.hasMany(Entrada, { foreignKey: 'partidoId' });
Asiento.hasMany(Entrada, { foreignKey: 'asientoId' });

// Relaciones Abono
Abono.belongsTo(Asiento, { foreignKey: 'asientoId' });
Asiento.hasMany(Abono, { foreignKey: 'asientoId' });

module.exports = {
    Asiento,
    Sector,
    Jugador,
    JugadorStats,
    Entrada,
    Abono,
    Partido
}; 