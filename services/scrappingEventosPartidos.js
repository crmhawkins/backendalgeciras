const axios = require('axios');
const cheerio = require('cheerio');
const EventoPartido = require('../models/eventoPartido');

async function scrapEventosPartido(urlResumen, partidoId) {
  try {
    const { data } = await axios.get(urlResumen, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(data);
    const eventos = [];

    $('#listado_eventos .evento').each((_, el) => {
      const $el = $(el);
      const minutoText = $el.find('.minutos').text().trim();
      const minuto = parseInt(minutoText.replace(/\D/g, ''), 10);
      const jugador = $el.find('a[href*="/jugador/"]').text().trim();
      const tipoTexto = $el.find('small').text().toLowerCase();
      const imagen = $el.find('img.event-avatar').attr('src') || null;

      let tipo = '', entra = null, sale = null;

      if (tipoTexto.includes('2a amarilla') || tipoTexto.includes('doble amarilla')) {
        tipo = 'doble amarilla';
      } else if (tipoTexto.includes('t. roja') || tipoTexto.includes('roja')) {
        tipo = 'roja';
      } else if (tipoTexto.includes('amarilla')) {
        tipo = 'amarilla';
      } else if (tipoTexto.includes('gol')) {
        tipo = tipoTexto.includes('propia') ? 'autogol' : 'gol';
      } else if (tipoTexto.includes('asistencia')) {
        tipo = 'asistencia';
      } else if (tipoTexto.includes('entra')) {
        tipo = 'cambio';
        entra = jugador;
      } else if (tipoTexto.includes('sale')) {
        tipo = 'cambio';
        sale = jugador;
      } else if (tipoTexto.includes('penalti') && tipoTexto.includes('cometido')) {
        tipo = 'penalti cometido';
      } else if (tipoTexto.includes('penalti') && tipoTexto.includes('fallado')) {
        tipo = 'penalti fallado';
      } else {
        tipo = tipoTexto;
      }

      const equipo = $el.find('.minutosizq').length > 0 ? 'local' : 'visitante';

      eventos.push({ minuto, tipo, jugador, entra, sale, equipo, imagen });
    });

    let guardados = 0;

    for (const evento of eventos) {
      const yaExiste = await EventoPartido.findOne({
        where: {
          partidoId: partidoId,
          minuto: evento.minuto,
          tipo: evento.tipo,
          jugador: evento.jugador
        }
      });

      if (!yaExiste) {
        await EventoPartido.create({ ...evento, partidoId });
        guardados++;
      }
    }

    console.log(`✅ ${guardados} eventos nuevos guardados para el partido ID ${partidoId}`);
  } catch (err) {
    console.error(`❌ Error al scrapear eventos de ${urlResumen}:`, err.message);
  }
}

module.exports = { scrapEventosPartido };
