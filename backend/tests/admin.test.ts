import request from 'supertest';
import {
  buildApp,
  seedTestDb,
  cleanTestDb,
  POSTED_TX_ID,
  POSTED_TX_ID_2,
  PENDING_TX_ID,
  REVERSED_TX_ID,
} from './setup';

function localDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

const app = buildApp();

let adminToken: string;
let customerToken: string;

beforeAll(async () => {
  await seedTestDb();

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin1234!' });
  adminToken = adminRes.body.token;

  const customerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sarah@test.com', password: 'Customer1!' });
  customerToken = customerRes.body.token;
});

afterAll(() => { cleanTestDb(); });

describe('GET /api/admin/transactions', () => {
  it('returns all transactions across all customers', async () => {
    const res = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  it('includes customer_name on each transaction', async () => {
    const res = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`);

    res.body.forEach((tx: { customer_name: string }) => {
      expect(tx.customer_name).toBeDefined();
      expect(typeof tx.customer_name).toBe('string');
    });
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/admin/transactions?status=POSTED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((tx: { status: string }) => {
      expect(tx.status).toBe('POSTED');
    });
  });

  it('filters by customer_id', async () => {
    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const sarah = usersRes.body.find((u: { email: string }) => u.email === 'sarah@test.com');

    const res = await request(app)
      .get(`/api/admin/transactions?customer_id=${sarah.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((tx: { customer_id: string }) => {
      expect(tx.customer_id).toBe(sarah.id);
    });
  });

  it('filters by from date — includes transactions on or after the date', async () => {
    const today = localDate(0);
    const res = await request(app)
      .get(`/api/admin/transactions?from=${today}`)
      .set('Authorization', `Bearer ${adminToken}`);

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
      .get(`/api/admin/transactions?to=${yesterday}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // All seed fixtures are from today, so none should appear
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('returns 403 for a customer', async () => {
    const res = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/transactions');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/admin/transactions/:id/reverse', () => {
  it('reverses a POSTED transaction successfully', async () => {
    const res = await request(app)
      .patch(`/api/admin/transactions/${POSTED_TX_ID}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REVERSED');
    expect(res.body.id).toBe(POSTED_TX_ID);
  });

  it('returns 422 when trying to reverse a PENDING transaction', async () => {
    const res = await request(app)
      .patch(`/api/admin/transactions/${PENDING_TX_ID}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Only POSTED transactions can be reversed');
  });

  it('returns 422 when trying to reverse an already REVERSED transaction', async () => {
    const res = await request(app)
      .patch(`/api/admin/transactions/${REVERSED_TX_ID}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Only POSTED transactions can be reversed');
  });

  it('returns 404 for a non-existent transaction id', async () => {
    const res = await request(app)
      .patch('/api/admin/transactions/non-existent-id/reverse')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for a customer', async () => {
    // Uses POSTED_TX_ID_2 — a fresh POSTED fixture untouched by the reverse test above
    const res = await request(app)
      .patch(`/api/admin/transactions/${POSTED_TX_ID_2}/reverse`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/users', () => {
  it('returns only customers, not admins', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((u: { role?: string; full_name: string }) => {
      expect(u.role).toBeUndefined(); // role not exposed
      expect(u.full_name).toBeDefined();
    });
    // No admin user in the list
    const emails = res.body.map((u: { email: string }) => u.email);
    expect(emails).not.toContain('admin@test.com');
  });

  it('returns 403 for a customer', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});
