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
  console.log('[SofaScore] Iniciando sincronización de plantilla...');

  try {
    // 1. Obtener jugadores del equipo
    const urlPlantilla = `https://api.sofascore.com/api/v1/team/${TEAM_ID}/players`;
    const { data: plantillaData } = await axios.get(urlPlantilla, { headers: HEADERS });
    const players = plantillaData.players || [];
    console.log(`[SofaScore] ${players.length} jugadores encontrados`);

    if (!players.length) {
      console.log('[SofaScore] Sin jugadores devueltos por la API');
      return;
    }

    // 2. Obtener stats de temporada por jugador
    let statsMap = {};
    try {
      await delay(1500);
      const urlStats = `https://api.sofascore.com/api/v1/team/${TEAM_ID}/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/statistics/overall`;
      const { data: statsData } = await axios.get(urlStats, { headers: HEADERS });
      const statsRows = statsData.topPlayers || {};
      // statsRows tiene categorías: goals, assists, etc. — mapear por playerId
      for (const [categoria, lista] of Object.entries(statsRows)) {
        if (!Array.isArray(lista)) continue;
        for (const item of lista) {
          const pid = item.player?.id;
          if (!pid) continue;
          if (!statsMap[pid]) statsMap[pid] = {};
          if (categoria === 'goals') statsMap[pid].goles = item.statistics?.goals ?? 0;
          if (categoria === 'goalAssist') statsMap[pid].asistencias = item.statistics?.goalAssist ?? 0;
          if (categoria === 'minutesPlayed') statsMap[pid].minutosJugados = item.statistics?.minutesPlayed ?? 0;
          if (categoria === 'appearances') statsMap[pid].partidos = item.statistics?.appearances ?? 0;
          if (categoria === 'yellowCards') statsMap[pid].tarjetasAmarillas = item.statistics?.yellowCards ?? 0;
          if (categoria === 'redCards') statsMap[pid].tarjetasRojas = item.statistics?.redCards ?? 0;
          if (categoria === 'rating') statsMap[pid].rating = item.statistics?.rating ?? null;
        }
      }
    } catch (err) {
      console.warn('[SofaScore] No se pudieron obtener stats de temporada:', err.message);
    }

    let procesados = 0;
    for (const { player } of players) {
      try {
        await delay(300);
        const pos = mapPosicion(player.position);
        const foto = `https://api.sofascore.com/api/v1/player/${player.id}/image`;

        await Jugador.upsert({
          sofascoreId: player.id,
          nombre: player.name,
          nombreCorto: player.shortName || player.name,
          posicion: pos,
          dorsal: player.jerseyNumber ? parseInt(player.jerseyNumber) : null,
          foto,
          edad: player.dateOfBirthTimestamp
            ? Math.floor((Date.now() / 1000 - player.dateOfBirthTimestamp) / (365.25 * 86400))
            : null,
          nacionalidad: player.country?.name || null,
          altura: player.height || null,
          piePref: player.preferredFoot || null,
          valorMercado: player.proposedMarketValue || null,
        });

        const jugador = await Jugador.findOne({ where: { sofascoreId: player.id } });
        const st = statsMap[player.id] || {};

        await JugadorStats.upsert({
          jugadorId: jugador.id,
          temporada: TEMPORADA,
          goles: st.goles ?? 0,
          asistencias: st.asistencias ?? 0,
          minutosJugados: st.minutosJugados ?? 0,
          partidos: st.partidos ?? 0,
          titularidades: st.titularidades ?? 0,
          tarjetasAmarillas: st.tarjetasAmarillas ?? 0,
          tarjetasRojas: st.tarjetasRojas ?? 0,
          disparos: st.disparos ?? 0,
          disparosPuerta: st.disparosPuerta ?? 0,
          rating: st.rating ?? null,
        }, { conflictFields: ['jugadorId', 'temporada'] });

        procesados++;
      } catch (err) {
        console.error(`[SofaScore] Error jugador ${player.id}: ${err.message}`);
      }
    }

    console.log(`[SofaScore] Sync completado: ${procesados}/${players.length} jugadores procesados`);
  } catch (err) {
    console.error('[SofaScore] Error general en sincronización:', err.message);
    throw err;
  }
};

module.exports = { sincronizarJugadores };
