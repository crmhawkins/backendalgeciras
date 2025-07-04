export async function cargarMapaSVG(containerId) {
    const container = document.getElementById(containerId);
    const res = await fetch("imagenes/campo.svg");
    const svgText = await res.text();
    container.innerHTML = svgText;
}

export async function fetchSectoresConLibres(partidoId) {
    const res = await fetch("/api/sectores");
    const data = await res.json();
    const sectores = await Promise.all(
        data.sectores.map(async s => {
            const libres = await fetchLibresPorSector(s.id, partidoId);
            return { ...s, libres };
        })
    );
    return sectores;
}

export async function fetchLibresPorSector(sectorId, partidoId) {
    const res = await fetch(`/api/asientos/sector/${sectorId}?partidoId=${partidoId}`);
    const data = await res.json();
    return data.asientos.filter(a => a.estado === 'disponible').length;
}

export async function fetchAsientosDisponibles(sectorId, partidoId) {
    const res = await fetch(`/api/asientos/sector/${sectorId}?partidoId=${partidoId}`);
    const data = await res.json();
    return data.asientos;
}
