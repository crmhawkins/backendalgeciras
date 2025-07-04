const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Asiento = db.define('Asiento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false 
    },
    numero: { type: DataTypes.STRING, allowNull: false },
    fila: { type: DataTypes.STRING, allowNull: false },
    estado: {
        type: DataTypes.ENUM('disponible', 'ocupado'),
        defaultValue: 'disponible'
    },
    sectorId: { type: DataTypes.INTEGER, allowNull: false },
    partidoId: { type: DataTypes.INTEGER, allowNull: true } 
}, {
    timestamps: false
});

module.exports = Asiento;



