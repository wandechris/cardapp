import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { writeDb, User, Transaction } from './store';

const SALT_ROUNDS = 10;

// Sets the date/time in local time then converts to UTC ISO string.
// Storing UTC means the browser can convert to any local timezone for display.
function utcDatetime(daysBack: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function seed() {
  const adminId = uuidv4();
  const sarahId = uuidv4();
  const marcusId = uuidv4();
  const priyaId = uuidv4();

  const users: User[] = [
    {
      id: adminId,
      email: 'admin@cardapp.com',
      password_hash: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      full_name: 'System Admin',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
    {
      id: sarahId,
      email: 'sarah@example.com',
      password_hash: await bcrypt.hash('Customer1!', SALT_ROUNDS),
      full_name: 'Sarah Chen',
      role: 'customer',
      created_at: new Date().toISOString(),
    },
    {
      id: marcusId,
      email: 'marcus@example.com',
      password_hash: await bcrypt.hash('Customer1!', SALT_ROUNDS),
      full_name: 'Marcus Williams',
      role: 'customer',
      created_at: new Date().toISOString(),
    },
    {
      id: priyaId,
      email: 'priya@example.com',
      password_hash: await bcrypt.hash('Customer1!', SALT_ROUNDS),
      full_name: 'Priya Patel',
      role: 'customer',
      created_at: new Date().toISOString(),
    },
  ];

  const transactions: Transaction[] = [
    // Sarah's transactions
    { id: uuidv4(), customer_id: sarahId, merchant: 'Amazon',      amount: 49.99,  status: 'POSTED',   transaction_date: utcDatetime(2, 14, 32), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: sarahId, merchant: 'Starbucks',   amount: 7.50,   status: 'POSTED',   transaction_date: utcDatetime(5,  8, 15), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: sarahId, merchant: 'Netflix',     amount: 15.99,  status: 'PENDING',  transaction_date: utcDatetime(1, 20,  0), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: sarahId, merchant: 'Uber',        amount: 22.40,  status: 'REVERSED', transaction_date: utcDatetime(10,22, 47), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: sarahId, merchant: 'Apple Store', amount: 129.00, status: 'PENDING',  transaction_date: utcDatetime(3, 11, 20), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // Marcus's transactions
    { id: uuidv4(), customer_id: marcusId, merchant: 'Walmart',     amount: 83.20,  status: 'POSTED',   transaction_date: utcDatetime(4, 16, 55), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: marcusId, merchant: 'Shell Gas',   amount: 61.00,  status: 'POSTED',   transaction_date: utcDatetime(7,  7, 40), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: marcusId, merchant: 'Spotify',     amount: 9.99,   status: 'PENDING',  transaction_date: utcDatetime(1, 12,  0), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: marcusId, merchant: 'Air Canada',  amount: 420.00, status: 'REVERSED', transaction_date: utcDatetime(15, 9, 30), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: marcusId, merchant: 'Tim Hortons', amount: 4.75,   status: 'POSTED',   transaction_date: utcDatetime(6,  8,  5), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // Priya's transactions
    { id: uuidv4(), customer_id: priyaId, merchant: 'LCBO',      amount: 38.50,  status: 'POSTED',   transaction_date: utcDatetime(3, 18, 10), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: priyaId, merchant: 'Best Buy',  amount: 299.99, status: 'PENDING',  transaction_date: utcDatetime(1, 13, 45), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: priyaId, merchant: 'Uber Eats', amount: 34.20,  status: 'POSTED',   transaction_date: utcDatetime(8, 19, 22), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: priyaId, merchant: 'Amazon',    amount: 19.99,  status: 'REVERSED', transaction_date: utcDatetime(20,10, 58), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), customer_id: priyaId, merchant: 'Shopify',   amount: 75.00,  status: 'PENDING',  transaction_date: utcDatetime(2, 15, 33), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  writeDb({ users, transactions });
  console.log(`Seeded ${users.length} users and ${transactions.length} transactions.`);
}

seed().catch(console.error);
