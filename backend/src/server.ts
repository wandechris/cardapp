import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import transactionsRouter from './routes/transactions';
import adminRouter from './routes/admin';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
