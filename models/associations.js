const Asiento = require('./asiento');
const Sector = require('./sector');

// Relación Sector - Asiento
Sector.hasMany(Asiento, { foreignKey: 'sectorId' });
Asiento.belongsTo(Sector, { foreignKey: 'sectorId' });

module.exports = {
    Asiento,
    Sector
}; 