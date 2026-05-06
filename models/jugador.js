const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Jugador = db.define('Jugador', {
  sofascoreId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nombreCorto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  posicion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dorsal: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nacionalidad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  altura: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  piePref: {
    type: DataTypes.STRING,
    allowNull: true
  },
  valorMercado: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'jugadores',
  freezeTableName: true,
  timestamps: true
});

module.exports = Jugador;
