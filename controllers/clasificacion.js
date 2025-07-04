const Clasificacion = require('../models/clasificacion');

const getClasificacion = async (req, res) => {
  try {
    const clasificacion = await Clasificacion.findAll({
      order: [['posicion', 'ASC']] // ordena por posición
    });
    res.json(clasificacion);
  } catch (error) {
    console.error('❌ Error al obtener clasificación:', error.message);
    res.status(500).json({ message: 'Error al obtener la clasificación' });
  }
};

module.exports = { getClasificacion };
