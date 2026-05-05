const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const FanzoneVoto = db.define('FanzoneVoto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  partidoId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  jugador: { type: DataTypes.STRING(100), allowNull: false },
}, {
  tableName: 'fanzone_votos',
  freezeTableName: true,
  timestamps: true,
  indexes: [{ unique: true, fields: ['partidoId', 'userId'] }],
});

module.exports = FanzoneVoto;
