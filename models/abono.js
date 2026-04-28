const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Abono = db.define('Abono', {
    codigoAbonado: { type: DataTypes.INTEGER, allowNull: true },

    fechaInicio: { type: DataTypes.DATE, allowNull: true },
    fechaFin: { type: DataTypes.DATE, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },

    nombre: { type: DataTypes.STRING, allowNull: false },
    apellidos: { type: DataTypes.STRING, allowNull: false },
    genero: { type: DataTypes.STRING, allowNull: true },
    dni: { type: DataTypes.STRING, allowNull: true },
    fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: true },

    email: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    pais: { type: DataTypes.STRING, allowNull: true },
    provincia: { type: DataTypes.STRING, allowNull: true },
    localidad: { type: DataTypes.STRING, allowNull: true },
    domicilio: { type: DataTypes.STRING, allowNull: true },
    codigoPostal: { type: DataTypes.STRING, allowNull: true },

    usuarioId: { type: DataTypes.INTEGER, allowNull: true },
    asientoId: { type: DataTypes.INTEGER, allowNull: true },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, {
    tableName: 'abonos',
    freezeTableName: true
});

module.exports = Abono;
