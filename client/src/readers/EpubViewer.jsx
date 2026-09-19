import { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { fileUrl } from '../api.js';

export default function EpubViewer({ book, onProgress }) {
  const containerRef = useRef(null);
  const renditionRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const book_ = ePub(fileUrl(book.id), { openAs: 'epub' });
    const rendition = book_.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'auto',
    });
    renditionRef.current = rendition;

    rendition.display(book.progress || undefined).catch(() => {
      if (!cancelled) setError('Could not open this EPUB file.');
    });

    rendition.on('relocated', (location) => {
      const cfi = location?.start?.cfi;
      if (cfi) onProgress(cfi);
    });

    return () => {
      cancelled = true;
      rendition.destroy();
      book_.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  function goPrev() {
    renditionRef.current?.prev();
  }

  function goNext() {
    renditionRef.current?.next();
  }

  return (
    <div className="epub-shell">
      {error && <div className="banner-error">{error}</div>}
      <div className="epub-nav">
        <button className="btn-secondary" onClick={goPrev}>
          ‹ Prev
        </button>
        <button className="btn-secondary" onClick={goNext}>
          Next ›
        </button>
      </div>
      <div className="epub-container" ref={containerRef} />
    </div>
  );
}
