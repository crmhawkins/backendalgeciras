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
        const ps = zona.precios.map(p => parseFloat(p.precio || p.price || p.importe || 0)).filter(p => p > 0);
        if (ps.length > 0) return Math.min(...ps);
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

    console.log('Obteniendo zonas de compralaentrada...');
    const res = await fetchT(`${BASE_URL}/zonas?renovacion=0&tid=${TID}`);
    if (!res.ok) throw new Error(`API zonas respondió ${res.status}`);
    const json = await res.json();
    const zonas = (json.data || []).filter(z => z.total_asientos > 0);
    console.log(`${zonas.length} zonas con asientos\n`);

    // Gradas únicas
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

    // Sectores
    console.log('Creando sectores...');
    for (const z of zonas) {
        const g = gradaDeZona(z.name || '');
        await Sector.upsert({
            id: z.id,
            nombre: z.name,
            capacidad: z.total_asientos,
            precio: precioDeZona(z),
            gradaId: g.id,
            activo: true
        });
        console.log(`  Sector ${z.id}: ${z.name} (cap=${z.total_asientos}, precio=${precioDeZona(z)}€)`);
    }
    console.log();

    // Asientos — intentar API primero, si no → generar sintético
    console.log('Importando asientos...');
    let totalAsientos = 0;
    let asientoId = 1;

    for (const z of zonas) {
        // Intentar obtener asientos reales de la API
        let asientosApi = [];
        try {
            const ra = await fetchT(`${BASE_URL}/zonas/${z.id}/asientos?tid=${TID}`);
            if (ra.ok) {
                const ja = await ra.json();
                asientosApi = ja.data || ja.asientos || [];
            }
        } catch (e) { /* ignorar */ }

        if (asientosApi.length > 0) {
            // Asientos reales desde API
            for (const a of asientosApi) {
                const fila = String(a.fila || '1');
                const numero = String(a.butaca || a.numero || a.id || asientoId);
                const libre = a.estado === 'libre' || a.estado === 'disponible' ||
                    a.disponible === true || a.disponible === 1 ||
                    a.libre === true || a.libre === 1;
                await Asiento.upsert({
                    id: asientoId++,
                    numero,
                    fila,
                    estado: libre ? 'disponible' : 'ocupado',
                    sectorId: z.id
                });
            }
            console.log(`  Zona ${z.id} (${z.name}): ${asientosApi.length} asientos (API)`);
            totalAsientos += asientosApi.length;
        } else {
            // Generar sintético desde rows × seats_row
            const filas = z.rows || Math.ceil(z.total_asientos / 15) || 6;
            const porFila = z.seats_row || Math.ceil(z.total_asientos / filas) || 15;
            let generados = 0;
            for (let f = 1; f <= filas && generados < z.total_asientos; f++) {
                for (let s = 1; s <= porFila && generados < z.total_asientos; s++) {
                    await Asiento.upsert({
                        id: asientoId++,
                        numero: String(s),
                        fila: String(f),
                        estado: 'disponible',
                        sectorId: z.id
                    });
                    generados++;
                }
            }
            console.log(`  Zona ${z.id} (${z.name}): ${generados} asientos (sintético)`);
            totalAsientos += generados;
        }
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
