const axios = require('axios');
const Clasificacion = require('../models/clasificacion');

const TOURNAMENT_ID = 17073;
const SEASON_ID = 77727;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.sofascore.com/',
  'Origin': 'https://www.sofascore.com',
};

async function obtenerClasificacion() {
  try {
    const url = `https://api.sofascore.com/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/standings/total`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });

    const standings = data?.standings?.[0]?.rows ?? [];
    if (!standings.length) {
      console.warn('[Clasificacion] SofaScore devolvió standings vacíos');
      return;
    }

    await Clasificacion.destroy({ where: {} });

    for (const row of standings) {
      const team = row.team;
      await Clasificacion.create({
        posicion: row.position,
        equipo:   team.name,
        escudo:   `https://api.sofascore.com/api/v1/team/${team.id}/image`,
        pj:       row.matches,
        g:        row.wins,
        e:        row.draws,
        d:        row.losses,
        gf:       row.scoresFor,
        gc:       row.scoresAgainst,
        puntos:   row.points,
      });
    }

    console.log(`✅ Clasificación actualizada: ${standings.length} equipos`);
  } catch (error) {
    console.error('❌ Error al obtener clasificación de SofaScore:', error.message);
  }
}

module.exports = { obtenerClasificacion };
