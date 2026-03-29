import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';

const PORT = process.env.PORT || 4000;
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admission_crm';

connectDb(uri)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  });
