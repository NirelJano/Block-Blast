async function loginUser(email, password) {
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (result.success) {
        window.location.href = result.redirect; // מעבר לעמוד המשחק
    } else {
        alert(result.message);
    }
}
