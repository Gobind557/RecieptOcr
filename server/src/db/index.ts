import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, '../../receipts.db'),
    driver: sqlite3.Database
  });

  await initDb(db);
  return db;
}

async function initDb(database: Database) {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      merchant TEXT,
      date TEXT,
      subtotal REAL,
      tax REAL,
      discount REAL,
      tip REAL,
      total REAL,
      confidence REAL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id TEXT PRIMARY KEY,
      receiptId TEXT,
      name TEXT,
      amount REAL,
      confidence REAL,
      FOREIGN KEY (receiptId) REFERENCES receipts(id) ON DELETE CASCADE
    );
  `);
}
