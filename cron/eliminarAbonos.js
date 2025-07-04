const { Op } = require('sequelize');
const Abono = require('../models/abono');
const Asiento = require('../models/asiento');

async function eliminarAbonosFinTemporada() {
  const fechaCorte = new Date('2025-07-01');

  try {
    const abonosCaducados = await Abono.findAll({
      where: { fechaFin: { [Op.lt]: fechaCorte } }
    });

    for (const abono of abonosCaducados) {
      const asiento = await Asiento.findByPk(abono.asientoId);
      if (asiento) {
        asiento.estado = 'disponible';
        await asiento.save();
      }
      await abono.destroy();
    }

    console.log(`[✔] Abonos eliminados después de la temporada`);
  } catch (error) {
    console.error(`[❌] Error al eliminar abonos:`, error);
  }
}

module.exports = eliminarAbonosFinTemporada;
