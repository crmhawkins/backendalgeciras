/**
 * Importación inicial desde compralaentrada.com
 * Crea Gradas, Sectores y Asientos en la BD local
 * Uso: node scripts/importInitialData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fetch = require('node-fetch');
const { dbConnection } = require('../database/config');
const Grada = require('../models/grada');
const Sector = require('../models/sector');
const Asiento = require('../models/asiento');

const BASE_URL = 'https://apiteatros.compralaentrada.com/api1/f';
const TID = '9qXku4wevkdoDedmyHn7';
const TIMEOUT_MS = 8000;

const fetchT = (url) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
};

// Asigna una Grada a cada zona según nombre
const gradaDeZona = (nombre) => {
    const n = nombre.toUpperCase();
    if (n.includes('TRIBUNA BAJA')) return { id: 1, nombre: 'Tribuna Baja' };
    if (n.includes('TRIBUNA ALTA')) return { id: 2, nombre: 'Tribuna Alta' };
    if (n.includes('TRIBUNA'))      return { id: 1, nombre: 'Tribuna Baja' };
    if (n.includes('PREFERENTE'))   return { id: 3, nombre: 'Preferente' };
    if (n.includes('FONDO NORTE') || n.includes('FONDO_NORTE')) return { id: 4, nombre: 'Fondo Norte' };
    if (n.includes('FONDO SUR')   || n.includes('FONDO_SUR'))   return { id: 5, nombre: 'Fondo Sur' };
    if (n.includes('FONDO'))        return { id: 4, nombre: 'Fondo Norte' };
    if (n.includes('SIMPATIZANTE')) return { id: 6, nombre: 'Simpatizantes' };
    if (n.includes('HONOR'))        return { id: 7, nombre: 'Socios de Honor' };
    return { id: 8, nombre: 'General' };
};

const precioDeZona = (zona) => {
    if (zona.precios && zona.precios.length > 0) {
        const precios = zona.precios.map(p => parseFloat(p.precio || p.price || p.importe || 0)).filter(p => p > 0);
        if (precios.length > 0) return Math.min(...precios);
    }
    const n = (zona.name || '').toUpperCase();
    if (n.includes('TRIBUNA BAJA'))  return 120;
    if (n.includes('TRIBUNA ALTA'))  return 100;
    if (n.includes('TRIBUNA'))       return 110;
    if (n.includes('PREFERENTE'))    return 75;
    if (n.includes('FONDO'))         return 60;
    return 60;
};

const run = async () => {
    console.log('Conectando a BD...');
    await dbConnection();
    console.log('BD conectada\n');

    // 1. Obtener todas las zonas
    console.log('Obteniendo zonas de compralaentrada...');
    const res = await fetchT(`${BASE_URL}/zonas?renovacion=0&tid=${TID}`);
    if (!res.ok) throw new Error(`API zonas respondió ${res.status}`);
    const json = await res.json();
    const zonas = json.data || [];
    console.log(`${zonas.length} zonas encontradas\n`);

    // 2. Crear gradas únicas
    const gradasMap = {};
    for (const z of zonas) {
        const g = gradaDeZona(z.name || '');
        gradasMap[g.id] = g.nombre;
    }
    console.log('Creando gradas...');
    for (const [id, nombre] of Object.entries(gradasMap)) {
        await Grada.upsert({ id: parseInt(id), nombre });
        console.log(`  Grada ${id}: ${nombre}`);
    }
    console.log();

    // 3. Crear sectores
    console.log('Creando sectores...');
    for (const z of zonas) {
        const g = gradaDeZona(z.name || '');
        const precio = precioDeZona(z);
        await Sector.upsert({
            id: z.id,
            nombre: z.name,
            capacidad: z.total_asientos || 0,
            precio,
            gradaId: g.id,
            activo: true
        });
        console.log(`  Sector ${z.id}: ${z.name} (cap=${z.total_asientos}, precio=${precio}€, grada=${g.nombre})`);
    }
    console.log();

    // 4. Crear asientos
    console.log('Importando asientos (puede tardar)...');
    let totalAsientos = 0;
    let asientoId = 1;

    for (const z of zonas) {
        if (!z.esta_disponible && z.total_asientos === 0) {
            console.log(`  Zona ${z.id} (${z.name}): sin asientos disponibles, skip`);
            continue;
        }

        let asientosApi = [];
        try {
            const ra = await fetchT(`${BASE_URL}/zonas/${z.id}/asientos?tid=${TID}`);
            if (ra.ok) {
                const ja = await ra.json();
                asientosApi = ja.data || ja.asientos || [];
            }
        } catch (e) {
            console.warn(`  Zona ${z.id}: no se pudieron obtener asientos (${e.message})`);
        }

        if (asientosApi.length === 0) {
            console.log(`  Zona ${z.id} (${z.name}): sin detalle de asientos`);
            continue;
        }

        let zonCount = 0;
        for (const a of asientosApi) {
            const fila = String(a.fila || '1');
            const numero = String(a.butaca || a.numero || a.id || asientoId);
            const libre =
                a.estado === 'libre' || a.estado === 'disponible' ||
                a.disponible === true || a.disponible === 1 ||
                a.libre === true || a.libre === 1;

            await Asiento.upsert({
                id: asientoId++,
                numero,
                fila,
                estado: libre ? 'disponible' : 'ocupado',
                sectorId: z.id
            });
            zonCount++;
        }
        totalAsientos += zonCount;
        console.log(`  Zona ${z.id} (${z.name}): ${zonCount} asientos`);
    }

    console.log(`\nImportación completada:`);
    console.log(`  Gradas:   ${Object.keys(gradasMap).length}`);
    console.log(`  Sectores: ${zonas.length}`);
    console.log(`  Asientos: ${totalAsientos}`);
    process.exit(0);
};

run().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});
