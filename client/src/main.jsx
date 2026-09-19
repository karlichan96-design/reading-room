import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Library from './pages/Library.jsx';
import Reader from './pages/Reader.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Library />} />
          <Route path="books/:id" element={<Reader />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
