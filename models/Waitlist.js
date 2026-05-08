const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Waitlist = db.define('Waitlist', {
    asientoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    partidoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'null = cualquier partido'
    },
    notificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'waitlist',
    freezeTableName: true,
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['asientoId', 'usuarioId', 'partidoId'],
            name: 'idx_waitlist_unique'
        }
    ]
});

module.exports = Waitlist;
