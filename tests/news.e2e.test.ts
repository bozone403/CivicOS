import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';

describe('News RBAC', () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicos.ca';
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    await ensureUser('admin-1', adminEmail, 'admin');
    await ensureUser('news-user-1', 'news1@example.com', 'news1');
    adminToken = jwt.sign({ id: 'admin-1', email: adminEmail }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
    userToken = jwt.sign({ id: 'news-user-1', email: 'news1@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
  });

  it('non-admin cannot create news', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'x', content: 'y', source: 'z', isPublished: true });
    expect([403, 401]).toContain(res.status);
  });

  it('admin can create news', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'admin news', content: 'content', source: 'seed', isPublished: true });
    expect([201, 200]).toContain(res.status);
  });
});


