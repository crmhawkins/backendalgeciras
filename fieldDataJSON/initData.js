const fs = require('fs').promises;
const path = require('path');

const ASIENTOS_DIR = path.resolve(__dirname, 'asientos');

async function actualizarIdsAsientos() {
  let idCounter = 1;

  const carpetas = await fs.readdir(ASIENTOS_DIR);

  for (const carpeta of carpetas.sort()) {
    const carpetaPath = path.join(ASIENTOS_DIR, carpeta);
    const stat = await fs.stat(carpetaPath);
    if (!stat.isDirectory()) continue;

    const archivos = (await fs.readdir(carpetaPath)).filter(file => file.endsWith('.json'));

    for (const archivo of archivos.sort()) {
      const archivoPath = path.join(carpetaPath, archivo);
      const contenido = await fs.readFile(archivoPath, 'utf-8');
      const asientos = JSON.parse(contenido);

      for (const asiento of asientos) {
        asiento.id = idCounter++;
      }

      await fs.writeFile(archivoPath, JSON.stringify(asientos, null, 2));
      console.log(`✅ IDs actualizados en ${archivo}`);
    }
  }

  console.log('🎉 Todos los archivos han sido actualizados correctamente.');
}

actualizarIdsAsientos().catch(err => {
  console.error('❌ Error actualizando los archivos:', err);
});
