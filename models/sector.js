const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Sector = db.define('Sector', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false 
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    gradaId: { type: DataTypes.INTEGER, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    imagen: { type: DataTypes.STRING },
  }, {
    tableName: 'sectores',
    freezeTableName: true,
    timestamps: false
  });
  

module.exports = Sector;


