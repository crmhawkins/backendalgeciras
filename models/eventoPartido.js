// models/eventoPartido.js

const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const EventoPartido = db.define('EventoPartido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  minuto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false // 'gol', 'amarilla', 'cambio', etc.
  },
  jugador: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entra: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sale: {
    type: DataTypes.STRING,
    allowNull: true
  },
  equipo: {
    type: DataTypes.STRING, // 'local' o 'visitante'
    allowNull: false
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true
  },
  partidoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'partidos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
}, {
  tableName: 'evento_partidos',
  timestamps: false
});

module.exports = EventoPartido;
