const { Op } = require('sequelize');
const { db } = require('../database/config');
const Entrada = require('../models/entrada');
const Partido = require('../models/partido');
const Asiento = require('../models/asiento');
const Abono   = require('../models/abono');

async function liberarAsientosPasados() {
  const hoy = new Date();

  try {
    // Una sola query: entradas de partidos pasados, con asiento JOIN
    const entradas = await Entrada.findAll({
      where: { estado: { [Op.notIn]: ['archivada', 'cancelada'] } },
      include: [{
        model: Partido,
        where: { fecha: { [Op.lt]: hoy } },
        attributes: ['id']
      }],
      attributes: ['id', 'asientoId']
    });

    if (!entradas.length) {
      console.log('[✔] No hay asientos que liberar');
      return;
    }

    const entradaIds  = entradas.map(e => e.id);
    const asientoIds  = [...new Set(entradas.map(e => e.asientoId))];

    // Archivar todas las entradas en bulk
    await Entrada.update(
      { estado: 'archivada' },
      { where: { id: { [Op.in]: entradaIds } } }
    );

    // Asientos SIN abono activo vigente → liberar en bulk
    const abonosActivos = await Abono.findAll({
      where: { asientoId: { [Op.in]: asientoIds }, activo: true },
      attributes: ['asientoId']
    });
    const conAbono = new Set(abonosActivos.map(a => a.asientoId));
    const liberar  = asientoIds.filter(id => !conAbono.has(id));

    if (liberar.length) {
      await Asiento.update(
        { estado: 'disponible' },
        { where: { id: { [Op.in]: liberar } } }
      );
    }

    console.log(`[✔] Archivadas ${entradaIds.length} entradas, liberados ${liberar.length} asientos`);
  } catch (error) {
    console.error('[❌] Error liberando asientos:', error);
  }
}

module.exports = liberarAsientosPasados;
