const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Grada = db.define('Grada', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false 
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    imagen: { type: DataTypes.STRING }, 
    descripcion: { type: DataTypes.STRING }
});

module.exports = Grada;


