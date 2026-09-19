const BASE = '/api/books';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function listBooks() {
  return fetch(BASE).then(handle);
}

export function getBook(id) {
  return fetch(`${BASE}/${id}`).then(handle);
}

export function uploadBook({ file, title, author }) {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);
  if (author) form.append('author', author);
  return fetch(BASE, { method: 'POST', body: form }).then(handle);
}

export function uploadCover(id, file) {
  const form = new FormData();
  form.append('cover', file);
  return fetch(`${BASE}/${id}/cover`, { method: 'POST', body: form }).then(handle);
}

export function updateBook(id, fields) {
  return fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  }).then(handle);
}

export function deleteBook(id) {
  return fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handle);
}

export function fileUrl(id) {
  return `${BASE}/${id}/file`;
}

export function coverUrl(id) {
  return `${BASE}/${id}/cover`;
}
