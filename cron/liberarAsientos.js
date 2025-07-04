const { Op } = require('sequelize');
const Entrada = require('../models/entrada');
const Partido = require('../models/partido');
const Asiento = require('../models/asiento');

async function liberarAsientosPasados() {
  const hoy = new Date();

  try {
    const partidosPasados = await Partido.findAll({
      where: {
        fecha: { [Op.lt]: hoy }
      }
    });

    for (const partido of partidosPasados) {
      const entradas = await Entrada.findAll({
        where: { partidoId: partido.id }
      });

      for (const entrada of entradas) {
        const asiento = await Asiento.findByPk(entrada.asientoId);
        if (asiento) {
          asiento.estado = 'disponible';
          await asiento.save();
        }
        await entrada.destroy(); 
      }
    }

    console.log(`[✔] Asientos liberados para partidos finalizados`);
  } catch (error) {
    console.error(`[❌] Error liberando asientos:`, error);
  }
}

module.exports = liberarAsientosPasados;
