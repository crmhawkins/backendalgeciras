'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../database/config');
const Clasificacion = require('../models/clasificacion');

const data = [
  { posicion: 1,  equipo: 'Marbella FC',          escudo: null, pj: 34, gf: 62, gc: 28, puntos: 68 },
  { posicion: 2,  equipo: 'Real Murcia CF',        escudo: null, pj: 34, gf: 55, gc: 30, puntos: 65 },
  { posicion: 3,  equipo: 'Algeciras CF',          escudo: 'https://backend-algeciras.hawkins.es/acf/2025/01/escudoAlgeSvg.png', pj: 34, gf: 48, gc: 35, puntos: 57 },
  { posicion: 4,  equipo: 'Villanovense',          escudo: null, pj: 34, gf: 44, gc: 36, puntos: 54 },
  { posicion: 5,  equipo: 'CD Linense',            escudo: null, pj: 34, gf: 43, gc: 38, puntos: 51 },
  { posicion: 6,  equipo: 'Deportivo Minero',      escudo: null, pj: 34, gf: 40, gc: 39, puntos: 48 },
  { posicion: 7,  equipo: 'Yeclano Deportivo',     escudo: null, pj: 34, gf: 38, gc: 40, puntos: 47 },
  { posicion: 8,  equipo: 'FC Cartagena B',        escudo: null, pj: 34, gf: 36, gc: 42, puntos: 44 },
  { posicion: 9,  equipo: 'Almería B',             escudo: null, pj: 34, gf: 35, gc: 43, puntos: 43 },
  { posicion: 10, equipo: 'Recreativo Granada',    escudo: null, pj: 34, gf: 34, gc: 44, puntos: 42 },
  { posicion: 11, equipo: 'Lorca FC',              escudo: null, pj: 34, gf: 33, gc: 45, puntos: 40 },
  { posicion: 12, equipo: 'Mar Menor FC',          escudo: null, pj: 34, gf: 32, gc: 46, puntos: 39 },
  { posicion: 13, equipo: 'CD El Palo',            escudo: null, pj: 34, gf: 31, gc: 47, puntos: 37 },
  { posicion: 14, equipo: 'CD Vélez',              escudo: null, pj: 34, gf: 30, gc: 48, puntos: 36 },
  { posicion: 15, equipo: 'Cartagena FC',          escudo: null, pj: 34, gf: 29, gc: 49, puntos: 34 },
  { posicion: 16, equipo: 'CD Castellón B',        escudo: null, pj: 34, gf: 27, gc: 52, puntos: 31 },
  { posicion: 17, equipo: 'Racing Murcia',         escudo: null, pj: 34, gf: 25, gc: 55, puntos: 28 },
  { posicion: 18, equipo: 'Pulpileño CF',          escudo: null, pj: 34, gf: 22, gc: 58, puntos: 24 },
];

async function seedClasificacion(Clasificacion) {
  for (const item of data) {
    await Clasificacion.upsert(item, { conflictFields: ['equipo'] });
    console.log(`OK: ${item.equipo}`);
  }
  console.log('Clasificacion sembrada correctamente');
}

async function main() {
  await db.authenticate();
  console.log('DB conectada');
  await Clasificacion.sync();
  await seedClasificacion(Clasificacion);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

module.exports = { seedClasificacion };
