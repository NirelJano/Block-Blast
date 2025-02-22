document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add('fade-in');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const submitNewPasswordBtn = document.getElementById('submitNewPasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const getTopScoresBtn = document.getElementById('getTopScoresBtn');
    const newPasswordInput = document.getElementById('newPassword'); 

    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const forgotPasswordFormContainer = document.getElementById('forgotPasswordFormContainer');
    const scoresContainer = document.getElementById('scoresContainer');
    
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
            body: JSON.stringify({ email, username, password, highScore: 0 })
        });

        const result = await response.text();

        if (response.ok) {
            registerMessage.style.color = 'green';
            registerMessage.textContent = result;

            // After successful registration, navigate to the new screen (currently empty)
            setTimeout(() => {
                window.location.href = 'game.html'; // מעבר ישיר לעמוד המשחק
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

        const result = await response.json();

        if (response.ok) {
            loginMessage.style.color = 'green';
            loginMessage.textContent = 'Logged in successfully! Redirecting to game';

             // מעבר ישיר לעמוד המשחק
        setTimeout(() => {
            window.location.href = result.redirect; 
        }, 1000);
    } else {
        loginMessage.style.color = 'red';
        loginMessage.textContent = 'Invalid email or password';
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

    getTopScoresBtn.addEventListener('click', async () => {  
        try {  
            // שליחת בקשת GET לשרת  
            const response = await fetch('/top-scores');  
            if (!response.ok) {  
                throw new Error('Failed to fetch top scores');  
            }  
    
            // המרת התגובה ל-JSON  
            const topScores = await response.json(); // עדכון כאן - אין צורך ב-destructuring  
            
            // נקה תוכן קודם  
            scoresContainer.innerHTML = '';  
            
            // הצגת שלוש התוצאות המובילות  
            topScores.forEach((score, index) => {  
                const scoreElement = document.createElement('div');  
                scoreElement.classList.add('scoreItem'); // הוסף את הקלאס scoreItem  
                scoreElement.innerHTML = `<span class="rank">${index + 1}.</span> ${score.username}: ${score.score}`;  
                scoresContainer.appendChild(scoreElement);  
            });
    
        } catch (error) {  
            console.error('Error fetching top scores:', error);  
            scoresContainer.innerHTML = '<p>Failed to load top scores. Please try again later.</p>';  
        }  
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

    if (startGameBtn) {
        startGameBtn.addEventListener('click', function () {
            transitionToPage('game.html'); // מעבר לעמוד המשחק
        });
    }
    

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
     
   // פונקציה למעבר עם אנימציה
function transitionToPage(url) {
    document.body.classList.add('fade-out'); // הפעלת אפקט יציאה

    setTimeout(() => {
        window.location.href = url; // מעבר לעמוד החדש אחרי האנימציה
    }, 500); // זמן בהתאם ל-transition ב-CSS
}