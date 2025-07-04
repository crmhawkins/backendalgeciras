document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRecuperar");
    const mensaje = document.getElementById("mensaje");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const email = document.getElementById("email").value;
  
      try {
        const res = await fetch("/api/authenticate/recuperar-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        })        
  
        const data = await res.json();
  
        if (res.ok) {
          mensaje.style.color = "green";
          mensaje.textContent = data.msg;
        } else {
          mensaje.style.color = "red";
          mensaje.textContent = data.msg || "Error al enviar el correo";
        }
      } catch (error) {
        mensaje.style.color = "red";
        mensaje.textContent = "Error al conectar con el servidor";
      }
    });
  });
  