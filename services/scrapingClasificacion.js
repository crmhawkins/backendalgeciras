const axios = require('axios');
const cheerio = require('cheerio');
const Clasificacion = require('../models/clasificacion');

const now = new Date();
const currentSeasonEndYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
const URL = `https://www.resultados-futbol.com/historico/algeciras-cf/${currentSeasonEndYear}`;

async function obtenerClasificacion() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    const rows = $('#tabla2 tbody tr');

    for (let i = 0; i < rows.length; i++) {
        const row = $(rows[i]);
      
        const posicion = parseInt(row.find('th').text().trim(), 10);
        const equipo = row.find('.equipo a').text().trim();
        const escudo = row.find('.equipo img').attr('src');
        const pj = parseInt(row.find('td').eq(1).text().trim(), 10);
        const gf = parseInt(row.find('td').eq(2).text().trim(), 10);
        const gc = parseInt(row.find('td').eq(3).text().trim(), 10);
        const puntos = parseInt(row.find('td').eq(4).text().trim(), 10);
      
        const escudoInvalido = !escudo || escudo.trim() === '';
        const puntosInvalidos = isNaN(puntos) || puntos === 0;
        if (escudoInvalido && puntosInvalidos) continue;
      
        await Clasificacion.upsert({
          equipo,
          posicion,
          escudo,
          pj,
          gf,
          gc,
          puntos
        });
    }
      

    console.log('✅ Clasificación actualizada correctamente');
  } catch (error) {
    console.error('❌ Error al hacer scraping de clasificación:', error.message);
  }
}

module.exports={obtenerClasificacion};
