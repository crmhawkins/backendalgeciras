const fs = require('fs').promises;
const path = require('path');
const Asiento = require('../models/asiento');
const Sector = require('../models/sector');
const Grada = require('../models/grada');

async function insertGradas() {
  const gradasData = JSON.parse(await fs.readFile('./fieldDataJSON/gradas.json', 'utf-8'));

  for (const grada of gradasData) {
    await Grada.create(grada);
  }

  console.log('✅ Gradas insertadas una a una');
}

async function insertSectores() {
  const sectorFiles = await fs.readdir('./fieldDataJSON/sectores');

  for (const file of sectorFiles) {
    const data = JSON.parse(await fs.readFile(`./fieldDataJSON/sectores/${file}`, 'utf-8'));

    for (const sector of data) {
      await Sector.create(sector);
    }

    console.log(`✅ Sectores insertados desde ${file}`);
  }
}

async function insertAsientos() {
  const zonas = await fs.readdir('./fieldDataJSON/asientos');

  for (const zona of zonas) {
    const zonaPath = path.join('./fieldDataJSON/asientos', zona);
    const asientoFiles = await fs.readdir(zonaPath);

    for (const file of asientoFiles) {
      const data = JSON.parse(await fs.readFile(path.join(zonaPath, file), 'utf-8'));

      for (const asiento of data) {
        await Asiento.create(asiento);
      }

      console.log(`✅ Asientos insertados desde ${file}`);
    }
  }
}

module.exports = {
  insertGradas,
  insertSectores,
  insertAsientos,
};
