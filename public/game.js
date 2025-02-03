document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');
    const newScreen = document.getElementById('newScreen');
    const startGameBtn = document.getElementById('startGameBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if the user is already logged in
    fetch('/check-login-status')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                // If the user is logged in, show the game screen
                newScreen.style.display = 'block';
                startGameBtn.disabled = false;
                registerBtn.style.display = 'none'; // Hide register button
                loginBtn.style.display = 'none';
            } else {
                // If the user is not logged in, show the login and register buttons
                registerFormContainer.style.display = 'none';
                loginFormContainer.style.display = 'none';
                newScreen.style.display = 'none';
                registerBtn.style.display = 'inline-block';
                loginBtn.style.display = 'inline-block';
            }
        });

    // Show registration form when "Register" button is clicked
    registerBtn.addEventListener('click', () => {
        registerFormContainer.style.display = 'block';
        loginFormContainer.style.display = 'none';
    });

    // Show login form when "Login" button is clicked
    loginBtn.addEventListener('click', () => {
        loginFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'none';
    });

    // Submit registration form
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.text();

        if (response.ok) {
            registerMessage.style.color = 'green';
            registerMessage.textContent = result;

            // After successful registration, navigate to the new screen (currently empty)
            setTimeout(() => {
                registerFormContainer.style.display = 'none';  // הסתרת טופס ההרשמה
                loginFormContainer.style.display = 'none';  // הסתרת טופס ההתחברות
                registerBtn.style.display = 'none';
                loginBtn.style.display = 'none';
                newScreen.style.display = 'block';  // הצגת מסך המשחק
            }, 2000);
        } else {
            registerMessage.style.color = 'red';
            registerMessage.textContent = result;
        }
    });

    // Submit login form
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.text();

        if (response.ok) {
            loginMessage.style.color = 'green';
            loginMessage.textContent = result;

            // After successful login, navigate to the new screen (currently empty)
            setTimeout(() => {
                registerFormContainer.style.display = 'none';  // הסתרת טופס ההרשמה
                loginFormContainer.style.display = 'none';  // הסתרת טופס ההתחברות
                registerBtn.style.display = 'none';
                loginBtn.style.display = 'none';
                newScreen.style.display = 'block';  // הצגת מסך המשחק
            }, 2000);
        } else {
            loginMessage.style.color = 'red';
            loginMessage.textContent = result;
        }
    });
    
    // Start game button (not functional yet)
    startGameBtn.addEventListener('click', () => {
        alert('Game starting... (Not yet implemented)');
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
            // ניקוי המידע על התחברות והחזרת הטפסים
        sessionStorage.setItem('loggedIn', 'false');
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'none';
        newScreen.style.display = 'none';
        registerBtn.style.display = 'inline-block';
        loginBtn.style.display = 'inline-block';
            });
});
