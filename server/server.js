import express from 'express';
import path from 'path';
import cors from 'cors';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';

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

    res.send('Login successful');
});

// 📌 מסלול לעמוד הראשי
app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), '..', 'public', 'index.html'));
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
