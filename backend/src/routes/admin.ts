import { Router, Response } from 'express';
import { readDb, writeDb } from '../store';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth + admin guard to all routes in this router
router.use(authenticate, requireAdmin);

// GET /api/admin/transactions — all transactions with optional filters
router.get('/transactions', (req: AuthRequest, res: Response): void => {
  const { status, customer_id, from, to } = req.query as Record<string, string>;
  const db = readDb();

  let txs = [...db.transactions];

  if (status) txs = txs.filter((t) => t.status === status);
  if (customer_id) txs = txs.filter((t) => t.customer_id === customer_id);
  if (from) txs = txs.filter((t) => t.transaction_date >= from);
  if (to) txs = txs.filter((t) => t.transaction_date <= to);

  txs.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const result = txs.map((t) => {
    const customer = db.users.find((u) => u.id === t.customer_id);
    return { ...t, customer_name: customer?.full_name ?? 'Unknown' };
  });

  res.json(result);
});

// PATCH /api/admin/transactions/:id/reverse — reverse a POSTED transaction
router.patch('/transactions/:id/reverse', (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = readDb();

  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  if (tx.status !== 'POSTED') {
    res.status(422).json({ error: 'Only POSTED transactions can be reversed' });
    return;
  }

  tx.status = 'REVERSED';
  tx.updated_at = new Date().toISOString();
  writeDb(db);

  res.json(tx);
});

// GET /api/admin/users — list all customers
router.get('/users', (_req: AuthRequest, res: Response): void => {
  const db = readDb();
  const customers = db.users
    .filter((u) => u.role === 'customer')
    .map((u) => ({ id: u.id, full_name: u.full_name, email: u.email }));
  res.json(customers);
});

export default router;
