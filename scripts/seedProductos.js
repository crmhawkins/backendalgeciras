'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../database/config');
const Producto = require('../models/producto');
const { seedProductos } = require('./seedProductosData');

async function main() {
  await db.authenticate();
  console.log('DB conectada');
  await Producto.sync();

  const count = await Producto.count();
  if (count > 0) {
    console.log(`Ya hay ${count} productos. Skipping.`);
    process.exit(0);
  }

  await seedProductos(Producto);
  console.log('Productos sembrados');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
