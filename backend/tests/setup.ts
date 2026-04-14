import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import authRouter from '../src/routes/auth';
import transactionsRouter from '../src/routes/transactions';
import adminRouter from '../src/routes/admin';

// Use a temp DB file isolated to the test run
export const TEST_DB_PATH = path.join(__dirname, 'test-db.json');

// Patch the store module to use the test DB path before importing routes
jest.mock('../src/store', () => {
  const actual = jest.requireActual('../src/store');
  return {
    ...actual,
    readDb: () => {
      if (!fs.existsSync(TEST_DB_PATH)) return { users: [], transactions: [] };
      return JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf-8'));
    },
    writeDb: (data: unknown) => {
      fs.writeFileSync(TEST_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    },
  };
});

process.env.JWT_SECRET = 'test-secret';

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/admin', adminRouter);
  return app;
}

export const ADMIN_ID = uuidv4();
export const SARAH_ID = uuidv4();
export const MARCUS_ID = uuidv4();
export let POSTED_TX_ID = '';         // used for the successful reverse test (will be mutated)
export let POSTED_TX_ID_2 = '';       // separate fixture for the 403 customer-auth test
export let PENDING_TX_ID = '';
export let REVERSED_TX_ID = '';

function utcDatetime(daysBack: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export async function seedTestDb() {
  const now = new Date().toISOString();

  POSTED_TX_ID = uuidv4();
  POSTED_TX_ID_2 = uuidv4();
  PENDING_TX_ID = uuidv4();
  REVERSED_TX_ID = uuidv4();

  const db = {
    users: [
      {
        id: ADMIN_ID,
        email: 'admin@test.com',
        password_hash: await bcrypt.hash('Admin1234!', 1),
        full_name: 'Test Admin',
        role: 'admin',
        created_at: now,
      },
      {
        id: SARAH_ID,
        email: 'sarah@test.com',
        password_hash: await bcrypt.hash('Customer1!', 1),
        full_name: 'Sarah Test',
        role: 'customer',
        created_at: now,
      },
      {
        id: MARCUS_ID,
        email: 'marcus@test.com',
        password_hash: await bcrypt.hash('Customer1!', 1),
        full_name: 'Marcus Test',
        role: 'customer',
        created_at: now,
      },
    ],
    transactions: [
      {
        id: POSTED_TX_ID,
        customer_id: SARAH_ID,
        merchant: 'Amazon',
        amount: 49.99,
        status: 'POSTED',
        transaction_date: utcDatetime(0, 10, 0),
        created_at: now,
        updated_at: now,
      },
      {
        id: PENDING_TX_ID,
        customer_id: SARAH_ID,
        merchant: 'Netflix',
        amount: 15.99,
        status: 'PENDING',
        transaction_date: utcDatetime(0, 10, 0),
        created_at: now,
        updated_at: now,
      },
      {
        id: REVERSED_TX_ID,
        customer_id: SARAH_ID,
        merchant: 'Uber',
        amount: 22.40,
        status: 'REVERSED',
        transaction_date: utcDatetime(0, 10, 0),
        created_at: now,
        updated_at: now,
      },
      {
        id: POSTED_TX_ID_2,
        customer_id: SARAH_ID,
        merchant: 'Apple Store',
        amount: 99.99,
        status: 'POSTED',
        transaction_date: utcDatetime(0, 10, 0),
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: MARCUS_ID,
        merchant: 'Walmart',
        amount: 83.20,
        status: 'POSTED',
        transaction_date: utcDatetime(0, 10, 0),
        created_at: now,
        updated_at: now,
      },
    ],
  };

  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function cleanTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
}
