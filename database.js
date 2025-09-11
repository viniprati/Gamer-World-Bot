const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gamerworld.db');
const db = new Database(dbPath);

// Criar tabelas se não existirem
db.prepare(`
CREATE TABLE IF NOT EXISTS economy (
    userId TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    type TEXT,
    amount INTEGER,
    date TEXT
)
`).run();

module.exports = db;
