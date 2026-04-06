// ============================================================
//  server.js  –  FoodRescue Backend
//  Node.js + Express + SQLite (better-sqlite3)
// ============================================================

const express    = require('express');
const Database   = require('better-sqlite3');
const bcrypt     = require('bcryptjs');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());                          // allow frontend on same machine
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve HTML/CSS/JS

// ── Database Setup ────────────────────────────────────────────
// SQLite stores everything in ONE file – no separate server needed.
// Perfect for a project like this (no install, no config, instant start).
const db = new Database('foodrescue.db');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
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
    status         TEXT DEFAULT 'available',   -- 'available' | 'claimed'
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

// ── Seed some demo food data (only if table is empty) ─────────
const seedCount = db.prepare('SELECT COUNT(*) as cnt FROM donations').get();
if (seedCount.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO donations (donorName, foodType, quantity, pickupLocation)
    VALUES (?, ?, ?, ?)
  `);
  [
    ['Priya Sharma',   'Rice & Dal',       '5 kg',    'Dadar, Mumbai'],
    ['Rahul Mehta',    'Fresh Vegetables',  '3 kg',    'Andheri West'],
    ['Sunita Patel',   'Bread & Biscuits',  '2 packs', 'Bandra East'],
    ['Amit Kulkarni',  'Cooked Biryani',    '10 plates','Thane'],
    ['Neha Joshi',     'Fruits (Seasonal)', '4 kg',    'Powai'],
  ].forEach(row => insert.run(...row));
}

// ═══════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════

// ── POST /signup ──────────────────────────────────────────────
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const stmt   = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashed);

    console.log(`[SIGNUP] New user: ${name} <${email}>`);
    res.status(201).json({ message: 'Account created successfully!', userId: result.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
      return res.status(409).json({ error: 'Email already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /signin ──────────────────────────────────────────────
app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user)
    return res.status(401).json({ error: 'No account found with that email.' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match)
    return res.status(401).json({ error: 'Incorrect password.' });

  console.log(`[SIGNIN] User logged in: ${user.name} <${email}>`);
  // In production: issue a JWT token here.
  res.json({ message: `Welcome back, ${user.name}!`, userId: user.id, name: user.name });
});

// ── POST /donate ──────────────────────────────────────────────
app.post('/donate', (req, res) => {
  const { donorName, foodType, quantity, pickupLocation } = req.body;

  if (!donorName || !foodType || !quantity || !pickupLocation)
    return res.status(400).json({ error: 'All donation fields are required.' });

  const stmt   = db.prepare(`
    INSERT INTO donations (donorName, foodType, quantity, pickupLocation)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(donorName, foodType, quantity, pickupLocation);

  console.log(`[DONATE] ${donorName} donated ${quantity} of ${foodType} at ${pickupLocation}`);
  res.status(201).json({ message: 'Donation listed successfully!', donationId: result.lastInsertRowid });
});

// ── GET /foods ────────────────────────────────────────────────
app.get('/foods', (req, res) => {
  const foods = db.prepare(`
    SELECT id, donorName, foodType, quantity, pickupLocation, createdAt
    FROM donations
    WHERE status = 'available'
    ORDER BY createdAt DESC
  `).all();

  res.json(foods);
});

// ── POST /claim/:id ───────────────────────────────────────────
app.post('/claim/:id', (req, res) => {
  const { id }            = req.params;
  const { recipientName } = req.body;

  if (!recipientName)
    return res.status(400).json({ error: 'Recipient name is required.' });

  // Check item exists and is available
  const food = db.prepare(`SELECT * FROM donations WHERE id = ? AND status = 'available'`).get(id);
  if (!food)
    return res.status(404).json({ error: 'Food item not found or already claimed.' });

  // Run both updates in a transaction (atomic)
  const claimTransaction = db.transaction(() => {
    db.prepare(`UPDATE donations SET status = 'claimed' WHERE id = ?`).run(id);
    db.prepare(`INSERT INTO claimedFoods (recipientName, foodId) VALUES (?, ?)`).run(recipientName, id);
  });

  claimTransaction();

  console.log(`[CLAIM] ${recipientName} claimed "${food.foodType}" (id: ${id})`);
  res.json({ message: `You successfully claimed "${food.foodType}"! Contact ${food.donorName} at ${food.pickupLocation}.` });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌱 FoodRescue server running at http://localhost:${PORT}`);
  console.log(`📦 Database: foodrescue.db`);
  console.log(`Press Ctrl+C to stop.\n`);
});
