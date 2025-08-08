import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';

describe('Permissions denial cases (News)', () => {
  let userToken = '';
  beforeAll(async () => {
    await ensureUser('perm-user-1', 'perm1@example.com', 'perm1');
    userToken = jwt.sign({ id: 'perm-user-1', email: 'perm1@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
  });

  it('non-admin user gets 403 for news create', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 't', content: 'c', source: 's', isPublished: true });
    expect([401, 403]).toContain(res.status);
  });
});


