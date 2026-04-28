const fetch = require('node-fetch');
const Sector = require('../models/sector');
const Asiento = require('../models/asiento');

const BASE_URL = 'https://apiteatros.compralaentrada.com/api1/f';
const TID = '9qXku4wevkdoDedmyHn7';
const TIMEOUT_MS = 5000;

/**
 * fetch con timeout de 5 segundos
 */
const fetchConTimeout = (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, { signal: controller.signal })
        .finally(() => clearTimeout(timer));
};

/**
 * Devuelve array de zonas con disponibilidad desde compralaentrada
 */
const obtenerZonas = async () => {
    const url = `${BASE_URL}/zonas?renovacion=0&tid=${TID}`;
    const res = await fetchConTimeout(url);
    if (!res.ok) throw new Error(`compralaentrada /zonas respondió ${res.status}`);
    const json = await res.json();
    return json.data || [];
};

/**
 * Verifica si un asiento específico está libre en compralaentrada
 * @param {number|string} zonaId
 * @param {number|string} fila
 * @param {number|string} butaca
 * @returns {Promise<boolean>} true = libre
 */
const verificarAsientoEnCompralaentrada = async (zonaId, fila, butaca) => {
    const url = `${BASE_URL}/zonas/${zonaId}/asientos?tid=${TID}`;
    const res = await fetchConTimeout(url);
    if (!res.ok) throw new Error(`compralaentrada /zonas/${zonaId}/asientos respondió ${res.status}`);
    const json = await res.json();
    const asientos = json.data || json.asientos || [];

    // Buscar el asiento por fila y butaca
    const asiento = asientos.find(
        (a) =>
            String(a.fila) === String(fila) &&
            (String(a.butaca) === String(butaca) || String(a.numero) === String(butaca))
    );

    if (!asiento) {
        // Asiento no encontrado en la respuesta: asumir libre (fail-open)
        console.warn(`[compralaentrada] Asiento fila=${fila} butaca=${butaca} no encontrado en zona ${zonaId}`);
        return true;
    }

    // estado: 'libre', 'disponible', 1, true → libre
    const libre =
        asiento.estado === 'libre' ||
        asiento.estado === 'disponible' ||
        asiento.disponible === true ||
        asiento.disponible === 1 ||
        asiento.libre === true ||
        asiento.libre === 1;

    return libre;
};

/**
 * Disponibilidad de una zona: {total, libres, ocupados}
 * @param {number|string} zonaId
 */
const obtenerDisponibilidadZona = async (zonaId) => {
    const url = `${BASE_URL}/zonas?renovacion=0&tid=${TID}`;
    const res = await fetchConTimeout(url);
    if (!res.ok) throw new Error(`compralaentrada /zonas respondió ${res.status}`);
    const json = await res.json();
    const zonas = json.data || [];

    const zona = zonas.find((z) => String(z.id) === String(zonaId));
    if (!zona) throw new Error(`Zona ${zonaId} no encontrada en compralaentrada`);

    const total = zona.total_asientos || 0;
    const libres = zona.libres || 0;
    const ocupados = total - libres;

    return { total, libres, ocupados };
};

/**
 * Sincroniza sectores y asientos con BD local
 * - Actualiza capacidad del Sector si difiere
 * - Marca asientos como 'ocupado'/'disponible' según compralaentrada
 */
const sincronizarZonas = async () => {
    const zonas = await obtenerZonas();
    const resultados = [];

    for (const zona of zonas) {
        try {
            // Intentar mapear zona compralaentrada → Sector BD por id
            const sector = await Sector.findByPk(zona.id);

            if (!sector) {
                resultados.push({ zonaId: zona.id, nombre: zona.name, estado: 'sin_sector_local' });
                continue;
            }

            // Actualizar capacidad si difiere
            if (sector.capacidad !== zona.total_asientos) {
                sector.capacidad = zona.total_asientos;
                await sector.save();
            }

            // Sincronizar asientos si la zona está disponible
            if (!zona.esta_disponible) {
                resultados.push({ zonaId: zona.id, nombre: zona.name, estado: 'zona_no_disponible' });
                continue;
            }

            // Obtener asientos de la zona desde compralaentrada
            let asientosApi = [];
            try {
                const urlAsientos = `${BASE_URL}/zonas/${zona.id}/asientos?tid=${TID}`;
                const resAsientos = await fetchConTimeout(urlAsientos);
                if (resAsientos.ok) {
                    const jsonAsientos = await resAsientos.json();
                    asientosApi = jsonAsientos.data || jsonAsientos.asientos || [];
                }
            } catch (errAsientos) {
                console.warn(`[compralaentrada sync] No se pudieron obtener asientos de zona ${zona.id}:`, errAsientos.message);
            }

            let actualizados = 0;

            if (asientosApi.length > 0) {
                for (const a of asientosApi) {
                    const fila = a.fila;
                    const numero = a.butaca || a.numero;
                    const libre =
                        a.estado === 'libre' ||
                        a.estado === 'disponible' ||
                        a.disponible === true ||
                        a.disponible === 1 ||
                        a.libre === true ||
                        a.libre === 1;

                    const estadoNuevo = libre ? 'disponible' : 'ocupado';

                    const [count] = await Asiento.update(
                        { estado: estadoNuevo },
                        { where: { sectorId: sector.id, fila, numero } }
                    );
                    actualizados += count;
                }
            } else {
                // Sin detalle de asientos: usar libres/total para marcar por bloque
                // Solo actualizamos si podemos inferir: si libres === 0 → todos ocupados
                if (zona.libres === 0) {
                    const [count] = await Asiento.update(
                        { estado: 'ocupado' },
                        { where: { sectorId: sector.id } }
                    );
                    actualizados += count;
                }
            }

            resultados.push({
                zonaId: zona.id,
                nombre: zona.name,
                estado: 'sincronizado',
                total: zona.total_asientos,
                libres: zona.libres,
                asientosActualizados: actualizados
            });
        } catch (err) {
            console.error(`[compralaentrada sync] Error en zona ${zona.id}:`, err.message);
            resultados.push({ zonaId: zona.id, nombre: zona.name, estado: 'error', error: err.message });
        }
    }

    return resultados;
};

module.exports = {
    obtenerZonas,
    verificarAsientoEnCompralaentrada,
    obtenerDisponibilidadZona,
    sincronizarZonas
};
