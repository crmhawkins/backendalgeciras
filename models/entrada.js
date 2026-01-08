const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Entrada = db.define('Entrada', {
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    partidoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    asientoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'entradas',
    freezeTableName: true,
    timestamps: false
});

module.exports = Entrada;



