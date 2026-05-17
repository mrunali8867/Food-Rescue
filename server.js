// ============================================================
//  server.js  –  FoodRescue Backend  (FIXED)
//  Node.js + Express + SQLite (better-sqlite3)
// ============================================================

const express  = require('express');
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────────────────────
// Allow requests from any origin (needed for phone access on same WiFi)
app.use(cors({ origin: '*' }));
app.use(express.json());

// FIX: Serve static files from the ROOT folder (not /public)
// Your index.html, style.css, script.js are all in the same folder as server.js
app.use(express.static(path.join(__dirname)));

// ── Database Setup ────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'foodrescue.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    createdAt TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS donations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    donorName      TEXT NOT NULL,
    foodType       TEXT NOT NULL,
    quantity       TEXT NOT NULL,
    pickupLocation TEXT NOT NULL,
    status         TEXT DEFAULT 'available',
    createdAt      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS claimedFoods (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    recipientName TEXT NOT NULL,
    foodId        INTEGER NOT NULL,
    timestamp     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (foodId) REFERENCES donations(id)
  );
`);

// ── Seed demo data (only if table is empty) ───────────────────
const seedCount = db.prepare('SELECT COUNT(*) as cnt FROM donations').get();
if (seedCount.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO donations (donorName, foodType, quantity, pickupLocation)
    VALUES (?, ?, ?, ?)
  `);
  [
    ['Priya Sharma',  'Rice & Dal',        '5 kg',     'Dadar, Mumbai'],
    ['Rahul Mehta',   'Fresh Vegetables',  '3 kg',     'Andheri West'],
    ['Sunita Patel',  'Bread & Biscuits',  '2 packs',  'Bandra East'],
    ['Amit Kulkarni', 'Cooked Biryani',    '10 plates','Thane'],
    ['Neha Joshi',    'Fruits (Seasonal)', '4 kg',     'Powai'],
  ].forEach(row => insert.run(...row));
  console.log('✅ Demo food data seeded.');
}

// ═══════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════

// ── Health check (useful for debugging) ──────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodRescue server is running!' });
});

// ── POST /api/signup ──────────────────────────────────────────
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const stmt   = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email.toLowerCase().trim(), hashed);

    console.log(`[SIGNUP] New user: ${name} <${email}>`);
    res.status(201).json({ message: 'Account created successfully!', userId: result.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
      return res.status(409).json({ error: 'Email already registered.' });
    console.error('[SIGNUP ERROR]', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/signin ──────────────────────────────────────────
app.post('/api/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user)
    return res.status(401).json({ error: 'No account found with that email.' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match)
    return res.status(401).json({ error: 'Incorrect password.' });

  console.log(`[SIGNIN] ${user.name} <${email}>`);
  res.json({ message: `Welcome back, ${user.name}!`, userId: user.id, name: user.name });
});

// ── POST /api/donate ──────────────────────────────────────────
app.post('/api/donate', (req, res) => {
  const { donorName, foodType, quantity, pickupLocation } = req.body;

  if (!donorName || !foodType || !quantity || !pickupLocation)
    return res.status(400).json({ error: 'All donation fields are required.' });

  try {
    const stmt   = db.prepare(`
      INSERT INTO donations (donorName, foodType, quantity, pickupLocation)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      donorName.trim(),
      foodType.trim(),
      quantity.trim(),
      pickupLocation.trim()
    );

    console.log(`[DONATE] ${donorName} donated ${quantity} of ${foodType} at ${pickupLocation}`);
    res.status(201).json({ message: 'Donation listed successfully!', donationId: result.lastInsertRowid });
  } catch (err) {
    console.error('[DONATE ERROR]', err);
    res.status(500).json({ error: 'Could not save donation. Please try again.' });
  }
});

// ── GET /api/foods ────────────────────────────────────────────
app.get('/api/foods', (req, res) => {
  try {
    const foods = db.prepare(`
      SELECT id, donorName, foodType, quantity, pickupLocation, createdAt
      FROM donations
      WHERE status = 'available'
      ORDER BY createdAt DESC
    `).all();
    res.json(foods);
  } catch (err) {
    console.error('[FOODS ERROR]', err);
    res.status(500).json({ error: 'Could not fetch foods.' });
  }
});

// ── POST /api/claim/:id ───────────────────────────────────────
app.post('/api/claim/:id', (req, res) => {
  const { id }            = req.params;
  const { recipientName } = req.body;

  if (!recipientName || !recipientName.trim())
    return res.status(400).json({ error: 'Recipient name is required.' });

  const food = db.prepare(`SELECT * FROM donations WHERE id = ? AND status = 'available'`).get(id);
  if (!food)
    return res.status(404).json({ error: 'Food item not found or already claimed.' });

  try {
    const claimTransaction = db.transaction(() => {
      db.prepare(`UPDATE donations SET status = 'claimed' WHERE id = ?`).run(id);
      db.prepare(`INSERT INTO claimedFoods (recipientName, foodId) VALUES (?, ?)`).run(recipientName.trim(), id);
    });
    claimTransaction();

    console.log(`[CLAIM] ${recipientName} claimed "${food.foodType}" (id: ${id})`);
    res.json({ message: `You successfully claimed "${food.foodType}"! Contact ${food.donorName} at ${food.pickupLocation}.` });
  } catch (err) {
    console.error('[CLAIM ERROR]', err);
    res.status(500).json({ error: 'Could not process claim. Please try again.' });
  }
});

// ── Catch-all: serve index.html for any unknown route ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🌱 FoodRescue server is RUNNING!');
  console.log(`\n📱 Open on THIS computer:  http://localhost:${PORT}`);
  console.log(`📱 Open on your PHONE:     http://<your-wifi-ip>:${PORT}`);
  console.log('\n👉 To find your WiFi IP:');
  console.log('   Windows: run  ipconfig  → look for IPv4 Address');
  console.log('   Mac/Linux: run  ifconfig  → look for inet address');
  console.log('\nPress Ctrl+C to stop.\n');
});
