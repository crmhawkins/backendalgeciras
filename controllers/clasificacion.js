const Clasificacion = require('../models/clasificacion');

let clasificacionCache = null;
let clasificacionCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getClasificacion = async (req, res) => {
  try {
    const now = Date.now();
    if (clasificacionCache && (now - clasificacionCacheTime) < CACHE_TTL) {
      return res.json({ ok: true, clasificacion: clasificacionCache });
    }
    const clasificacion = await Clasificacion.findAll({
      order: [['posicion', 'ASC']]
    });
    clasificacionCache = clasificacion;
    clasificacionCacheTime = now;
    res.json({ ok: true, clasificacion });
  } catch (error) {
    console.error('❌ Error al obtener clasificación:', error.message);
    res.status(500).json({ message: 'Error al obtener la clasificación' });
  }
};

module.exports = { getClasificacion };
