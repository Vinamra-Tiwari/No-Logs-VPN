const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY; // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

let db;

const path = require('path');

async function initDB() {
  db = await open({
    filename: path.join(__dirname, 'vpn.db'),
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      public_key TEXT NOT NULL,
      private_key_enc TEXT NOT NULL,
      ip_address TEXT NOT NULL UNIQUE,
      kill_switch INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1
    );
  `);

  try {
    await db.exec("ALTER TABLE clients ADD COLUMN kill_switch INTEGER DEFAULT 0");
  } catch (e) {
    // Column already exists
  }

  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

module.exports = { initDB, getDb, encrypt, decrypt };
