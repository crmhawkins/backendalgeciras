const Partido = require('../models/partido');
const { sendNotificationToAll } = require('./fcm');
const { Op } = require('sequelize');

const verificarProximosPartidos = async () => {
  const hoy = new Date();
  const fechaLimite = new Date();
  fechaLimite.setDate(hoy.getDate() + 2);

  const partidos = await Partido.findAll({
    where: {
      fecha: {
        [Op.between]: [hoy, fechaLimite]
      }
    }
  });

    for (const partido of partidos) {
        try {
            const texto = `⚽ ${partido.equipoLocal} 🆚 ${partido.equipoVisitante}`;
            let horaTexto = 'hora por confirmar';
            if (partido.hora) {
                const fechaHora = new Date(`${partido.fecha}T${partido.hora}`);
                if (!isNaN(fechaHora.getTime())) {
                    const diaSemana = fechaHora.toLocaleDateString('es-ES', { weekday: 'long' });
                    horaTexto = `el ${diaSemana} a las 🕒 ${fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
                }
            }
            const mensaje = `${texto} ${horaTexto}.\n¡Compra ya tus entradas!`;
            await sendNotificationToAll('🔥 ¡Se viene partidazo!', mensaje);
        } catch (err) {
            console.error(`[verificarPartido] Error enviando notificación para partido ${partido.id}:`, err.message);
        }
    }
};

module.exports = { verificarProximosPartidos };
