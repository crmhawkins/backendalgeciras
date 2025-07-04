document.addEventListener("DOMContentLoaded", async () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const container = document.getElementById("partidosContainer");
  const token = localStorage.getItem("token");


  if (!usuario) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const abonosRes = await fetch(`https://backend-algeciras.hawkins.es:8446/api/abonos/usuario/${usuario.id}`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
        });
    const abonosData = await abonosRes.json();
    const abonos = abonosData.abonos;

    if (!abonos.length) {
      container.innerHTML = `<p>No tienes abonos registrados actualmente.</p>`;
      return;
    }

    const asientoId = abonos[0].asientoId;
    const sectorId = abonos[0].Asiento?.sectorId;

    const partidosRes = await fetch("/api/partidos");
    const partidosData = await partidosRes.json();
    const hoy = new Date();

    const partidosFuturos = partidosData.partidos
      .filter(p => new Date(p.fecha) >= hoy)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (!partidosFuturos.length) {
      container.innerHTML = `<p>No hay partidos futuros disponibles.</p>`;
      return;
    }

    container.innerHTML = "";

    for (const partido of partidosFuturos) {
      const card = document.createElement("div");
      card.classList.add("partido-card");

      const info = document.createElement("div");
      info.classList.add("partido-info");
      info.innerHTML = `
        <strong>${partido.equipoLocal} vs ${partido.equipoVisitante}</strong>
        <span>Fecha: ${partido.fecha}</span>
        <strong>${partido.hora ? `${partido.hora}H` : "Hora por determinar"}</strong>
      `;

      const btn = document.createElement("button");
      btn.classList.add("btn-liberar");

      const entradaRes = await fetch(`https://backend-algeciras.hawkins.es:8446/api/entradas/buscar-liberada?asientoId=${asientoId}&partidoId=${partido.id}`);
      const entradaData = await entradaRes.json();
      const entrada = entradaData.entrada;

      const estaLiberado = !!entrada;
      const fueComprado = entrada && entrada.usuarioId !== 1;

      if (estaLiberado && !fueComprado) {
        btn.textContent = "Cancelar liberación";
        btn.addEventListener("click", async () => {
          if (!confirm("¿Seguro que quieres cancelar la liberación de tu asiento para este partido?")) return;

          try {
            const res = await fetch("https://backend-algeciras.hawkins.es:8446/api/abonos/cancelar-liberacion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ asientoId, partidoId: partido.id, usuarioId: usuario.id })
            });

            const result = await res.json();

            if (res.ok) {
              alert("Liberación cancelada correctamente.");
              window.location.reload();
            } else {
              alert(result.msg || "No se pudo cancelar la liberación.");
            }
          } catch (error) {
            console.error(error);
            alert("Error al cancelar la liberación.");
          }
        });
      } else if (!estaLiberado) {
        btn.textContent = "Liberar asiento";
        btn.addEventListener("click", async () => {
          if (!confirm("¿Estás seguro que no asistirás a este partido? Liberarás tu asiento para su venta.")) return;

          try {
            const res = await fetch("https://backend-algeciras.hawkins.es:8446/api/abonos/liberar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                asientoId,
                partidoId: partido.id,
                usuarioId: usuario.id
              })
            });

            const result = await res.json();

            if (res.ok) {
              alert("Asiento liberado correctamente para ese partido.");
              window.location.reload();
            } else {
              alert(result.msg || "Error al liberar el asiento.");
            }
          } catch (error) {
            console.error(error);
            alert("Error al liberar el asiento.");
          }
        });
      } else {
        btn.disabled = true;
        btn.classList.add("bloqueado");
        btn.textContent = "Liberado y comprado";
      }

      card.appendChild(info);
      card.appendChild(btn);
      container.appendChild(card);
    }

  } catch (error) {
    console.error("Error:", error);
    container.innerHTML = `<p class="error-abonos">Error al cargar partidos o abonos</p>`;
  }
});



