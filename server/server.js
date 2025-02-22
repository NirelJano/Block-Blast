import express from 'express';
import path from 'path';
import cors from 'cors';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';
import session from 'express-session'; // הוספנו את express-session

const app = express();
const port = 3000;

// הגדרת Redis client
const client = createClient({
  username: 'default',
  password: '19dqhpFEW3f79r5PXidm8K1CDsa206uf',
  socket: {
    host: 'redis-10687.c270.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 10687
  }
});

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

// הגדרת middleware
app.use(cors());
app.use(express.json());

// הגדרת session
app.use(session({
  secret: 'your-secret-key', // מפתח סודי לשמירה על session
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // אם אתה משתמש ב-HTTPS תוכל להגדיר ל-true
}));

// 📌 הגדרת תיקיית `public` כדי לטעון קבצים סטטיים
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '..', 'public')));

// 📌 מסלול להרשמת משתמשים
app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
        return res.status(400).send('Email, username, and password are required');
    }

    // בדיקה אם האימייל כבר רשום
    const existingUser = await client.hGetAll(`user:${email}`);
    if (existingUser.email) {
        return res.status(409).send('Email already registered');
    }

    // בדיקה אם שם המשתמש כבר קיים
    const existingUsername = await client.get(`username:${username}`);
    if (existingUsername) {
        return res.status(409).send('Username already taken');
    }

    // שמירת נתוני המשתמש ב-Redis
    await client.hSet(`user:${email}`, {
        email,
        username,
        password,
        highScore: 0
    });

    // שמירת שם המשתמש כמזהה ייחודי
    await client.set(`username:${username}`, email);
    req.session.loggedIn = true;
    req.session.email = email;
    req.session.username = username;
    res.send('User registered successfully');
});

// 📌 מסלול להתחברות משתמשים
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // קריאת פרטי המשתמש מה-Redis
    const user = await client.hGetAll(`user:${email}`);

    if (!user.email || user.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // שמירת המשתמש ב-Session
    req.session.loggedIn = true;
    req.session.email = email;
    req.session.username = user.username;

    // החזרת תשובה עם כתובת העמוד אליו יש להפנות את המשתמש
    console.log("🔹 User logged in, directing to game.html");
    res.json({ success: true, redirect: 'game.html' });
});


// 📌 מסלול לבדוק אם המשתמש מחובר
app.get('/check-login-status', (req, res) => {
    if (req.session.loggedIn) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Route ראשי שיחזיר תמיד את ה-index.html
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        // אם המשתמש מחובר, תחזור על ה-index.html, ו-JavaScript יציג את הכפתורים המתאימים
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // אם לא מחובר, גם אז תחזור על ה-index.html
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// 📌 מסלול המאפשר גישה לעמוד המשחק רק למשתמשים מחוברים
app.get('/game', (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: 'User not logged in' });
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'game.html'));
});


// 📌 שרת מאזין ב-PORT 3000
app.listen(3000, '0.0.0.0', () => {
    console.log("Server is running at http://0.0.0.0:3000");
});


// 🔹 בדיקת חיבור ל-Redis
app.get('/check', async (req, res) => {
    try {
        await client.set('testKey', 'testValue'); // שמירת נתון לבדיקה
        const value = await client.get('testKey'); // שליפת הנתון
        res.send(`Redis is working! Stored value: ${value}`);
    } catch (error) {
        res.status(500).send('Redis connection error');
    }
});

// Route for logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});




// 📌 מסלול לשכחתי סיסמה
app.post('/forgot-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).send('Email and new password are required');
    }

    // חיפוש המשתמש ב-Redis
    const user = await client.hGetAll(`user:${email}`);

    if (!user.email) {
        return res.status(404).send('User not found');
    }

    // עדכון הסיסמה ב-Redis
    await client.hSet(`user:${email}`, 'password', newPassword);

    res.send('Password has been updated successfully');
});


// 📌 מסלול לשינוי סיסמה כשהמשתמש מחובר
app.post('/change-password', async (req, res) => {
    const { newPassword } = req.body;
    const email = req.session.email; // האימייל שנשמר ב-session

    if (!email || !newPassword) {
        return res.status(400).send('Email and new password are required');
    }

    // חיפוש המשתמש ב-Redis
    const user = await client.hGetAll(`user:${email}`);

    if (!user.email) {
        return res.status(404).send('User not found');
    }

    // עדכון הסיסמה ב-Redis
    await client.hSet(`user:${email}`, 'password', newPassword);

    res.send('Password has been changed successfully');
});


// פונקציה לעדכון שיא אישי
app.post('/update-high-score', async (req, res) => {
    const { score } = req.body;
    const email = req.session.email; // מזהה את המשתמש המחובר

    if (!email) {
        return res.status(401).send('User not logged in');
    }
    
    if (typeof score !== 'number' || score < 0) {
        return res.status(400).send('Invalid score');
    }
    
    // שליפת המשתמש מה-Redis
    const user = await client.hGetAll(`user:${email}`);
    const highScore = parseInt(user.highScore) || 0;

    // אם הציון החדש גבוה מהשיא הנוכחי - מעדכן
    if (score > highScore) {
        await client.hSet(`user:${email}`, 'highScore', score);
        // עדכון לוח השיאים הגלובלי - משתמשים מזוהים לפי req.session.username
        await client.zAdd('topScores', { score: score, value: req.session.username });
        return res.json({ success: true, message: 'New high score updated!' });
    } else {
        // במקרה שהציון החדש לא גבוה יותר - שולח תגובה מתאימה
        return res.json({ success: false, message: 'Score not high enough' });
    }
});




// פונקציה לשליפת השיא האישי של המשתמש
app.get('/api/best-score', async (req, res) => {
    const email = req.session.email; // מזהה את המשתמש המחובר

    if (!email) {
        return res.status(401).json({ error: 'User not logged in' });
    }
    
    const user = await client.hGetAll(`user:${email}`);
    const highScore = parseInt(user.highScore) || 0;
    res.json({ bestScore: highScore });
});


app.get("/get-username", (req, res) => {
    if (!req.session || !req.session.username) {
        return res.status(401).json({ error: "User not logged in" });
    }
    
    res.json({ username: req.session.username });
});


app.get('/top-scores', async (req, res) => {  
    try {  
        console.log("Fetching top scores from Redis...");  

        // שליפת כל הציונים מ-Redis  
        const allUsers = await client.keys('user:*'); // מקבל את כל המשתמשים  
        const scores = [];  

        for (const userKey of allUsers) {  
            const userData = await client.hGetAll(userKey);  
            if (userData.highScore) {  
                scores.push({  
                    username: userData.username,  
                    score: parseInt(userData.highScore, 10) // המרת ניקוד למספר  
                });  
            }  
        }  

        // מיון התוצאות בסדר יורד לפי ניקוד  
        scores.sort((a, b) => b.score - a.score);  

        // לקיחת שלושת הציונים הגבוהים ביותר  
        const top3 = scores.slice(0, 3);  

        console.log("Top 3 scores:", top3);  

        // שליחת התוצאות ללקוח  
        res.json(top3);  
    } catch (error) {  
        console.error('Error fetching top scores:', error);  
        res.status(500).json({ message: 'Error fetching top scores' });  
    }  
});




