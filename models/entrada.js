const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Entrada = db.define('Entrada', {
    token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
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
    },
    // --- Campos QR y estado ---
    qrCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
        comment: 'Código único interno generado al comprar'
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'valida', 'usada', 'cancelada'),
        defaultValue: 'pendiente',
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('web', 'app', 'taquilla'),
        defaultValue: 'web',
        allowNull: false,
        comment: 'Canal de venta'
    },
    vendidoPorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'userId del taquillero si fue presencial'
    },
    metodoPago: {
        type: DataTypes.ENUM('stripe', 'efectivo', 'tarjeta', 'otro'),
        allowNull: true
    },
    stripeSessionId: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    codigoAcceso: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'Código QR visible para el usuario'
    },
    usadoAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp de cuando se usó la entrada'
    },
    enviadoEmail: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'entradas',
    freezeTableName: true,
    timestamps: true
});

module.exports = Entrada;



