const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const JugadorStats = db.define('JugadorStats', {
  jugadorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'jugadores',
      key: 'id'
    }
  },
  temporada: {
    type: DataTypes.STRING,
    allowNull: false
  },
  goles: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  asistencias: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minutosJugados: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  partidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  titularidades: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tarjetasAmarillas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tarjetasRojas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  disparos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  disparosPuerta: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'jugador_stats',
  freezeTableName: true,
  timestamps: true
});

module.exports = JugadorStats;
