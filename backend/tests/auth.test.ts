import request from 'supertest';
import { buildApp, seedTestDb, cleanTestDb } from './setup';

const app = buildApp();

beforeAll(async () => { await seedTestDb(); });
afterAll(() => { cleanTestDb(); });

describe('POST /api/auth/login', () => {
  it('returns a JWT and user object on valid customer credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@test.com', password: 'Customer1!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('sarah@test.com');
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('returns a JWT with admin role for admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin1234!' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Customer1!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@test.com' });

    expect(res.status).toBe(400);
  });
});
