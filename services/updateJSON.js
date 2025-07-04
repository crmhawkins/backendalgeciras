const fs = require('fs');
const path = require('path');
const { Sector } = require('../models/sector');

// Actualiza el estado del asiento y comprueba si debe desactivarse el sector
const actualizarJSONAsiento = async (asientoId, nuevoEstado) => {
    const asientosDir = path.join(__dirname, '../fieldDataJSON/asientos');
    const sectoresDir = path.join(__dirname, '../fieldDataJSON/sectores');

    const subdirs = fs.readdirSync(asientosDir).filter(d =>
        fs.lstatSync(path.join(asientosDir, d)).isDirectory()
    );

    let sectorIdEncontrado = null;

    for (const subdir of subdirs) {
        const files = fs.readdirSync(path.join(asientosDir, subdir)).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(asientosDir, subdir, file);
            const raw = fs.readFileSync(filePath);
            const data = JSON.parse(raw);

            let found = false;

            for (const asiento of data) {
                if (asiento.id === asientoId) {
                    asiento.estado = nuevoEstado;
                    sectorIdEncontrado = asiento.sectorId;
                    found = true;
                    break;
                }
            }

            if (found) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                break;
            }
        }
    }

    // Si encontramos el asiento y tiene un sector, revisamos si todos están ocupados
    if (sectorIdEncontrado !== null) {
        const todosOcupados = await verificarTodosOcupados(sectorIdEncontrado);
        if (todosOcupados) {
            await actualizarEstadoSector(sectorIdEncontrado, 0, sectoresDir);
        }
    }

    return true;
};

// Verifica si todos los asientos de un sector están ocupados
const verificarTodosOcupados = async (sectorId) => {
    const asientosDir = path.join(__dirname, '../fieldDataJSON/asientos');
    const subdirs = fs.readdirSync(asientosDir).filter(d =>
        fs.lstatSync(path.join(asientosDir, d)).isDirectory()
    );

    let total = 0;
    let ocupados = 0;

    for (const subdir of subdirs) {
        const files = fs.readdirSync(path.join(asientosDir, subdir)).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(asientosDir, subdir, file);
            const raw = fs.readFileSync(filePath);
            const data = JSON.parse(raw);

            for (const asiento of data) {
                if (asiento.sectorId === sectorId) {
                    total++;
                    if (asiento.estado === 'ocupado') {
                        ocupados++;
                    }
                }
            }
        }
    }

    return total > 0 && total === ocupados;
};

const actualizarEstadoSector = async (sectorId, nuevoActivo, sectoresDir) => {
    const files = fs.readdirSync(sectoresDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(sectoresDir, file);
        const raw = fs.readFileSync(filePath);
        const data = JSON.parse(raw);

        let found = false;

        for (const sector of data) {
            if (sector.id === sectorId) {
                sector.activo = nuevoActivo;
                found = true;
                break;
            }
        }

        if (found) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            try {
                await Sector.update(
                    { activo: nuevoActivo },
                    { where: { id: sectorId } }
                );
                console.log(`Sector ${sectorId} actualizado en BD a activo = ${nuevoActivo}`);
            } catch (e) {
                console.error(`Error al actualizar sector ${sectorId} en la base de datos:`, e);
            }

            return true;
        }
    }

    return false;
};


module.exports = {
    actualizarJSONAsiento
};
