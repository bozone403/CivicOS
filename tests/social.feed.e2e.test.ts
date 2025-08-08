import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';

describe('Feed pagination', () => {
  let token = '';
  beforeAll(async () => {
    await ensureUser('feed-user-1', 'feed1@example.com', 'feed1');
    token = jwt.sign({ id: 'feed-user-1', email: 'feed1@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
  });

  it('returns first page and then second page without errors', async () => {
    const p1 = await request(app).get('/api/social/feed?limit=10&offset=0').set('Authorization', `Bearer ${token}`);
    expect([200]).toContain(p1.status);
    const p2 = await request(app).get('/api/social/feed?limit=10&offset=10').set('Authorization', `Bearer ${token}`);
    expect([200]).toContain(p2.status);
  });
});


