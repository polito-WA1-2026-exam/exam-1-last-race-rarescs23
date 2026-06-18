/**
 * init-db.js
 * SQLite database initialization script.
 * Run with: node init-db.js
 *
 * Creates all tables and seeds with:
 *  - 4 metro lines
 *  - 14 stations (4 interchange stations = 28% < 50%)
 *  - segments (consecutive pairs on each line)
 *  - 8 random events (effects between -4 and +4)
 *  - 3 users with hashed passwords (crypto.scrypt)
 *  - pre-existing completed games for 2 users (for ranking leaderboard)
 */

import sqlite3 from "sqlite3";
import crypto from "crypto";

const db = new sqlite3.Database("metro.sqlite", (err) => {
  if (err) throw err;
});

// Helper: run SQL in Promise
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

// Helper: hash password using crypto.scrypt
const hashPassword = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, hashedBuffer) => {
      if (err) reject(err);
      else resolve(hashedBuffer.toString("hex"));
    });
  });

const initDb = async () => {
  // ─── 1. CREATE TABLES ──────────────────────────────────────────────────────

  await run("PRAGMA foreign_keys = ON");

  await run(`CREATE TABLE IF NOT EXISTS user (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    email    TEXT    NOT NULL UNIQUE,
    name     TEXT    NOT NULL,
    password TEXT    NOT NULL,
    salt     TEXT    NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS line (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    color TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS station (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS station_line (
    stationId INTEGER NOT NULL REFERENCES station(id),
    lineId    INTEGER NOT NULL REFERENCES line(id),
    "order"   INTEGER NOT NULL,
    PRIMARY KEY (stationId, lineId)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS segment (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    station1Id INTEGER NOT NULL REFERENCES station(id),
    station2Id INTEGER NOT NULL REFERENCES station(id),
    lineId     INTEGER NOT NULL REFERENCES line(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS event (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT    NOT NULL,
    scoreEffect INTEGER NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS game (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    userId       INTEGER NOT NULL REFERENCES user(id),
    startStation INTEGER NOT NULL REFERENCES station(id),
    endStation   INTEGER NOT NULL REFERENCES station(id),
    finalScore   INTEGER,
    completed    INTEGER NOT NULL DEFAULT 0,
    createdAt    TEXT    NOT NULL
  )`);

  console.log("✓ Tabele create.");

  // ─── 2. SEED: LINII ────────────────────────────────────────────────────────
  // 4 metro lines

  await run(`INSERT OR IGNORE INTO line (id, name, color) VALUES (1, 'Red Line',    '#e63946')`);
  await run(`INSERT OR IGNORE INTO line (id, name, color) VALUES (2, 'Blue Line',   '#457b9d')`);
  await run(`INSERT OR IGNORE INTO line (id, name, color) VALUES (3, 'Green Line',  '#2a9d8f')`);
  await run(`INSERT OR IGNORE INTO line (id, name, color) VALUES (4, 'Yellow Line', '#e9c46a')`);

  console.log("✓ Linii inserate.");

  // ─── 3. SEED: STAȚII ───────────────────────────────────────────────────────
  // 14 total stations
  // Interchange stations (on 2+ lines): Victory Square (R+B), University (R+G), Union (R+Y), Roman Square (B+G)
  // 4 out of 14 = 28% of stations are interchange stations.

  const stations = [
    [1,  "North Terminus"],    // Red Line
    [2,  "Victory Square"],    // Interchange: Red + Blue
    [3,  "University"],        // Interchange: Red + Green
    [4,  "Union Square"],      // Interchange: Red + Yellow
    [5,  "South Times"],
    [6,  "South Terminus"],    // Red Line
    [7,  "West Lake"],         // Blue Line
    [8,  "Aviators"],
    [9,  "Roman Square"],      // Interchange: Blue + Green
    [10, "East Terminus"],     // Blue Line
    [11, "North Park"],        // Green Line
    [12, "Youth Quarter"],
    [13, "Berceni"],           // Green Line
    [14, "Central Station"],   // Yellow Line
    [15, "Decebal"],
    [16, "First of December"], // Yellow Line
  ];

  for (const [id, name] of stations) {
    await run(`INSERT OR IGNORE INTO station (id, name) VALUES (?, ?)`, [id, name]);
  }

  console.log("✓ Stații inserate.");

  // ─── 4. SEED: STATION_LINE (station order on each line) ────────────

  // Red Line (id=1): North Terminus -> Victory Square -> University -> Union Square -> South Times -> South Terminus
  const redLine = [
    [1, 1, 1], [2, 1, 2], [3, 1, 3], [4, 1, 4], [5, 1, 5], [6, 1, 6]
  ];
  // Blue Line (id=2): West Lake -> Victory Square -> Aviators -> Roman Square -> East Terminus
  const blueLine = [
    [7, 2, 1], [2, 2, 2], [8, 2, 3], [9, 2, 4], [10, 2, 5]
  ];
  // Green Line (id=3): North Park -> Roman Square -> University -> Youth Quarter -> Berceni
  const greenLine = [
    [11, 3, 1], [9, 3, 2], [3, 3, 3], [12, 3, 4], [13, 3, 5]
  ];
  // Yellow Line (id=4): Central Station -> Union Square -> Decebal -> First of December
  const yellowLine = [
    [14, 4, 1], [4, 4, 2], [15, 4, 3], [16, 4, 4]
  ];

  for (const [stationId, lineId, order] of [...redLine, ...blueLine, ...greenLine, ...yellowLine]) {
    await run(
      `INSERT OR IGNORE INTO station_line (stationId, lineId, "order") VALUES (?, ?, ?)`,
      [stationId, lineId, order]
    );
  }

  console.log("✓ Stații-linii inserate.");

  // ─── 5. SEED: SEGMENTS (consecutive pairs on the same line) ─────────────

  const segments = [
    // Red Line (id=1)
    [1,  1, 2,  1],  // North Terminus → Victory Square
    [2,  2, 3,  1],  // Victory Square → University
    [3,  3, 4,  1],  // University → Union Square
    [4,  4, 5,  1],  // Union Square → South Times
    [5,  5, 6,  1],  // South Times → South Terminus
    // Blue Line (id=2)
    [6,  7, 2,  2],  // West Lake → Victory Square
    [7,  2, 8,  2],  // Victory Square → Aviators
    [8,  8, 9,  2],  // Aviators → Roman Square
    [9,  9, 10, 2],  // Roman Square → East Terminus
    // Green Line (id=3)
    [10, 11, 9,  3], // North Park → Roman Square
    [11, 9,  3,  3], // Roman Square → University
    [12, 3,  12, 3], // University → Youth Quarter
    [13, 12, 13, 3], // Youth Quarter → Berceni
    // Yellow Line (id=4)
    [14, 14, 4,  4], // Central Station → Union Square
    [15, 4,  15, 4], // Union Square → Decebal
    [16, 15, 16, 4], // Decebal → First of December
  ];

  for (const [id, s1, s2, lineId] of segments) {
    await run(
      `INSERT OR IGNORE INTO segment (id, station1Id, station2Id, lineId) VALUES (?, ?, ?, ?)`,
      [id, s1, s2, lineId]
    );
  }

  console.log("✓ Segmente inserate.");

  // ─── 6. SEED: EVENTS (minimum 8, effects between -4 and +4) ─────────────────

  const events = [
    [1,  "Smooth ride, you enjoy the view",              +2],
    [2,  "You found a ticket on the floor!",             +3],
    [3,  "A musician plays beautifully in the carriage", +1],
    [4,  "Train arrived on time — what a surprise!",     +4],
    [5,  "Wrong platform, you lose time",                -2],
    [6,  "Doors jammed, you are delayed",                -3],
    [7,  "Terrible overcrowding",                        -1],
    [8,  "Inspector fined you for no reason",            -4],
  ];

  for (const [id, description, scoreEffect] of events) {
    await run(
      `INSERT OR IGNORE INTO event (id, description, scoreEffect) VALUES (?, ?, ?)`,
      [id, description, scoreEffect]
    );
  }

  console.log("✓ Evenimente inserate.");

  // ─── 7. SEED: USERS (3+, with hashed passwords) ─────────────

  const users = [
    { id: 1, email: "alice@example.com",   name: "Alice",   password: "password1" },
    { id: 2, email: "bob@example.com",     name: "Bob",     password: "password2" },
    { id: 3, email: "charlie@example.com", name: "Charlie", password: "password3" },
  ];

  for (const user of users) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hashPassword(user.password, salt);
    await run(
      `INSERT OR IGNORE INTO user (id, email, name, password, salt) VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.email, user.name, hashedPassword, salt]
    );
  }

  console.log("✓ Utilizatori inserați.");
  console.log("  Credențiale de test:");
  console.log("  alice@example.com   / password1");
  console.log("  bob@example.com     / password2");
  console.log("  charlie@example.com / password3");

  // ─── 8. SEED: COMPLETED GAMES (minimum 2 users with games in history) ─
  // The leaderboard must be populated on first run.
  // Alice: North Terminus -> South Terminus (BFS distance = 5 segments)
  // Bob: West Lake -> East Terminus (BFS distance = 4 segments)
  // Charlie: North Park -> Berceni (BFS distance = 4 segments, plus an invalid game with score 0)

  const completedGames = [
    // Alice — 2 successfully completed games
    [1, 1, 1,  6,  18, 1, "2026-06-10T10:00:00.000Z"],
    [2, 1, 7,  10, 24, 1, "2026-06-11T14:30:00.000Z"],
    // Bob — 2 successfully completed games
    [3, 2, 11, 13, 21, 1, "2026-06-12T09:15:00.000Z"],
    [4, 2, 1,  6,  15, 1, "2026-06-13T16:00:00.000Z"],
    // Charlie — 1 game with score 0 (invalid route), 1 successful
    [5, 3, 14, 10,  0, 1, "2026-06-14T11:00:00.000Z"],
    [6, 3, 7,  6,  12, 1, "2026-06-15T18:45:00.000Z"],
  ];

  for (const [id, userId, startStation, endStation, finalScore, completed, createdAt] of completedGames) {
    await run(
      `INSERT OR IGNORE INTO game (id, userId, startStation, endStation, finalScore, completed, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, startStation, endStation, finalScore, completed, createdAt]
    );
  }

  console.log("✓ Jocuri pre-existente inserate (Alice: 2, Bob: 2, Charlie: 1 valid + 1 scor 0).");

  // ─── DONE ─────────────────────────────────────────────────────────────────
  db.close((err) => {
    if (err) console.error("Eroare la închiderea DB:", err);
    else console.log("\n✓ Baza de date metro.sqlite inițializată cu succes!");
  });
};

initDb().catch((err) => {
  console.error("Eroare la inițializarea DB:", err);
  process.exit(1);
});
