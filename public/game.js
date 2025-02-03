document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageElement = document.getElementById('message');
    const loginForm = document.getElementById('loginForm');
    const loginMessageElement = document.getElementById('loginMessage');

    // הרשמה
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // מונע רענון דף

        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // שליחת הבקשה לשרת
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.text();

        // הצגת הודעה למשתמש בהתאם לתגובה מהשרת
        if (response.ok) {
            messageElement.style.color = 'green';
        } else {
            messageElement.style.color = 'red';
        }

        messageElement.textContent = result; // הצגת ההודעה למשתמש
    });

    // התחברות
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // מונע רענון דף

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // שליחת הבקשה לשרת
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.text();

        // הצגת הודעה למשתמש בהתאם לתגובה מהשרת
        if (response.ok) {
            loginMessageElement.style.color = 'green';
        } else {
            loginMessageElement.style.color = 'red';
        }

        loginMessageElement.textContent = result; // הצגת ההודעה למשתמש
    });
});
