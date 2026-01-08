const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const PagoSession = db.define('PagoSession', {
    stripeSessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    tipo: {
        type: DataTypes.ENUM('entrada', 'abono'),
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'completado', 'cancelado', 'expirado'),
        defaultValue: 'pendiente'
    },
    datosCompra: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('datosCompra');
            return value ? JSON.parse(value) : null;
        },
        set(value) {
            this.setDataValue('datosCompra', JSON.stringify(value));
        }
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fechaExpiracion: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'pago_sessions',
    timestamps: true
});

module.exports = PagoSession;
