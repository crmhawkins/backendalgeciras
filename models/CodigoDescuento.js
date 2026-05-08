const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const CodigoDescuento = db.define('CodigoDescuento', {
    codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    tipo: {
        type: DataTypes.ENUM('porcentaje', 'fijo'),
        defaultValue: 'porcentaje'
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    usosMax: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
        comment: 'null = ilimitado'
    },
    usosActuales: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    fechaFin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    soloAbonos: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    soloEntradas: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'codigos_descuento',
    freezeTableName: true,
    timestamps: true
});

module.exports = CodigoDescuento;
