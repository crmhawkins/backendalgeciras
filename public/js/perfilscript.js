document.addEventListener("DOMContentLoaded", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!usuario) return;
  
    const container = document.getElementById("abonosWrapper");
  
    try {
      const res = await fetch(`http://backend-algeciras.hawkins.es/api/abonos/usuario/${usuario.id}`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      const abonosUsuario = data.abonos;


      function calcularTiempoRestante(fechaFinStr) {
        const hoy = new Date();
        const fechaFin = new Date(fechaFinStr);

        const diffMs = fechaFin - hoy;
        if (diffMs <= 0) return "Expirado";

        const msEnUnDia = 1000 * 60 * 60 * 24;
        const diasTotales = Math.floor(diffMs / msEnUnDia);

        if (diasTotales < 30) {
            return `${diasTotales} día${diasTotales !== 1 ? 's' : ''}`;
        }

        const meses = Math.floor(diasTotales / 30);
        return `${meses} mes${meses !== 1 ? 'es' : ''}`;
      }


  
      if (abonosUsuario.length === 0) {
        container.innerHTML = '<p class="no-abonos">No tienes ningún abono actualmente.</p>';
      } else {
        container.innerHTML = abonosUsuario.map(abono => {
          const asiento = abono.Asiento;
          const sector = asiento?.Sector?.nombre || 'Desconocida';
          const precio = asiento?.Sector?.precio || 'No disponible';
  
          return `
            <div class="abono-card">
                <h3>Abono #${abono.id}</h3>
                <p><strong>Nombre:</strong> ${abono.nombre} ${abono.apellidos}</p>
                <p><strong>DNI:</strong> ${abono.dni}</p>
                <p><strong>Correo:</strong> ${abono.email}</p>
                <p><strong>Teléfono:</strong> ${abono.telefono}</p>
                <p><strong>Zona:</strong> ${sector}</p>
                <p><strong>Fila:</strong> ${asiento?.fila}</p>
                <p><strong>Butaca:</strong> ${asiento?.numero}</p>
                <p><strong>Precio:</strong> ${precio} €</p>
                <p><strong>Fecha inicio:</strong> ${abono.fechaInicio.split("T")[0]}</p>
                <p><strong>Válido hasta:</strong> ${abono.fechaFin.split("T")[0]}</p>
                <p><strong>Tiempo restante:</strong> ${calcularTiempoRestante(abono.fechaFin)}</p>
            </div>
          `;
        }).join('');
      }
  
      const entradasRes = await fetch(`http://backend-algeciras.hawkins.es/api/entradas/usuario/${usuario.id}`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const entradasData = await entradasRes.json();
      const entradas = entradasData.entradas;
  
      if (entradas.length > 0) {
        container.innerHTML += `<h2 style="margin-top: 2rem;">Entradas compradas</h2>`;
  
        entradas.forEach(entrada => {
          const partido = entrada.Partido;
          const asiento = entrada.Asiento;
          const sector = asiento?.Sector?.nombre || "Desconocido";
          const fila = asiento?.fila || "N/D";
          const numero = asiento?.numero || "N/D";
  
          const fecha = partido.fecha?.split("T")[0];
          const hora = partido.hora ? `${partido.hora}h` : "Hora por determinar";
  
          container.innerHTML += `
            <div class="abono-card">
                <h3>Entrada</h3>
                <p><strong>Partido:</strong> ${partido.equipoLocal} vs ${partido.equipoVisitante}</p>
                <p><strong>Fecha:</strong> ${fecha} - ${hora}</p>
                <p><strong>Sector:</strong> ${sector}</p>
                <p><strong>Fila:</strong> ${fila}</p>
                <p><strong>Butaca:</strong> ${numero}</p>
                <p><strong>Precio:</strong> ${entrada.precio} €</p>
            </div>
          `;
        });
      }
  
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p class="error-abonos">Error al cargar tus abonos</p>';
    }
  });
  
