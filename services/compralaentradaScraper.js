const fetch = require('node-fetch');
const Asiento = require('../models/asiento');
const Sector = require('../models/sector');

const BASE_URL = 'https://apiteatros.compralaentrada.com/api1/f';
const TID = process.env.COMPRALAENTRADA_TID || '9qXku4wevkdoDedmyHn7';
const TIMEOUT_MS = 8000;

const fetchJson = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
};

/**
 * Obtiene el partido activo (próximo) con sus IDs de evento y sesión
 */
const obtenerPartidoActivo = async () => {
    const json = await fetchJson(`${BASE_URL}/partidos?tid=${TID}`);
    const partidos = json.data || [];
    if (!partidos.length) return null;
    // Primer partido disponible (orden API = más próximo)
    const p = partidos[0];
    return { eventoId: p.id, sesionId: p.sesion_id, nombre: p.name };
};

/**
 * Obtiene las zonas disponibles para un partido concreto
 */
const obtenerZonasPartido = async (eventoId, sesionId) => {
    const json = await fetchJson(
        `${BASE_URL}/zonas?evento_id=${eventoId}&sesion_id=${sesionId}&tid=${TID}`
    );
    return json.data || [];
};

/**
 * Obtiene el detalle de butacas de una zona con estado ocupado/libre
 * Solo funciona con zonas que tienen with_seats=1
 */
const obtenerButacasZona = async (zonaId, eventoId, sesionId) => {
    const json = await fetchJson(
        `${BASE_URL}/zonas/${zonaId}?conf=true&evento_id=${eventoId}&sesion_id=${sesionId}&tid=${TID}&zona_id=${zonaId}`
    );
    const data = json.data || {};
    // configuracion = { "1": [{asiento, ocupado, ...}], "2": [...], ... }
    return data.configuracion || null;
};

/**
 * Sincronización completa de butacas con compralaentrada
 * Itera todas las zonas con butacas individuales y actualiza estado en BD
 */
const sincronizarButacasDesdeCompralaentrada = async () => {
    const partido = await obtenerPartidoActivo();
    if (!partido) {
        console.log('[scraper] Sin partidos activos en compralaentrada');
        return { ok: false, msg: 'Sin partidos activos' };
    }

    const { eventoId, sesionId, nombre } = partido;
    console.log(`[scraper] Partido: ${nombre} (evento=${eventoId}, sesion=${sesionId})`);

    const zonas = await obtenerZonasPartido(eventoId, sesionId);
    const zonasConButacas = zonas.filter(z => z.with_seats === 1);

    console.log(`[scraper] ${zonas.length} zonas total, ${zonasConButacas.length} con butacas individuales`);

    let totalActualizadas = 0;
    let totalOcupadas = 0;
    let totalLibres = 0;
    const errores = [];

    for (const zona of zonasConButacas) {
        try {
            const configuracion = await obtenerButacasZona(zona.id, eventoId, sesionId);
            if (!configuracion) continue;

            // Verificar que existe el sector local con ese ID
            const sector = await Sector.findByPk(zona.id);
            if (!sector) continue;

            for (const [fila, butacas] of Object.entries(configuracion)) {
                if (!Array.isArray(butacas)) continue;
                for (const butaca of butacas) {
                    const estadoNuevo = butaca.ocupado ? 'ocupado' : 'disponible';
                    const [count] = await Asiento.update(
                        { estado: estadoNuevo },
                        { where: { sectorId: sector.id, fila: String(fila), numero: butaca.asiento } }
                    );
                    if (count > 0) totalActualizadas++;
                    if (butaca.ocupado) totalOcupadas++;
                    else totalLibres++;
                }
            }

            console.log(`[scraper] Zona ${zona.id} (${zona.name}): ${zona.libres} libres / ${zona.total_asientos} total`);
        } catch (err) {
            console.warn(`[scraper] Error zona ${zona.id}: ${err.message}`);
            errores.push({ zonaId: zona.id, error: err.message });
        }
    }

    console.log(`[scraper] Completado: ${totalActualizadas} butacas actualizadas (${totalOcupadas} ocupadas, ${totalLibres} libres), ${errores.length} errores`);
    return { ok: true, eventoId, sesionId, totalActualizadas, totalOcupadas, totalLibres, errores };
};

module.exports = { sincronizarButacasDesdeCompralaentrada, obtenerPartidoActivo };
