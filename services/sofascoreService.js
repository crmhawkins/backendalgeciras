const axios = require('axios');
const Jugador = require('../models/jugador');
const JugadorStats = require('../models/jugadorStats');

const TEAM_ID = 4489;
const TOURNAMENT_ID = 17073;
const SEASON_ID = 77727;
const TEMPORADA = '2025/2026';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.sofascore.com/',
  'Origin': 'https://www.sofascore.com',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mapPosicion = (pos) => {
  if (!pos) return null;
  const map = { G: 'G', D: 'D', M: 'M', F: 'F' };
  return map[pos] || pos;
};

const sincronizarJugadores = async () => {
  console.log('[SofaScore] Iniciando sincronización de jugadores...');

  let players;
  try {
    const res = await axios.get(`https://www.sofascore.com/api/v1/team/${TEAM_ID}/players`, { headers: HEADERS });
    players = res.data.players;
    console.log(`[SofaScore] Plantilla obtenida: ${players ? players.length : 0} jugadores. Keys: ${Object.keys(res.data).join(',')}`);
  } catch (err) {
    console.error('[SofaScore] Error obteniendo plantilla:', err.message, err.response?.status, JSON.stringify(err.response?.data)?.substring(0, 200));
    return;
  }

  for (const entry of players) {
    const p = entry.player;
    if (!p || !p.id) continue;

    try {
      const fotoUrl = `https://api.sofascore.app/api/v1/player/${p.id}/image`;

      const datos = {
        sofascoreId: p.id,
        nombre: p.name || '',
        nombreCorto: p.shortName || null,
        posicion: mapPosicion(p.position),
        dorsal: entry.shirtNumber || null,
        edad: p.dateOfBirthTimestamp
          ? Math.floor((Date.now() / 1000 - p.dateOfBirthTimestamp) / (365.25 * 24 * 3600))
          : null,
        nacionalidad: p.nationality || null,
        foto: fotoUrl,
        altura: p.height || null,
        piePref: p.preferredFoot || null,
        valorMercado: p.proposedMarketValue || null
      };

      await Jugador.upsert(datos);
      const jugador = await Jugador.findOne({ where: { sofascoreId: p.id } });

      console.log(`[SofaScore] Jugador upsert OK: ${p.name} (id=${jugador.id})`);

      await delay(300);

      try {
        const statsRes = await axios.get(
          `https://www.sofascore.com/api/v1/player/${p.id}/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/statistics/overall`,
          { headers: HEADERS }
        );
        const s = statsRes.data.statistics || {};

        await JugadorStats.upsert({
          jugadorId: jugador.id,
          temporada: TEMPORADA,
          goles: s.goals || 0,
          asistencias: s.assists || 0,
          minutosJugados: s.minutesPlayed || 0,
          partidos: s.appearances || 0,
          titularidades: s.matchesStarted || 0,
          tarjetasAmarillas: s.yellowCards || 0,
          tarjetasRojas: s.directRedCards || 0,
          disparos: s.totalShots || 0,
          disparosPuerta: s.shotsOnTarget || 0,
          rating: s.rating || null
        }, {
          conflictFields: ['jugadorId', 'temporada']
        });

        console.log(`[SofaScore] Stats upsert OK: ${p.name}`);
      } catch (statsErr) {
        console.error(`[SofaScore] Error stats jugador ${p.name} (id=${p.id}):`, statsErr.message);
      }

      await delay(300);

    } catch (err) {
      console.error(`[SofaScore] Error procesando jugador id=${p.id}:`, err.message);
    }
  }

  console.log('[SofaScore] Sincronización completada.');
};

module.exports = { sincronizarJugadores };
