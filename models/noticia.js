const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Noticia = db.define('Noticia', {
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    extracto: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contenido: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    imagen: {
        type: DataTypes.STRING,
        allowNull: true
    },
    categoria: {
        type: DataTypes.ENUM('fichaje', 'lesion', 'comunicado', 'partido', 'galeria', 'evento', 'otro'),
        defaultValue: 'otro'
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    destacado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'noticias',
    freezeTableName: true,
    timestamps: true
});

module.exports = Noticia;
