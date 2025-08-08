import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';

// NOTE: These are lightweight route-shape tests; assume JWT is required

describe('Identity routes', () => {
  beforeAll(async () => {
    await ensureUser('admin-1', process.env.ADMIN_EMAIL || 'admin@civicos.ca', 'admin');
  });
  it('rejects unauthenticated submit', async () => {
    const res = await request(app)
      .post('/api/identity/submit')
      .send({ email: 'test@example.com', termsAgreed: true });
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated admin queue', async () => {
    const res = await request(app).get('/api/admin/identity-verifications');
    expect(res.status).toBe(401);
  });

  it('admin can hit identity queue with signed token', async () => {
    const admin = { id: 'admin-1', email: process.env.ADMIN_EMAIL || 'admin@civicos.ca' };
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.SESSION_SECRET || 'test_secret', {
      expiresIn: '2m', issuer: 'civicos', audience: 'civicos-users'
    });
    const res = await request(app)
      .get('/api/admin/identity-verifications')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});


