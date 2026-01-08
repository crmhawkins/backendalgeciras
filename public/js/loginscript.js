document.addEventListener("DOMContentLoaded", function() {
    const passwordIcon = document.querySelector(".password-icon");
    const passwordInput = document.getElementById("password");
    
    if (passwordIcon && passwordInput) {
        passwordIcon.addEventListener("click", function() {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            this.classList.toggle("active", !isPassword);
            
            const svg = this.querySelector("svg");
            if (svg) {
                if (isPassword) {
                    svg.innerHTML = `
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    `;
                } else {
                    svg.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    `;
                }
            }
        });
    }

    document.getElementById("loginForm").addEventListener("submit", async function(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Por favor, complete todos los campos");
            return;
        }

        try {
            const submitBtn = document.querySelector(".btn-login");
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Cargando...";
            submitBtn.disabled = true;

            const res = await fetch('http://backend-algeciras.hawkins.es/api/authenticate/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;

            if (!res.ok) {
                alert(data.msg || "Credenciales inválidas");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            window.location.href = "perfil.html";
        } catch (error) {
            console.error("Error en el login:", error);
            
            const submitBtn = document.querySelector(".btn-login");
            if (submitBtn) {
                submitBtn.textContent = "ENVIAR";
                submitBtn.disabled = false;
            }
            
            alert("Error de conexión con el servidor. Por favor, intente nuevamente.");
        }
    });
});