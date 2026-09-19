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

    const SWIPE_THRESHOLD = 50;
    rendition.hooks.content.register((contents) => {
      const doc = contents.document;
      let touchStartX = null;

      function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].clientX;
      }

      function handleTouchEnd(e) {
        if (touchStartX == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (dx < 0) rendition.next();
        else rendition.prev();
      }

      function handleClick(e) {
        if (e.target.closest?.('a')) return;
        if (doc.getSelection?.().toString()) return;

        const width = contents.window.innerWidth;
        const third = width / 3;
        if (e.clientX < third) rendition.prev();
        else if (e.clientX > third * 2) rendition.next();
      }

      doc.addEventListener('touchstart', handleTouchStart, { passive: true });
      doc.addEventListener('touchend', handleTouchEnd, { passive: true });
      doc.addEventListener('click', handleClick);
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
    <div className="reader-shell">
      {error && <div className="banner-error">{error}</div>}
      <div className="reader-nav">
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
