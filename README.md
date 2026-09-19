# reading-room

A personal digital library and e-book reader. Upload PDFs, EPUBs, or
text/Markdown files, organize them on a bookshelf, and read them
in-browser with reading status, star ratings, and notes.

## Stack

- **Backend**: Node.js, Express, SQLite (via `better-sqlite3`), Multer for uploads
- **Frontend**: React + Vite, `react-router-dom`, `epubjs` for EPUB rendering, `react-markdown` for Markdown

This is a single-user app with no authentication — everything lives in one
shared library, stored locally.

## Running locally

You need two terminals (or run each in the background).

**Backend** (http://localhost:3001):

```bash
cd server
npm install
npm run dev
```

**Frontend** (http://localhost:5173):

```bash
cd client
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to the backend, so just
open http://localhost:5173.

Uploaded files are stored in `server/uploads/` and metadata in
`server/data.sqlite`, both git-ignored.

## Features

- Upload PDF, EPUB, TXT, or MD files
- Bookshelf grid with cover thumbnails and filters (unread / reading / finished)
- In-browser reading:
  - PDF via the browser's native viewer
  - EPUB via `epubjs`, with page navigation and reading-position sync
  - Text/Markdown rendered inline
- Per-book status, 5-star rating, and free-text notes
