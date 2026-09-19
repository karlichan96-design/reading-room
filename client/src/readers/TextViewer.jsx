import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { fileUrl } from '../api.js';
import { usePageTurn } from '../hooks/usePageTurn.js';

const MARGIN_X = 48;

export default function TextViewer({ book, onProgress }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(() => parseInt(book.progress, 10) || 0);
  const [pageCount, setPageCount] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);

  const viewerRef = useRef(null);
  const pagesRef = useRef(null);

  useEffect(() => {
    setContent(null);
    setError(null);
    fetch(fileUrl(book.id))
      .then((res) => {
        if (!res.ok) throw new Error('Could not load this file.');
        return res.text();
      })
      .then(setContent)
      .catch((e) => setError(e.message));
  }, [book.id]);

  const paginate = useCallback(() => {
    const pages = pagesRef.current;
    if (!pages) return;

    pages.style.columnWidth = '';
    pages.style.columnGap = '';
    const width = pages.clientWidth;
    // Margins live in the column-gap (blank space between pages), not in
    // padding on the clipping container — padding there would let a sliver
    // of the next page peek through before the clip boundary is reached.
    pages.style.columnGap = `${MARGIN_X * 2}px`;
    pages.style.columnWidth = `${width - MARGIN_X * 2}px`;
    const total = Math.max(1, Math.round(pages.scrollWidth / width));
    setPageWidth(width);
    setPageCount(total);
    setPageIndex((p) => Math.min(p, total - 1));
  }, []);

  useLayoutEffect(() => {
    if (content == null) return;
    paginate();
  }, [content, paginate]);

  useEffect(() => {
    if (content == null) return;
    const onResize = () => paginate();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [content, paginate]);

  useEffect(() => {
    if (content != null) onProgress(String(pageIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, content]);

  const goPrev = useCallback(() => setPageIndex((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPageIndex((p) => Math.min(pageCount - 1, p + 1)), [pageCount]);

  usePageTurn(viewerRef, { onPrev: goPrev, onNext: goNext, enabled: content != null });

  if (error) return <div className="banner-error">{error}</div>;

  const isMarkdown = /\.md$/i.test(book.original_filename);

  return (
    <div className="reader-shell">
      <div className="reader-nav">
        <button className="btn-secondary" onClick={goPrev} disabled={pageIndex <= 0}>
          ‹ Prev
        </button>
        <span className="muted">{content == null ? 'Loading…' : `Page ${pageIndex + 1} of ${pageCount}`}</span>
        <button className="btn-secondary" onClick={goNext} disabled={pageIndex >= pageCount - 1}>
          Next ›
        </button>
      </div>
      <div className="text-viewer" ref={viewerRef}>
        <div
          className="text-pages"
          ref={pagesRef}
          style={{ transform: `translateX(-${pageIndex * pageWidth}px)` }}
        >
          {content != null &&
            (isMarkdown ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div className="plain-text">{content}</div>
            ))}
        </div>
      </div>
    </div>
  );
}
