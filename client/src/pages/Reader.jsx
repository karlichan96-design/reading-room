import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBook, updateBook } from '../api.js';
import PdfViewer from '../readers/PdfViewer.jsx';
import EpubViewer from '../readers/EpubViewer.jsx';
import TextViewer from '../readers/TextViewer.jsx';
import './Reader.css';

export default function Reader() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const notesTimer = useRef(null);

  useEffect(() => {
    setBook(null);
    getBook(id)
      .then((b) => {
        setBook(b);
        setNotesDraft(b.notes || '');
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const persist = useCallback(
    async (fields) => {
      try {
        const updated = await updateBook(id, fields);
        setBook(updated);
      } catch (e) {
        setError(e.message);
      }
    },
    [id]
  );

  const handleProgress = useCallback(
    (progress) => {
      persist({ progress, status: 'reading' });
    },
    [persist]
  );

  function handleStatusChange(e) {
    persist({ status: e.target.value });
  }

  function handleRatingClick(value) {
    persist({ rating: book.rating === value ? null : value });
  }

  function handleNotesChange(e) {
    const value = e.target.value;
    setNotesDraft(value);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => persist({ notes: value }), 600);
  }

  if (error) return <div className="banner-error">{error}</div>;
  if (!book) return <p className="muted">Loading…</p>;

  return (
    <div className="reader-layout">
      <aside className="reader-sidebar">
        <Link to="/" className="back-link">
          &larr; Back to shelf
        </Link>
        <h2 className="reader-title">{book.title}</h2>
        {book.author && <p className="reader-author">{book.author}</p>}

        <label className="field-label" htmlFor="status-select">
          Status
        </label>
        <select id="status-select" value={book.status} onChange={handleStatusChange}>
          <option value="unread">Unread</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
        </select>

        <label className="field-label">Rating</label>
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`star ${book.rating >= n ? 'filled' : ''}`}
              onClick={() => handleRatingClick(n)}
              aria-label={`Rate ${n} stars`}
            >
              &#9733;
            </button>
          ))}
        </div>

        <label className="field-label" htmlFor="notes-area">
          Notes
        </label>
        <textarea
          id="notes-area"
          rows={10}
          value={notesDraft}
          onChange={handleNotesChange}
          placeholder="Jot down thoughts as you read…"
        />
      </aside>

      <div className="reader-pane">
        {book.format === 'pdf' && <PdfViewer book={book} onProgress={handleProgress} />}
        {book.format === 'epub' && <EpubViewer book={book} onProgress={handleProgress} />}
        {book.format === 'text' && <TextViewer book={book} />}
      </div>
    </div>
  );
}
