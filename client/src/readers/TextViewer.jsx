import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { fileUrl } from '../api.js';

export default function TextViewer({ book }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setContent('');
    setError(null);
    fetch(fileUrl(book.id))
      .then((res) => {
        if (!res.ok) throw new Error('Could not load this file.');
        return res.text();
      })
      .then(setContent)
      .catch((e) => setError(e.message));
  }, [book.id]);

  if (error) return <div className="banner-error">{error}</div>;

  const isMarkdown = /\.md$/i.test(book.original_filename);

  return (
    <div className="text-viewer">
      {isMarkdown ? (
        <ReactMarkdown>{content}</ReactMarkdown>
      ) : (
        <pre className="plain-text">{content}</pre>
      )}
    </div>
  );
}
