document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const res = await fetch('/api/interno/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.ok) {
            sessionStorage.setItem('internalAuth', 'true');
            window.location.href = 'abonos.html';
        } else {
            errorMessage.style.display = 'block';
            setTimeout(() => {
                document.getElementById('password').value = '';
                errorMessage.style.display = 'none';
            }, 2000);
        }
    } catch {
        errorMessage.style.display = 'block';
    }
});