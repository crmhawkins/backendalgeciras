// Verificar autenticación al cargar la página
function checkAuth() {
    if (!sessionStorage.getItem('internalAuth')) {
        window.location.href = 'login.html';
    }
}

// Función para cerrar sesión
function logout() {
    sessionStorage.removeItem('internalAuth');
    window.location.href = 'login.html';
}

// Verificar autenticación al cargar
checkAuth(); 