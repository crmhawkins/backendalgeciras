const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Producto = db.define('Producto', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    precioAnterior: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    imagen: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imagenes: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    categoria: {
        type: DataTypes.ENUM('equipacion', 'accesorio', 'ropa', 'otro'),
        allowNull: false,
        defaultValue: 'otro'
    },
    tallas: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    temporada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    destacado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    orden: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'productos',
    freezeTableName: true,
    timestamps: true
});

module.exports = Producto;
