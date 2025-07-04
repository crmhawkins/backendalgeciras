document.getElementById('renovarForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const dni = document.getElementById('dni').value.trim();
    const codigo = document.getElementById('codigo').value.trim();

    const res = await fetch('/api/abonos/renovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, codigo })
    });

    const data = await res.json();

    const resultContainer = document.getElementById('resultado-renovacion');
    resultContainer.innerHTML = ''; // Limpiar antes

    if (!res.ok) {
        resultContainer.innerHTML = `
            <div class="error-renovacion">
                <h3>El abonado no existe</h3>
                <p>PÓNGASE EN CONTACTO CON EL CLUB EN <strong>TIENDA@ALGECIRASCF.EU</strong></p>
            </div>
        `;
        return;
    }

    const abono = data.abono;

    resultContainer.innerHTML = `
        <div class="abono-info">
            <h3>Datos del abono</h3>
            <p><strong>Nombre:</strong> ${abono.nombre} ${abono.apellidos}</p>
            <p><strong>DNI:</strong> ${abono.dni}</p>
            <p><strong>Email:</strong> ${abono.email}</p>
            <p><strong>Teléfono:</strong> ${abono.telefono}</p>
            <p><strong>Asiento:</strong> Fila ${abono.Asiento?.fila || "?"}, Butaca ${abono.Asiento?.numero || "?"}</p>
            <p><strong>Precio:</strong> ${abono.precio || "Consultar"}</p>
            <button id="confirmar-renovacion">CONFIRMAR RENOVACIÓN</button>
        </div>
    `;

    document.getElementById('confirmar-renovacion').addEventListener('click', async () => {
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaInicio.getFullYear() + 1);

        const renovar = await fetch('/api/abonos/renovar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni, codigo })
        });

        const renovarData = await renovar.json();
        if (renovar.ok) {
            alert("¡Abono renovado correctamente!");
            window.location.reload();
        } else {
            alert("Error al renovar: " + renovarData.msg);
        }
    });
});

