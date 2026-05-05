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
  console.log('[SofaScore] Sync automático desactivado en servidor. Usar script local sync-jugadores.js');
};

module.exports = { sincronizarJugadores };
