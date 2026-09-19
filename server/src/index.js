import express from 'express';
import cors from 'cors';
import './db.js';
import { router as booksRouter } from './routes/books.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/books', booksRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Reading Room server listening on http://localhost:${PORT}`);
});
