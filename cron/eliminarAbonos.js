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

    // FIX-8: only liberate seats with no OTHER active abono
    if (asientoIds.length) {
      const abonosActivos = await Abono.findAll({
        where: { asientoId: { [Op.in]: asientoIds }, activo: true, fechaFin: { [Op.gte]: fechaCorte } },
        attributes: ['asientoId']
      });
      const asientosConAbonoActivo = new Set(abonosActivos.map(a => a.asientoId));
      const asientosALiberar = asientoIds.filter(id => !asientosConAbonoActivo.has(id));

      if (asientosALiberar.length > 0) {
        await Asiento.update(
          { estado: 'disponible' },
          { where: { id: { [Op.in]: asientosALiberar } } }
        );
      }

      console.log(`[✔] ${abonoIds.length} abonos desactivados, ${asientosALiberar.length} asientos liberados (${asientosConAbonoActivo.size} protegidos por abono activo)`);
    } else {
      console.log(`[✔] ${abonoIds.length} abonos desactivados, sin asientos a liberar`);
    }
  } catch (error) {
    console.error('[❌] Error al eliminar abonos:', error);
  }
}

module.exports = eliminarAbonosFinTemporada;
