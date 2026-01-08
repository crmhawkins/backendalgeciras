const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Partido = db.define('Partido', {
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: true
  },
  equipoLocal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  escudoLocal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  equipoVisitante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  escudoVisitante: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marcador: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'partidos',
  freezeTableName: true,
  timestamps: true
});

module.exports = Partido;
