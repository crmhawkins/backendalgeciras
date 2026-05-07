const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Clasificacion = db.define('Clasificacion', {
  posicion: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  equipo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  escudo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pj: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gf: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gc: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  puntos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  g: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  e: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  d: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
},{
    tableName: 'clasificacion',
    freezeTableName: true
});

module.exports = Clasificacion;
