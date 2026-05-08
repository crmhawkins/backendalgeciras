const { Op } = require('sequelize');
const Abono   = require('../models/abono');
const Asiento = require('../models/asiento');

async function eliminarAbonosFinTemporada() {
  const fechaCorte = new Date();

  try {
    // Una query: todos los abonos caducados y activos
    const abonosCaducados = await Abono.findAll({
      where: { fechaFin: { [Op.lt]: fechaCorte }, activo: true },
      attributes: ['id', 'asientoId']
    });

    if (!abonosCaducados.length) {
      console.log('[✔] No hay abonos caducados');
      return;
    }

    const abonoIds   = abonosCaducados.map(a => a.id);
    const asientoIds = [...new Set(abonosCaducados.map(a => a.asientoId).filter(Boolean))];

    // Bulk: marcar abonos como inactivos
    await Abono.update(
      { activo: false },
      { where: { id: { [Op.in]: abonoIds } } }
    );

    // Bulk: liberar asientos
    if (asientoIds.length) {
      await Asiento.update(
        { estado: 'disponible' },
        { where: { id: { [Op.in]: asientoIds } } }
      );
    }

    console.log(`[✔] ${abonoIds.length} abonos desactivados, ${asientoIds.length} asientos liberados`);
  } catch (error) {
    console.error('[❌] Error al eliminar abonos:', error);
  }
}

module.exports = eliminarAbonosFinTemporada;
