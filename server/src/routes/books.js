import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const EXT_TO_FORMAT = {
  '.pdf': 'pdf',
  '.epub': 'epub',
  '.txt': 'text',
  '.md': 'text',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!EXT_TO_FORMAT[ext]) {
    cb(new Error('Unsupported file type. Allowed: PDF, EPUB, TXT, MD.'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const COVER_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const uploadCover = multer({
  storage: coverStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!COVER_EXTS.has(ext)) {
      cb(new Error('Unsupported cover image type.'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM books ORDER BY updated_at DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

router.post('/', upload.single('file'), uploadHandler);

function uploadHandler(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const format = EXT_TO_FORMAT[ext];
  const title = (req.body.title || path.basename(req.file.originalname, ext)).trim();
  const author = (req.body.author || '').trim() || null;

  const result = db
    .prepare(
      `INSERT INTO books (title, author, format, filename, original_filename)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(title, author, format, req.file.filename, req.file.originalname);

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(book);
}

router.post('/:id/cover', uploadCover.single('cover'), (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (!req.file) return res.status(400).json({ error: 'No cover uploaded' });

  if (book.cover_filename) {
    const oldPath = path.join(uploadsDir, book.cover_filename);
    fs.rm(oldPath, { force: true }, () => {});
  }

  db.prepare(
    `UPDATE books SET cover_filename = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(req.file.filename, req.params.id);

  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  res.json(updated);
});

const PATCHABLE_FIELDS = ['title', 'author', 'status', 'progress', 'notes', 'rating'];
const VALID_STATUS = new Set(['unread', 'reading', 'finished']);

router.patch('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  if (req.body.status !== undefined && !VALID_STATUS.has(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (req.body.rating !== undefined && req.body.rating !== null) {
    const r = Number(req.body.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'Rating must be an integer 1-5' });
    }
  }

  const updates = {};
  for (const field of PATCHABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const setClause = Object.keys(updates)
    .map((f) => `${f} = @${f}`)
    .join(', ');
  db.prepare(`UPDATE books SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run({
    ...updates,
    id: req.params.id,
  });

  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);

  for (const filename of [book.filename, book.cover_filename]) {
    if (filename) fs.rm(path.join(uploadsDir, filename), { force: true }, () => {});
  }

  res.status(204).end();
});

router.get('/:id/file', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const filePath = path.join(uploadsDir, book.filename);
  res.sendFile(filePath);
});

router.get('/:id/cover', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book || !book.cover_filename) return res.status(404).end();

  const filePath = path.join(uploadsDir, book.cover_filename);
  res.sendFile(filePath);
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});
