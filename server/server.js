import express from 'express';
import path from 'path';
import cors from 'cors';
import { createClient } from 'redis';

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
app.use(express.static(path.join(path.resolve(), '..', 'public')));

// Route for user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // שמירת שם משתמש וסיסמה ב-Redis
  await client.set(username, password);

  res.send('User registered successfully');
});

// Route for user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // קריאת הסיסמה ששמורה ב-Redis
  const storedPassword = await client.get(username);

  if (storedPassword === password) {
    res.send('Login successful');
  } else {
    res.send('Invalid username or password');
  }
});

// הגדרת Route לעמוד הראשי
app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), '..', 'public', 'index.html'));
});

// שרת מאזין ב-PORT 3000
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
  