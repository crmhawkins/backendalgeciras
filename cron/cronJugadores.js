const cron = require('node-cron');
const { sincronizarJugadores } = require('../services/sofascoreService');

// Sync diario 4:00 AM
cron.schedule('0 4 * * *', async () => {
  console.log('[CronJugadores] Iniciando sync plantilla SofaScore...');
  await sincronizarJugadores();
  console.log('[CronJugadores] Sync completado.');
});
