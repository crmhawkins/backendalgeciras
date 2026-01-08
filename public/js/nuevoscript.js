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
    const mapaContainer = document.getElementById("mapaSVG");
    const mainContainer = document.getElementById("contenedor-principal");
    const tabla = document.getElementById("tablaSectores");
    const filtro = document.getElementById("busquedaSector");
    const menu = document.getElementById("menu");


    let asientosSeleccionados = [];

    const sectores = await fetchSectores();
    renderSectores(sectores);

    try {
        const res = await fetch("imagenes/campo.svg");
        const svgText = await res.text();
        mapaContainer.innerHTML = svgText;

        // Esperar un momento para que el SVG se renderice completamente
        await new Promise(resolve => setTimeout(resolve, 100));

        // Buscar las zonas dentro del contenedor del mapa
        const zonas = mapaContainer.querySelectorAll(".recinto-zona");
        
        console.log(`Encontradas ${zonas.length} zonas en el mapa`);

        if (zonas.length === 0) {
            console.error("No se encontraron zonas .recinto-zona en el SVG");
            // Intentar buscar de otra manera
            const todasLasZonas = document.querySelectorAll(".recinto-zona");
            console.log(`Zonas encontradas en todo el documento: ${todasLasZonas.length}`);
        }

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
                        
                        // Scroll automático a la vista de asientos en móvil
                        if (window.innerWidth <= 768) {
                            setTimeout(() => {
                                const selectorAsientos = document.querySelector('.selector-asientos');
                                if (selectorAsientos) {
                                    selectorAsientos.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 100);
                        }
                    }
                });

                zona.addEventListener("mouseenter", () => {
                    if (fillable && Number(sector.activo) === 1) {
                        zona.dataset.originalFill = fillable.getAttribute("fill");
                        fillable.setAttribute("fill", "#2ecc71");
                    }

                    const precioFormateado = Number(sector.precio).toFixed(2);
                    menu.innerHTML = `
                        <strong>${traduccionesSectores[sector.nombre] || sector.nombre}</strong>
                        ${Number(sector.activo) !== 1
                            ? `<div style="margin-top: 8px; font-weight: bold; color: #c6001a;">No disponible</div>`
                            : `
                                <div>Libres: ${sector.libres}</div>
                                <ul style="margin: 8px 0 0 0; padding-left: 16px;">
                                    <li>INFANTIL - ${precioFormateado} €</li>
                                    <li>ADULTO - ${precioFormateado} €</li>
                                </ul>
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
            } else {
                console.warn(`No se encontró el sector con id ${sectorId}`);
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
                    <td>${Number(s.precio).toFixed(2)} €</td>
                    <td>${s.libres}</td>
                `;

                row.style.cursor = "pointer";
                row.addEventListener("click", () => {
                    cargarVistaAsientos(s);
                    
                    // Scroll automático a la vista de asientos en móvil
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            const selectorAsientos = document.querySelector('.selector-asientos');
                            if (selectorAsientos) {
                                selectorAsientos.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 100);
                    }
                });
                tabla.appendChild(row);
            }
        });
    }


    async function fetchSectores() {
        try {
            const res = await fetch("/api/sectores");
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }
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
            const res = await fetch(`/api/asientos/sector/${sectorId}`);
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }
            const data = await res.json();
            return data.asientos.filter(a => a.estado === 'disponible').length;
        } catch (err) {
            console.error(`Error al cargar asientos del sector ${sectorId}:`, err);
            return 0;
        }
    }

    async function fetchAsientos(sectorId) {
        try {
            const res = await fetch(`/api/asientos/sector/${sectorId}?partidoId=proximos`);
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }
            const data = await res.json();
            return data.asientos;
        } catch (err) {
            console.error(`Error al cargar asientos del sector ${sectorId}:`, err);
            return [];
        }
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
                <h3>TUS ASIENTOS</h3>
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
                <button id="continuarCompra" disabled>CONTINUAR COMPRA</button>
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
            const primeraFila = Object.values(porFila)[0]; // Tomamos la primera fila como referencia

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
            contenedor.innerHTML = ""; // Limpia antes de volver a renderizar

            asientosSeleccionados.forEach((asiento, index) => {
                const box = document.createElement("div");
                box.classList.add("abono-box");
                box.innerHTML = `<span style ="font-weight:bold;">abono ${index + 1}. ${traduccionesSectores[sector.nombre] || sector.nombre}</span> Fila: ${asiento.fila} /Butaca: ${asiento.numero}`;
                contenedor.appendChild(box);
            });
        }

        function renderAsientosConFila(asientos, container) {
            const filas = agruparPorFila(asientos);
            const ordenFilas = Object.keys(filas).sort((a, b) => parseInt(a) - parseInt(b));
            const sectorEspecifico = sector.nombre === "North Goal Odd 9";

            const numerosUnicosGlobal = getOrdenCorrecto(asientos); // solo se usa si NO es el sector especial
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
                console.log("estado del asiento", a.estado, "id", a.id);

                if (a.estado === "ocupado") {
                    btn.classList.add("ocupado");
                    btn.disabled = true;
                }

                btn.addEventListener("click", () => {
                    if (!btn.classList.contains("seleccionado")) {
                        if (asientosSeleccionados.length >= 6) {
                            mostrarToast("Ya no es posible adquirir más abonos, se ha superado el límite.");
                            return;
                        }

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

            formContainer.innerHTML = `<h2>COMPLETA TUS DATOS</h2><form id="formulario-abono"></form>`;
            formContainer.style.display = "block";
            
            // Scroll automático al formulario en móvil
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            
            // Aplicar estilos responsive al contenedor
            if (window.innerWidth <= 768) {
                formContainer.style.width = "100%";
                formContainer.style.maxWidth = "100%";
                formContainer.style.padding = "1rem";
                formContainer.style.margin = "0 auto";
                formContainer.style.boxSizing = "border-box";
                formContainer.style.backgroundColor = "transparent";
                formContainer.style.borderRadius = "0";
                formContainer.style.boxShadow = "none";
                
                // Aplicar estilos a los fieldsets también
                const fieldsets = formContainer.querySelectorAll('fieldset');
                fieldsets.forEach(fieldset => {
                    fieldset.style.background = "transparent";
                    fieldset.style.padding = "1rem 0";
                    fieldset.style.boxShadow = "none";
                    fieldset.style.borderRadius = "0";
                });
            }

            const form = document.getElementById("formulario-abono");
            asientosSeleccionados.forEach((asiento, index) => {
                form.innerHTML += `
            <fieldset>
                <legend>Abono ${index + 1} - Fila ${asiento.fila}, Butaca ${asiento.numero}</legend>
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
                    <input name="pais-${index}" required />
                </label>
                <label>Provincia:
                    <input name="provincia-${index}" required />
                </label>
                <label>Localidad:
                    <input name="localidad-${index}" required />
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
            form.innerHTML += `<button type="submit">CONFIRMAR COMPRA</button>`;

            // Función para actualizar estilos responsive
            const updateFormGridStyles = () => {
                const formGrids = form.querySelectorAll('.form-grid');
                const isMobile = window.innerWidth <= 1024;
                formGrids.forEach(grid => {
                    grid.style.display = 'grid';
                    grid.style.gridTemplateColumns = isMobile ? '1fr' : 'repeat(3, 1fr)';
                    grid.style.width = '100%';
                    grid.style.boxSizing = 'border-box';
                    grid.style.gap = '1.5rem';
                });
                
                // Aplicar estilos a los inputs y labels también
                const inputs = form.querySelectorAll('.form-grid input, .form-grid select');
                inputs.forEach(input => {
                    input.style.width = '100%';
                    input.style.maxWidth = '100%';
                    input.style.minWidth = '0';
                    input.style.boxSizing = 'border-box';
                    input.style.padding = '0.7rem';
                    input.style.fontSize = '1rem';
                });
                
                const labels = form.querySelectorAll('.form-grid label');
                labels.forEach(label => {
                    label.style.width = '100%';
                    label.style.maxWidth = '100%';
                    label.style.minWidth = '0';
                    label.style.boxSizing = 'border-box';
                    label.style.display = 'flex';
                    label.style.flexDirection = 'column';
                });
                
                if (isMobile) {
                    formContainer.style.width = '100%';
                    formContainer.style.maxWidth = '100%';
                    formContainer.style.padding = '1rem';
                    formContainer.style.margin = '0 auto';
                    formContainer.style.boxSizing = 'border-box';
                    formContainer.style.backgroundColor = 'transparent';
                    formContainer.style.borderRadius = '0';
                    formContainer.style.boxShadow = 'none';
                    
                    // Aplicar estilos a los fieldsets también
                    const fieldsets = formContainer.querySelectorAll('fieldset');
                    fieldsets.forEach(fieldset => {
                        fieldset.style.background = 'transparent';
                        fieldset.style.padding = '1rem 0';
                        fieldset.style.boxShadow = 'none';
                        fieldset.style.borderRadius = '0';
                    });
                }
            };

            // Aplicar estilos iniciales después de un pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                updateFormGridStyles();
            }, 10);

            // Actualizar cuando se redimensione la ventana
            window.addEventListener('resize', updateFormGridStyles);

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const fechaInicio = new Date();
                const fechaFin = new Date('2025-06-30T23:59:59');

                // Validar todos los campos antes de proceder
                for (let i = 0; i < asientosSeleccionados.length; i++) {
                    const dni = formData.get(`dni-${i}`);
                    const email = formData.get(`email-${i}`);
                    const telefono = formData.get(`telefono-${i}`);

                    if (!/^[0-9]{8}[A-Z]$/.test(dni)) {
                        alert(`DNI inválido en abono ${i + 1}`);
                        return;
                    }
                    if (!/^\S+@\S+\.\S+$/.test(email)) {
                        alert(`Email inválido en abono ${i + 1}`);
                        return;
                    }
                    if (!/^\+?\d{9,15}$/.test(telefono)) {
                        alert(`Teléfono inválido en abono ${i + 1}`);
                        return;
                    }
                }

                // Por ahora solo procesamos un abono a la vez para simplificar
                const primerAbono = {
                    fechaInicio: fechaInicio.toISOString(),
                    fechaFin: fechaFin.toISOString(),
                    asientoId: asientosSeleccionados[0].id,
                    nombre: formData.get(`nombre-0`),
                    apellidos: formData.get(`apellidos-0`),
                    genero: formData.get(`genero-0`),
                    dni: formData.get(`dni-0`),
                    fechaNacimiento: formData.get(`fechaNacimiento-0`),
                    email: formData.get(`email-0`),
                    telefono: formData.get(`telefono-0`),
                    pais: formData.get(`pais-0`),
                    provincia: formData.get(`provincia-0`),
                    localidad: formData.get(`localidad-0`),
                    domicilio: formData.get(`domicilio-0`),
                    codigoPostal: formData.get(`codigoPostal-0`)
                };

                try {
                    // Crear sesión de pago con Stripe
                    const res = await fetch("/api/pagos/abono", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(primerAbono)
                    });

                    const result = await res.json();

                    if (!res.ok) {
                        alert(result.msg || 'Error al crear la sesión de pago');
                        return;
                    }

                    // Redirigir a Stripe Checkout
                    if (result.url) {
                        window.location.href = result.url;
                    } else {
                        alert('Error: No se recibió la URL de pago');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al procesar el pago. Por favor, inténtalo de nuevo.');
                }
            });

        });
    }
});
