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
        password
    });

    // שמירת שם המשתמש כמזהה ייחודי
    await client.set(`username:${username}`, email);

    res.send('User registered successfully');
});

// 📌 מסלול להתחברות משתמשים
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    // קריאת פרטי המשתמש מה-Redis
    const user = await client.hGetAll(`user:${email}`);

    if (!user.email) {
        return res.status(401).send('Invalid email or password');
    }

    if (user.password !== password) {
        return res.status(401).send('Invalid email or password');
    }

    // שמירת המידע ב-session
    req.session.loggedIn = true;
    req.session.email = email;
    req.session.username = user.username;

    res.send('Login successful');
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


// 📌 שרת מאזין ב-PORT 3000
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
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
    // מחיקת ה-session על מנת לנתק את המשתמש
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Could not log out');
        }
        res.send('<h1>You have logged out successfully!</h1>');
    });
});
