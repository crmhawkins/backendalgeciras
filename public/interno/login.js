document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Credenciales directas para desarrollo
    if (username === 'admin' && password === 'R4t4-2020') {
        // Guardar sesión
        sessionStorage.setItem('internalAuth', 'true');
        // Redirigir a la página de abonos internos
        window.location.href = 'abonos.html';
    } else {
        errorMessage.style.display = 'block';
        // Limpiar el formulario después de 2 segundos
        setTimeout(() => {
            document.getElementById('password').value = '';
            errorMessage.style.display = 'none';
        }, 2000);
    }
}); 