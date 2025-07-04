document.getElementById("ayudaForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const titulo = document.getElementById("titulo").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const captcha = grecaptcha.getResponse();

    if (!email || !titulo || !mensaje) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    if (captcha.length === 0) {
        alert("Por favor, verifica que no eres un robot.");
        return;
    }

    // Aquí iría la lógica para enviar los datos (fetch/AJAX o formulario real)
    alert("Formulario enviado correctamente (simulado)");
});


