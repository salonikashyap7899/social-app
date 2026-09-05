import 'dotenv/config';
import app from './app.js';
import { connectDB } from './db.js';

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET - copy .env.example to .env and fill it in.');
  process.exit(1);
}

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
