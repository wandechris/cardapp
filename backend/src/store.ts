import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  merchant: string;
  amount: number;
  status: 'PENDING' | 'POSTED' | 'REVERSED';
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface Db {
  users: User[];
  transactions: Transaction[];
}

export function readDb(): Db {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], transactions: [] };
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw) as Db;
  } catch {
    throw new Error(`Database file is corrupted and cannot be parsed: ${DB_PATH}`);
  }
}

export function writeDb(data: Db): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
