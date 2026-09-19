import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { fileUrl } from '../api.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfViewer({ book, onProgress }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pageNum, setPageNum] = useState(() => parseInt(book.progress, 10) || 1);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    pdfjsLib
      .getDocument({ url: fileUrl(book.id) })
      .promise.then((pdf) => {
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNum((p) => Math.min(Math.max(p, 1), pdf.numPages));
      })
      .catch(() => {
        if (!cancelled) setError('Could not open this PDF file.');
      });
    return () => {
      cancelled = true;
      pdfRef.current?.destroy();
      pdfRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !container || !canvas) return;

    renderTaskRef.current?.cancel();

    const page = await pdf.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = (container.clientWidth - 32) / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const task = page.render({ canvasContext: context, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') throw err;
    }
  }, [pageNum]);

  useEffect(() => {
    if (numPages) renderPage();
  }, [numPages, renderPage]);

  useEffect(() => {
    if (!numPages) return;
    const onResize = () => renderPage();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [numPages, renderPage]);

  useEffect(() => {
    if (numPages) onProgress(String(pageNum));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum]);

  function goPrev() {
    setPageNum((p) => Math.max(1, p - 1));
  }

  function goNext() {
    setPageNum((p) => Math.min(numPages || p, p + 1));
  }

  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div className="epub-shell">
      <div className="epub-nav">
        <button className="btn-secondary" onClick={goPrev} disabled={pageNum <= 1}>
          ‹ Prev
        </button>
        <span className="muted">
          {numPages ? `Page ${pageNum} of ${numPages}` : 'Loading…'}
        </span>
        <button className="btn-secondary" onClick={goNext} disabled={!numPages || pageNum >= numPages}>
          Next ›
        </button>
      </div>
      <div className="pdf-container" ref={containerRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
