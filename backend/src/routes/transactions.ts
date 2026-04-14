import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '../store';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/transactions — customer: own transactions with optional filters
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const { status, from, to } = req.query as Record<string, string>;
  const db = readDb();

  let txs = db.transactions.filter((t) => t.customer_id === req.user!.sub);

  if (status) txs = txs.filter((t) => t.status === status);
  if (from) txs = txs.filter((t) => t.transaction_date >= from);
  if (to) txs = txs.filter((t) => t.transaction_date <= to);

  txs.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  res.json(txs);
});

// POST /api/transactions — customer: create a new PENDING transaction
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  if (req.user!.role !== 'customer') {
    res.status(403).json({ error: 'Only customers can create transactions' });
    return;
  }

  const { merchant, amount } = req.body as { merchant: string; amount: number };

  if (!merchant || amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: 'merchant and a positive amount are required' });
    return;
  }

  const db = readDb();
  const now = new Date().toISOString();

  const tx = {
    id: uuidv4(),
    customer_id: req.user!.sub,
    merchant,
    amount: Number(amount),
    status: 'PENDING' as const,
    transaction_date: now.split('T')[0],
    created_at: now,
    updated_at: now,
  };

  db.transactions.push(tx);
  writeDb(db);

  res.status(201).json(tx);
});

export default router;
