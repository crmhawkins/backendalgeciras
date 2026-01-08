const { DataTypes } = require('sequelize');
const { db } = require('../database/config');

const Partido = db.define('Partido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: true
  },
  equipoLocal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  escudoLocal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  equipoVisitante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  escudoVisitante: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marcador: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'partidos',
  freezeTableName: true,
  timestamps: true
});

// Verificar que el nombre de la tabla sea correcto
if (Partido.tableName !== 'partidos') {
  console.warn(`⚠️  Advertencia: El nombre de la tabla del modelo Partido es "${Partido.tableName}" en lugar de "partidos"`);
} else {
  console.log('✅ Modelo Partido configurado correctamente con tableName: partidos');
}

module.exports = Partido;
