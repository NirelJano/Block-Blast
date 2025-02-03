document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const submitNewPasswordBtn = document.getElementById('submitNewPasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const newPasswordInput = document.getElementById('newPassword'); 

    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const forgotPasswordFormContainer = document.getElementById('forgotPasswordFormContainer');
    
    const newScreen = document.getElementById('newScreen');

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');
    const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');


    // Check if the user is already logged in
    fetch('/check-login-status')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                // If the user is logged in, show the game screen
                startGameBtn.disabled = false;
                changePasswordBtn.style.display = 'inline-block'; // הצגת כפתור שינוי סיסמא
                registerBtn.style.display = 'none';
                loginBtn.style.display = 'none';
                forgotPasswordBtn.style.display = 'none';
                newScreen.style.display = 'block';
            } else {
                registerFormContainer.style.display = 'none';
                loginFormContainer.style.display = 'none';
                forgotPasswordFormContainer.style.display = 'none';
                newScreen.style.display = 'none';
                registerBtn.style.display = 'inline-block';
                loginBtn.style.display = 'inline-block';
            }
        });

    // Show registration form when "Register" button is clicked
    registerBtn.addEventListener('click', () => {
        registerFormContainer.style.display = 'block';
        loginFormContainer.style.display = 'none';
        forgotPasswordFormContainer.style.display = 'none';
    });

    // הצגת טופס התחברות
    loginBtn.addEventListener('click', () => {
        loginFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'none';
        forgotPasswordFormContainer.style.display = 'none';
    });

    // הצגת טופס שכחתי סיסמה
    forgotPasswordBtn.addEventListener('click', () => {
        forgotPasswordFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'none';
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
                forgotPasswordFormContainer.style.display = 'none';  // הסתרת טופס שכחתי סיסמה
                registerBtn.style.display = 'none';
                loginBtn.style.display = 'none';
                forgotPasswordBtn.style.display = 'none';
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
                forgotPasswordFormContainer.style.display = 'none';  // הסתרת טופס שכחתי סיסמה
                registerBtn.style.display = 'none';
                loginBtn.style.display = 'none';
                forgotPasswordBtn.style.display = 'none';
                newScreen.style.display = 'block';  // הצגת מסך המשחק
            }, 2000);
        } else {
            loginMessage.style.color = 'red';
            loginMessage.textContent = result;
        }
    });

    // שליחת טופס שכחתי סיסמה
    forgotPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('forgotPasswordEmail').value;
        const newPassword = document.getElementById('forgotPasswordNewPassword').value;

        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword })
        });

        const result = await response.text();
        forgotPasswordMessage.style.color = response.ok ? 'green' : 'red';
        forgotPasswordMessage.textContent = result;
    });

    changePasswordBtn.addEventListener('click', () => {
        newPasswordInput.style.display = 'block';
        submitNewPasswordBtn.style.display = 'inline-block'; // הצגת כפתור עדכון הסיסמא
    });


    submitNewPasswordBtn.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value;
        if (!newPassword) {
            changePasswordMessage.style.display = 'block';
            changePasswordMessage.style.color = 'red';
            changePasswordMessage.textContent = 'Please enter a new password.';
            return;
        }

        try {
            const response = await fetch('/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });

            const result = await response.text();

            // הצגת הודעה שהתבצע שינוי סיסמה בהצלחה
            changePasswordMessage.style.display = 'block';
            changePasswordMessage.style.color = response.ok ? 'green' : 'red';
            changePasswordMessage.textContent = response.ok ? 'Password changed successfully!' : result;

            // ניקוי השדה
            newPasswordInput.value = '';
            newPasswordInput.style.display = 'none';
            submitNewPasswordBtn.style.display = 'none';
        } catch (error) {
            changePasswordMessage.style.display = 'block';
            changePasswordMessage.style.color = 'red';
            changePasswordMessage.textContent = 'Error changing password, please try again.';
            }
        });
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
        forgotPasswordBtn.style.display = 'inline-block'; // החזרת כפתור שכחתי סיסמא
            });
        
