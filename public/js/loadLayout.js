document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('/components/header.html'),
      fetch('/components/footer.html')
    ]);

    const headerHtml = await headerRes.text();
    const footerHtml = await footerRes.text();

    document.querySelector("header").innerHTML = headerHtml;
    document.querySelector("footer").innerHTML = footerHtml;

    setTimeout(() => {
      const hamburgerBtn = document.getElementById('hamburgerBtn');
      const navLinks = document.getElementById('navLinks');
      const hamburgerIcon = document.querySelector('.hamburger-icon');
      const closeIcon = document.querySelector('.close-icon');

      if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
          navLinks.classList.toggle('show');
          hamburgerBtn.classList.toggle('active'); // Añade/remueve la clase active
          
          if (navLinks.classList.contains('show')) {
            hamburgerIcon.style.display = 'none';
            closeIcon.style.display = 'block';
          } else {
            hamburgerIcon.style.display = 'block';
            closeIcon.style.display = 'none';
          }
        });
        
        document.querySelectorAll('.nav-links a').forEach(link => {
          link.addEventListener('click', () => {
            navLinks.classList.remove('show');
            hamburgerBtn.classList.remove('active'); // Asegura que vuelva al estado inicial
            closeIcon.style.display ='none';
          });
        });
      }
      const token = localStorage.getItem('token');
      const usuario = JSON.parse(localStorage.getItem('usuario'));

      const loginArea = document.getElementById('loginArea');
      const userWrapper = document.getElementById('userWrapper');
      const userNombre = document.getElementById('userNombre');
      const userEmail = document.getElementById('userEmail');
      const verAbonosLi = document.getElementById('verAbonosLi');

      if (token && usuario) {
        if (loginArea) loginArea.remove();
        if (userWrapper) userWrapper.style.display = 'block';
        if (verAbonosLi) verAbonosLi.style.display = 'inline-block';
        if (userNombre) userNombre.textContent = usuario.nombre;
        if (userEmail) userEmail.textContent = usuario.email;
      } else {
        if (userWrapper) userWrapper.remove();
        if (verAbonosLi) verAbonosLi.remove();
      }

      const avatarToggle = document.getElementById("avatarToggle");
      const userDropdown = document.getElementById("userDropdown");
      if (avatarToggle && userDropdown) {
        avatarToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          userDropdown.style.display = "block";
        });

        document.addEventListener("click", (e) => {
          if (!userWrapper.contains(e.target)) {
            userDropdown.style.display = "none";
          }
        });

        if (!document.getElementById("cambiarFotoBtn")) {
          const cambiarBtn = document.createElement("button");
          cambiarBtn.id = "cambiarFotoBtn";
          cambiarBtn.textContent = "Cambiar foto";
          userDropdown.appendChild(cambiarBtn);
        }
      }


      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          location.reload();
        });
      }

      

    }, 0);

  } catch (err) {
    console.error("Error cargando header/footer:", err);
  }
});

const style = document.createElement("style");
style.innerHTML = `
  .hamburger {
    display: none;
    font-size: 1.8rem;
    background: none;
    border: none;
    color: #111;
    cursor: pointer;
    padding: 5px;
    order: 0;
    position: relative; /* Añadido para posicionar los iconos */
    width: 30px; /* Ancho fijo para contener los iconos */
    height: 30px; /* Alto fijo */
  }

  .hamburger-icon, .close-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
  }

  .hamburger-icon {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(0deg);
  }

  .close-icon {
    opacity: 0;
    font-size: 2rem;
    transform: translate(-50%, -50%) rotate(-90deg);
  }

  .hamburger.active .hamburger-icon {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(90deg);
  }

  .hamburger.active .close-icon {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(0deg);
  }

  .nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 10px;
    position: relative; /* Necesario para el menú absoluto */
  }

  .nav-links {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    /* Nueva propiedad para la transición */
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
  }

  .nav-links li {
    margin: 0 10px;
  }

  .nav-links li a {
    text-decoration: none;
    color: inherit;
  }

  /* Estilos para móvil */
  @media (max-width: 768px) {
    .hamburger {
      display: block; /* Mostrar solo en móvil */
    }

    .nav-links {
      flex-direction: column;
      width: 100%;
      background: white;
      position: absolute;
      top: 100%;
      left: 0;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
      z-index: 999;
      /* Mantenemos display:flex pero controlamos la altura */
      display: flex;
      max-height: 0;
      padding: 0; /* Inicialmente sin padding */
    }


    .nav-links.show {
      max-height: 500px; /* Ajusta este valor según tu contenido */
      padding: 1rem 0; /* Añadimos padding solo cuando está visible */
      transition: max-height 0.3s ease-in, padding 0.3s ease-in;
    }

    .nav-links li {
      margin: 0;
      padding: 10px 20px;
      border-bottom: 1px solid #eee;
    }

    .nav-links li:last-child {
      border-bottom: none;
    }

    .login, .user-wrapper {
      order: 3; /* Mover a la derecha */
      margin-left: auto;
    }
  }

  /* Estilos para desktop (min-width: 769px) */
  @media (min-width: 769px) {
    .hamburger {
      display: none !important;
    }
    
    .nav-links {
      display: flex !important;
      max-height: none !important; /* Esto es crucial */
      position: static;
      width: auto;
      background: transparent;
      box-shadow: none;
      padding: 0 !important; /* Asegurar que no tenga padding que lo oculte */
    }
  }

  /* Estilos del user dropdown (mantener igual) */
  .user-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .user-avatar {
    width: 50px;
    height: 50px;
    aspect-ratio: 1 / 1;       
    border-radius: 50%;         
    object-fit: cover;          
    border: 2px solid rgba(0, 0, 0, 0);
    cursor: pointer;
    display: block;
  }

  .user-dropdown {
    display: none;
    position: absolute;
    top: 50px;
    right: 0;
    background: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10;
    width: 220px;
  }

  .user-dropdown p {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    word-break: break-word;
  }

  .user-dropdown button {
    display: block;
    width: 100%;
    padding: 8px 10px;
    background-color: #c6001a;
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    margin-top: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .user-dropdown button:hover {
    background-color: #a00015;
  }
`;
document.head.appendChild(style);


