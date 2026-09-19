import { fileUrl } from '../api.js';

export default function PdfViewer({ book }) {
  return (
    <iframe
      className="pdf-frame"
      title={book.title}
      src={fileUrl(book.id)}
    />
  );
}
