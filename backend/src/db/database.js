import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory paths in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SQLite database file
const dbPath = path.resolve(__dirname, '../../moneytrack.db');

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

// Initialize the database connection
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initTables();
  }
});

// Function to create database tables
function initTables() {
  db.serialize(() => {
    // SQLite disables foreign key constraints by default; this enables them
    db.run('PRAGMA foreign_keys = ON;');

    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table verified/created successfully.');
      }
    });

    // 2. Expenses Table
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating expenses table:', err.message);
      } else {
        console.log('Expenses table verified/created successfully.');
      }
    });
  });
}

export default db;
