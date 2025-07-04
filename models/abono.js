const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Abono = db.define('Abono', {
    fechaInicio: { type: DataTypes.DATE, allowNull: false },
    fechaFin: { type: DataTypes.DATE, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },

    nombre: { type: DataTypes.STRING, allowNull: false },
    apellidos: { type: DataTypes.STRING, allowNull: false },
    genero: { type: DataTypes.STRING, allowNull: false },
    dni: { type: DataTypes.STRING, allowNull: false },
    fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: false },

    email: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING, allowNull: false },
    pais: { type: DataTypes.STRING, allowNull: false },
    provincia: { type: DataTypes.STRING, allowNull: false },
    localidad: { type: DataTypes.STRING, allowNull: false },
    domicilio: { type: DataTypes.STRING, allowNull: false },
    codigoPostal: { type: DataTypes.STRING, allowNull: false },

    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    asientoId: { type: DataTypes.INTEGER, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
});

module.exports = Abono;



