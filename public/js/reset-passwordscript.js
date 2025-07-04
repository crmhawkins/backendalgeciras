document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formReset");
    const mensaje = document.getElementById("mensaje");
  
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
  
    if (!token) {
      mensaje.textContent = "Token inválido o ausente.";
      mensaje.style.color = "red";
      form.style.display = "none";
      return;
    }
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirm").value;
  
      if (password !== confirm) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        mensaje.style.color = "red";
        return;
      }
  
      try {
        const res = await fetch(`/api/authenticate/reset-password/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });
        
  
        const data = await res.json();
  
        if (res.ok) {
          mensaje.style.color = "green";
          mensaje.textContent = data.msg;
          form.reset();
        } else {
          mensaje.style.color = "red";
          mensaje.textContent = data.msg || "Error al restablecer la contraseña";
        }
      } catch (error) {
        mensaje.style.color = "red";
        mensaje.textContent = "Error al conectar con el servidor";
      }
    });
  });
  