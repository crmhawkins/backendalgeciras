const traduccionesSectores = {
    "North Goal Odd 9": "FONDO NORTE IMPAR 9",
    "North Goal Odd 8": "FONDO NORTE IMPAR 8",
    "North Goal Odd 7": "FONDO NORTE IMPAR 7",
    "North Goal Odd 6": "FONDO NORTE IMPAR 6",
    "North Goal Odd 5": "FONDO NORTE IMPAR 5",
    "North Goal Even 4": "FONDO NORTE PAR 4",
    "North Goal Even 3": "FONDO NORTE PAR 3",
    "North Goal Even 2": "FONDO NORTE PAR 2",
    "North Goal Even 1": "FONDO NORTE PAR 1",
    "Main S. - Lower Odd 14": "TRIBUNA BAJA IMPAR 14",
    "Main S. - Lower Odd 13": "TRIBUNA BAJA IMPAR 13",
    "Main S. - Lower Odd 12": "TRIBUNA BAJA IMPAR 12",
    "Main S. - Lower Odd 11": "TRIBUNA BAJA IMPAR 11",
    "Main S. - Lower Odd 10": "TRIBUNA BAJA IMPAR 10",
    "Main S. - Lower Odd 9": "TRIBUNA BAJA IMPAR 9",
    "Main S. - Lower Odd 8": "TRIBUNA BAJA IMPAR 8",
    "Main S. - Lower Even 7": "TRIBUNA BAJA PAR 7",
    "Main S. - Lower Even 6": "TRIBUNA BAJA PAR 6",
    "Main S. - Lower Even 5": "TRIBUNA BAJA PAR 5",
    "Main S. - Lower Even 4": "TRIBUNA BAJA PAR 4",
    "Main S. - Lower Even 3": "TRIBUNA BAJA PAR 3",
    "Main S. - Lower Even 2": "TRIBUNA BAJA PAR 2",
    "Main S. - Lower Even 1": "TRIBUNA BAJA PAR 1",
    "Main S. - Higher Odd 10": "TRIBUNA ALTA IMPAR 10",
    "Main S. - Higher Odd 9": "TRIBUNA ALTA IMPAR 9",
    "Main S. - Higher Odd 8": "TRIBUNA ALTA IMPAR 8",
    "Main S. - Higher Odd 7": "TRIBUNA ALTA IMPAR 7",
    "Main S. - Higher Odd 6": "TRIBUNA ALTA IMPAR 6",
    "Main S. - Higher Odd B": "TRIBUNA ALTA IMPAR B",
    "Stage of Honor Odd": "PALCO DE HONOR IMPAR",
    "Stage of Honor Even": "PALCO DE HONOR PAR",
    "Main S. - Higher Even A": "TRIBUNA ALTA PAR A",
    "Main S. - Higher Even 5": "TRIBUNA ALTA PAR 5",
    "Main S. - Higher Even 4": "TRIBUNA ALTA PAR 4",
    "Main S. - Higher Even 3": "TRIBUNA ALTA PAR 3",
    "Main S. - Higher Even 2": "TRIBUNA ALTA PAR 2",
    "Main S. - Higher Even 1": "TRIBUNA ALTA PAR 1",
    "South Goal Odd 9": "FONDO SUR IMPAR 9",
    "South Goal Odd 8": "FONDO SUR IMPAR 8",
    "South Goal Odd 7": "FONDO SUR IMPAR 7",
    "South Goal Odd 6": "FONDO SUR IMPAR 6",
    "South Goal Even 5": "FONDO SUR PAR 5",
    "South Goal Even 4": "FONDO SUR PAR 4",
    "South Goal Even 3": "FONDO SUR PAR 3",
    "South Goal Even 2": "FONDO SUR PAR 2",
    "South Goal Even 1": "FONDO SUR PAR 1",
    "Main Longside S. Odd 14": "PREFERENTE IMPAR 14",
    "Main Longside S. Odd 13": "PREFERENTE IMPAR 13",
    "Main Longside S. Odd 12": "PREFERENTE IMPAR 12",
    "Main Longside S. Odd 11": "PREFERENTE IMPAR 11",
    "Main Longside S. Odd 10": "PREFERENTE IMPAR 10",
    "Main Longside S. Odd 9": "PREFERENTE IMPAR 9",
    "Main Longside S. Odd 8": "PREFERENTE IMPAR 8",
    "Main Longside S. Even 7": "PREFERENTE PAR 7",
    "Main Longside S. Even 6": "PREFERENTE PAR 6",
    "Main Longside S. Even 5": "PREFERENTE PAR 5",
    "Main Longside S. Even 4": "PREFERENTE PAR 4",
    "Main Longside S. Even 3": "PREFERENTE PAR 3",
    "Main Longside S. Even 2": "PREFERENTE PAR 2",
    "Main Longside S. Even 1": "PREFERENTE PAR 1"
};

function mostrarToast(mensaje) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
    <span class="icon" style="display:flex;align-items:center;">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#fff">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 
                 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </span>
    <span>${mensaje}</span>
  `;

    document.getElementById("toast-container").appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

document.addEventListener("DOMContentLoaded", async () => {
    // Verificar autenticación
    if (!sessionStorage.getItem('internalAuth')) {
        window.location.href = 'login.html';
        return;
    }

    const mapaContainer = document.getElementById("mapaSVG");
    const mainContainer = document.getElementById("contenedor-principal");
    const tabla = document.getElementById("tablaSectores");
    const filtro = document.getElementById("busquedaSector");
    const menu = document.getElementById("menu");

    let asientosSeleccionados = [];

    const sectores = await fetchSectores();
    renderSectores(sectores);

    try {
        const res = await fetch("../imagenes/campo.svg");
        const svgText = await res.text();
        mapaContainer.innerHTML = svgText;

        const zonas = document.querySelectorAll(".recinto-zona");

        zonas.forEach(zona => {
            const sectorId = parseInt(zona.dataset.sectorId);
            const sector = sectores.find(s => s.id === sectorId);

            const fillable = zona.querySelector("[fill]");

            if (sector) {
                if (Number(sector.activo) !== 1) {
                    zona.style.cursor = "not-allowed";
                    if (fillable) {
                        fillable.style.opacity = "0.4";
                    }
                } else {
                    zona.style.cursor = "pointer";
                    if (fillable) {
                        fillable.style.opacity = "1";
                    }
                }

                zona.addEventListener("click", () => {
                    if (Number(sector.activo) === 1) {
                        cargarVistaAsientos(sector);
                    }
                });

                zona.addEventListener("mouseenter", () => {
                    if (fillable && Number(sector.activo) === 1) {
                        zona.dataset.originalFill = fillable.getAttribute("fill");
                        fillable.setAttribute("fill", "#2ecc71");
                    }

                    menu.innerHTML = `
                        <strong>${traduccionesSectores[sector.nombre] || sector.nombre}</strong>
                        ${Number(sector.activo) !== 1
                            ? `<div style="margin-top: 8px; font-weight: bold; color: #c6001a;">No disponible</div>`
                            : `
                                <div>Libres: ${sector.libres}</div>
                                <div style="margin-top: 8px; font-weight: bold; color: #d4af37;">ABONO VIP</div>
                            `
                        }
                    `;
                    menu.classList.add("visible");
                });

                zona.addEventListener("mousemove", (e) => {
                    menu.style.left = `${e.pageX + 15}px`;
                    menu.style.top = `${e.pageY + 15}px`;
                });

                zona.addEventListener("mouseleave", () => {
                    if (fillable && zona.dataset.originalFill && Number(sector.activo) === 1) {
                        fillable.setAttribute("fill", zona.dataset.originalFill);
                    }
                    menu.classList.remove("visible");
                });
            }
        });

    } catch (err) {
        console.error("Error cargando SVG:", err);
    }

    filtro.addEventListener("input", () => {
        const val = filtro.value.toLowerCase();
        const filtrados = sectores.filter(s => traduccionesSectores[s.nombre].toLowerCase().includes(val) || s.nombre.toLowerCase().includes(val));
        renderSectores(filtrados);
    });

    function renderSectores(data) {
        tabla.innerHTML = "";
        data.forEach(s => {
            if (Number(s.activo) === 1) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${traduccionesSectores[s.nombre] || s.nombre}</td>
                    <td><span class="vip-tag">VIP</span></td>
                    <td>${s.libres}</td>
                `;

                row.style.cursor = "pointer";
                row.addEventListener("click", () => cargarVistaAsientos(s));
                tabla.appendChild(row);
            }
        });
    }

    async function fetchSectores() {
        try {
            const res = await fetch("http://backend-algeciras.hawkins.es/api/sectores/");
            const data = await res.json();
            const sectores = await Promise.all(
                data.sectores.map(async s => {
                    const libres = await fetchLibresPorSector(s.id);
                    return { ...s, libres };
                })
            );
            return sectores;
        } catch (err) {
            console.error("Error al cargar sectores:", err);
            return [];
        }
    }

    async function fetchLibresPorSector(sectorId) {
        try {
            const res = await fetch(`http://backend-algeciras.hawkins.es/api/asientos/sector/${sectorId}`);
            const data = await res.json();
            return data.asientos.filter(a => a.estado === 'disponible').length;
        } catch {
            return 0;
        }
    }

    async function fetchAsientos(sectorId) {
        const res = await fetch(`http://backend-algeciras.hawkins.es/api/asientos/sector/${sectorId}?partidoId=proximos`);
        const data = await res.json();
        return data.asientos;
    }

    async function cargarVistaAsientos(sector) {
        const asientos = await fetchAsientos(sector.id);

        const html = `
        <div class="contenedor-asientos">
            <section class="zona-info">
                <button onclick="window.location.reload()" class="btn-cambiar">CAMBIAR</button>
                <h2>ZONA SELECCIONADA:</h2>
                <h3>${traduccionesSectores[sector.nombre] || sector.nombre}</h3>
                ${sector.imagen ? `<img src="${sector.imagen}" alt="Zona Seleccionada">` : ''}
                
                <div class="resumen-abonos">
                <h3>ABONOS VIP</h3>
                <div id="listaAbonos"></div>
                </div>
            </section>
    
            <section class="selector-asientos">
            <h2>TERRENO DE JUEGO</h2>
            <div class="grada">
                <div class="fila" id="asientosContainer"></div>
    
                <div class="leyenda">
                <span class="leyenda-item disponible">Disponible</span>
                <span class="leyenda-item ocupado">Ocupado</span>
                <span class="leyenda-item seleccionado">Seleccionado</span>
                </div>
    
                <div class="acciones-abono">
                <p id="infoAsiento">Selecciona uno o varios asientos</p>
                <button id="continuarCompra" disabled>CONTINUAR</button>
                </div>
            </div>
            </section>
        </div>
        <div id="formulario-container" style="display:none;"></div>
      `;

        mainContainer.innerHTML = html;

        const container = document.getElementById("asientosContainer");
        const info = document.getElementById("infoAsiento");
        const continuar = document.getElementById("continuarCompra");
        const formContainer = document.getElementById("formulario-container");
        renderAsientosConFila(asientos, container);

        function agruparPorFila(asientos) {
            const filas = {};
            asientos.forEach(a => {
                if (!filas[a.fila]) filas[a.fila] = [];
                filas[a.fila].push(a);
            });
            return filas;
        }

        function getOrdenCorrecto(asientos) {
            const porFila = agruparPorFila(asientos);
            const primeraFila = Object.values(porFila)[0];

            if (!primeraFila || primeraFila.length < 2) {
                return Array.from(new Set(asientos.map(a => a.numero))).sort((a, b) => a - b);
            }

            const ordenDescendente = primeraFila[0].numero > primeraFila[1].numero;

            const numeros = Array.from(new Set(asientos.map(a => a.numero)));
            numeros.sort((a, b) => ordenDescendente ? b - a : a - b);

            return numeros;
        }

        function actualizarResumenAbonos() {
            const contenedor = document.getElementById("listaAbonos");
            contenedor.innerHTML = "";

            asientosSeleccionados.forEach((asiento, index) => {
                const box = document.createElement("div");
                box.classList.add("abono-box");
                box.innerHTML = `<span style="font-weight:bold;">ABONO VIP ${index + 1}. ${traduccionesSectores[sector.nombre] || sector.nombre}</span> Fila: ${asiento.fila} /Butaca: ${asiento.numero}`;
                contenedor.appendChild(box);
            });
        }

        function renderAsientosConFila(asientos, container) {
            const filas = agruparPorFila(asientos);
            const ordenFilas = Object.keys(filas).sort((a, b) => parseInt(a) - parseInt(b));
            const sectorEspecifico = sector.nombre === "North Goal Odd 9";

            const numerosUnicosGlobal = getOrdenCorrecto(asientos);
            const maxColumnas = Math.max(...Object.values(filas).map(fila => fila.length));

            ordenFilas.forEach(fila => {
                const wrapper = document.createElement("div");
                wrapper.style.display = "flex";
                wrapper.style.alignItems = "center";
                wrapper.style.marginBottom = "10px";
                wrapper.style.gap = "10px";
                wrapper.style.width = "100%";
                wrapper.style.overflowX = "auto";

                const etiquetaFila = document.createElement("span");
                etiquetaFila.textContent = fila;
                etiquetaFila.style.fontWeight = "bold";
                etiquetaFila.style.width = "20px";
                etiquetaFila.style.textAlign = "right";
                wrapper.appendChild(etiquetaFila);

                const grid = document.createElement("div");
                grid.style.display = "grid";
                grid.style.gap = "5px";
                grid.style.minWidth = "fit-content";

                const mapa = new Map(filas[fila].map(a => [a.numero, a]));

                if (sectorEspecifico) {
                    const numerosFila = getOrdenCorrecto(filas[fila]);
                    grid.style.gridTemplateColumns = `repeat(${maxColumnas}, 1fr)`;
                    numerosFila.forEach(num => {
                        const cell = document.createElement("div");
                        if (mapa.has(num)) {
                            const a = mapa.get(num);
                            const btn = crearBotonAsiento(a);
                            cell.appendChild(btn);
                        }
                        grid.appendChild(cell);
                    });
                } else {
                    grid.style.gridTemplateColumns = `repeat(${numerosUnicosGlobal.length}, 1fr)`;
                    numerosUnicosGlobal.forEach(num => {
                        const cell = document.createElement("div");
                        if (mapa.has(num)) {
                            const a = mapa.get(num);
                            const btn = crearBotonAsiento(a);
                            cell.appendChild(btn);
                        }
                        grid.appendChild(cell);
                    });
                }

                wrapper.appendChild(grid);
                container.appendChild(wrapper);
            });

            function crearBotonAsiento(a) {
                const btn = document.createElement("button");
                btn.textContent = a.numero;
                btn.classList.add("asiento");

                if (a.estado === "ocupado") {
                    btn.classList.add("ocupado");
                    btn.disabled = true;
                }

                btn.addEventListener("click", () => {
                    if (!btn.classList.contains("seleccionado")) {
                        btn.classList.add("seleccionado");
                        if (!asientosSeleccionados.some(s => s.id === a.id)) {
                            asientosSeleccionados.push({ id: a.id, fila: a.fila, numero: a.numero });
                        }
                    } else {
                        btn.classList.remove("seleccionado");
                        asientosSeleccionados = asientosSeleccionados.filter(s => s.id !== a.id);
                    }

                    actualizarResumenAbonos();
                    info.textContent = `Seleccionados: ${asientosSeleccionados.length}`;
                    continuar.disabled = asientosSeleccionados.length === 0;
                });

                return btn;
            }
        }

        continuar.addEventListener("click", () => {
            if (!asientosSeleccionados.length) return;

            formContainer.innerHTML = `<h2>DATOS DEL ABONADO VIP</h2><form id="formulario-abono"></form>`;
            formContainer.style.display = "block";

            const form = document.getElementById("formulario-abono");
            asientosSeleccionados.forEach((asiento, index) => {
                form.innerHTML += `
                <fieldset>
                    <legend>Abono VIP ${index + 1} - Fila ${asiento.fila}, Butaca ${asiento.numero}</legend>
                    <input type="hidden" name="asientoId-${index}" value="${asiento.id}" />
                    <div class="form-grid">
                        <label>Nombre:
                            <input name="nombre-${index}" required />
                        </label>
                        <label>Apellidos:
                            <input name="apellidos-${index}" required />
                        </label>
                        <label>Género:
                            <select name="genero-${index}" required>
                                <option value="">Seleccione</option>
                                <option value="masculino">Masculino</option>
                                <option value="femenino">Femenino</option>
                            </select>
                        </label>
                        <label>DNI:
                            <input name="dni-${index}" pattern="^[0-9]{8}[A-Z]$" required title="Formato: 12345678A" />
                        </label>
                        <label>Fecha de nacimiento:
                            <input type="date" name="fechaNacimiento-${index}" required />
                        </label>
                        <label>Email:
                            <input type="email" name="email-${index}" required />
                        </label>
                        <label>Teléfono:
                            <input type="tel" name="telefono-${index}" required pattern="^\\+?\\d{9,15}$" title="Número válido" />
                        </label>
                        <label>País:
                            <input name="pais-${index}" value="España" required />
                        </label>
                        <label>Provincia:
                            <input name="provincia-${index}" value="Cádiz" required />
                        </label>
                        <label>Localidad:
                            <input name="localidad-${index}" value="Algeciras" required />
                        </label>
                        <label>Domicilio:
                            <input name="domicilio-${index}" required />
                        </label>
                        <label>Código Postal:
                            <input name="codigoPostal-${index}" required pattern="\\d{5}" title="5 dígitos" />
                        </label>
                    </div>
                </fieldset>
            `;
            });
            form.innerHTML += `<button type="submit">REGISTRAR ABONO VIP</button>`;

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const fechaInicio = new Date();
                const fechaFin = new Date('2025-06-30T23:59:59');

                for (let i = 0; i < asientosSeleccionados.length; i++) {
                    const abono = {
                        fechaInicio,
                        fechaFin,
                        asientoId: asientosSeleccionados[i].id,
                        nombre: formData.get(`nombre-${i}`),
                        apellidos: formData.get(`apellidos-${i}`),
                        genero: formData.get(`genero-${i}`),
                        dni: formData.get(`dni-${i}`),
                        fechaNacimiento: formData.get(`fechaNacimiento-${i}`),
                        email: formData.get(`email-${i}`),
                        telefono: formData.get(`telefono-${i}`),
                        pais: formData.get(`pais-${i}`),
                        provincia: formData.get(`provincia-${i}`),
                        localidad: formData.get(`localidad-${i}`),
                        domicilio: formData.get(`domicilio-${i}`),
                        codigoPostal: formData.get(`codigoPostal-${i}`)
                    };

                    if (!/^[0-9]{8}[A-Z]$/.test(abono.dni)) {
                        mostrarToast(`DNI inválido en abono ${i + 1}`);
                        return;
                    }
                    if (!/^\S+@\S+\.\S+$/.test(abono.email)) {
                        mostrarToast(`Email inválido en abono ${i + 1}`);
                        return;
                    }
                    if (!/^\+?\d{9,15}$/.test(abono.telefono)) {
                        mostrarToast(`Teléfono inválido en abono ${i + 1}`);
                        return;
                    }

                    try {
                        const res = await fetch("http://backend-algeciras.hawkins.es/api/abonos/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(abono)
                        });

                        if (!res.ok) {
                            const error = await res.json();
                            throw new Error(error.msg || 'Error en la solicitud');
                        }
                    } catch (error) {
                        console.error('Error al crear abono:', error);
                        mostrarToast(`Error al crear abono ${i + 1}: ${error.message}`);
                        return;
                    }
                }

                mostrarToast("¡Abonos VIP registrados correctamente!");
                setTimeout(() => window.location.reload(), 2000);
            });
        });
    }
}); 