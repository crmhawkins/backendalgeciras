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
        const texto = `⚽ ${partido.equipoLocal} 🆚 ${partido.equipoVisitante}`;
        const fechaHora = new Date(`${partido.fecha}T${partido.hora}`);
        
        const diaSemana = fechaHora.toLocaleDateString('es-ES', { weekday: 'long' });
        const hora = fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        const mensaje = `${texto} el ${diaSemana} a las 🕒 ${hora}.\n¡Compra ya tus entradas!`;
        
        // Enviar notificación
        await sendNotificationToAll('🔥 ¡Se viene partidazo!', mensaje);
        
    }
};

module.exports = { verificarProximosPartidos };
