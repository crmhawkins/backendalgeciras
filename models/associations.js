const Jugador = require('./jugador');
const JugadorStats = require('./jugadorStats');
const Waitlist = require('./Waitlist');
const Asiento = require('./asiento');
const Usuario = require('./usuario');

// Estas asociaciones no están en database/config.js
Jugador.hasMany(JugadorStats, { foreignKey: 'jugadorId', as: 'stats' });
JugadorStats.belongsTo(Jugador, { foreignKey: 'jugadorId' });

// Waitlist associations
Waitlist.belongsTo(Asiento, { foreignKey: 'asientoId' });
Asiento.hasMany(Waitlist, { foreignKey: 'asientoId' });

Waitlist.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Usuario.hasMany(Waitlist, { foreignKey: 'usuarioId' });

// CodigoDescuento — sin asociaciones requeridas
require('./CodigoDescuento');

// Las demás asociaciones (Sector-Asiento, Entrada-Partido, Abono-Asiento, etc.)
// están definidas en database/config.js dentro de dbConnection()

module.exports = {
    Jugador,
    JugadorStats,
    Asiento,
    Sector: require('./sector'),
    Entrada: require('./entrada'),
    Abono: require('./abono'),
    Partido: require('./partido'),
    Waitlist,
    CodigoDescuento: require('./CodigoDescuento')
};
