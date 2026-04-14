import request from 'supertest';
import { buildApp, seedTestDb, cleanTestDb, SARAH_ID } from './setup';

function localDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

const app = buildApp();

let customerToken: string;
let adminToken: string;

beforeAll(async () => {
  await seedTestDb();

  const customerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sarah@test.com', password: 'Customer1!' });
  customerToken = customerRes.body.token;

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin1234!' });
  adminToken = adminRes.body.token;
});

afterAll(() => { cleanTestDb(); });

describe('GET /api/transactions', () => {
  it('returns only the authenticated customer\'s transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // All returned transactions belong to Sarah
    res.body.forEach((tx: { customer_id: string }) => {
      expect(tx.customer_id).toBe(SARAH_ID);
    });
  });

  it('returns transactions sorted newest first', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`);

    const dates: string[] = res.body.map((tx: { transaction_date: string }) => tx.transaction_date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/transactions?status=PENDING')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((tx: { status: string }) => {
      expect(tx.status).toBe('PENDING');
    });
  });

  it('filters by from date — includes transactions on or after the date', async () => {
    const today = localDate(0);
    const res = await request(app)
      .get(`/api/transactions?from=${today}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((tx: { transaction_date: string }) => {
      const txDate = new Date(tx.transaction_date).toLocaleDateString('en-CA');
      expect(txDate >= today).toBe(true);
    });
  });

  it('filters by to date — excludes transactions after the date', async () => {
    const yesterday = localDate(-1);
    const res = await request(app)
      .get(`/api/transactions?to=${yesterday}`)
      .set('Authorization', `Bearer ${customerToken}`);

    // All seed fixtures are from today, so none should appear
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/transactions', () => {
  it('creates a PENDING transaction for a customer', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ merchant: 'Starbucks', amount: 7.50 });

    expect(res.status).toBe(201);
    expect(res.body.merchant).toBe('Starbucks');
    expect(res.body.amount).toBe(7.50);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.customer_id).toBe(SARAH_ID);
    // transaction_date must be a full UTC ISO datetime, not a date-only string
    expect(res.body.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/);
  });

  it('returns 403 when an admin tries to create a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ merchant: 'Test', amount: 10 });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Only customers can create transactions');
  });

  it('returns 400 when merchant is missing', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ amount: 10 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is zero', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ merchant: 'Test', amount: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ merchant: 'Test', amount: -5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is not a number', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ merchant: 'Test', amount: 'abc' });

    expect(res.status).toBe(400);
  });
});
