import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data.sqlite');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'epub', 'text')),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    cover_filename TEXT,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'finished')),
    progress TEXT,
    notes TEXT,
    rating INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
