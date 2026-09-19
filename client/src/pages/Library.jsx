import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listBooks, uploadBook, deleteBook, coverUrl } from '../api.js';
import './Library.css';

const STATUS_LABEL = {
  unread: 'Unread',
  reading: 'Reading',
  finished: 'Finished',
};

const FORMAT_LABEL = {
  pdf: 'PDF',
  epub: 'EPUB',
  text: 'Text',
};

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    listBooks()
      .then(setBooks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function handleFileChosen(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const title = file.name.replace(/\.[^.]+$/, '');
      await uploadBook({ file, title });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Remove "${title}" from your library? This deletes the file.`)) return;
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const visibleBooks = filter === 'all' ? books : books.filter((b) => b.status === filter);

  return (
    <div className="library">
      <div className="library-toolbar">
        <div className="filter-tabs">
          {['all', 'unread', 'reading', 'finished'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All books' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub,.txt,.md"
            hidden
            onChange={handleFileChosen}
          />
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '+ Add book'}
          </button>
        </div>
      </div>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <p className="muted">Loading your shelf…</p>
      ) : visibleBooks.length === 0 ? (
        <div className="empty-state">
          <p>
            {books.length === 0
              ? 'Your reading room is empty. Add a PDF, EPUB, or text file to get started.'
              : 'No books match this filter.'}
          </p>
        </div>
      ) : (
        <div className="book-grid">
          {visibleBooks.map((book) => (
            <div className="book-card" key={book.id}>
              <Link to={`/books/${book.id}`} className="book-cover-link">
                {book.cover_filename ? (
                  <img className="book-cover" src={coverUrl(book.id)} alt="" />
                ) : (
                  <div className="book-cover book-cover-placeholder">
                    <span>{FORMAT_LABEL[book.format]}</span>
                  </div>
                )}
              </Link>
              <div className="book-info">
                <Link to={`/books/${book.id}`} className="book-title">
                  {book.title}
                </Link>
                {book.author && <div className="book-author">{book.author}</div>}
                <div className={`status-pill status-${book.status}`}>
                  {STATUS_LABEL[book.status]}
                </div>
              </div>
              <button
                className="book-remove"
                title="Remove book"
                onClick={() => handleDelete(book.id, book.title)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
