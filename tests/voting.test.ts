import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser, ensureBill } from './helpers/seed.js';

describe('Voting routes', () => {
  it('requires auth to cast vote', async () => {
    const res = await request(app)
      .post('/api/voting/vote')
      .send({ billId: 1, vote: 'yes' });
    expect(res.status).toBe(401);
  });

  let billId = 1;
  beforeAll(async () => {
    await ensureUser('user-vote-1', 'vote1@example.com', 'vote1');
    billId = await ensureBill('Test Bill For Voting');
  });

  it('allows casting a vote with token (expects 201 if bill exists)', async () => {
    const user = { id: 'user-vote-1', email: 'vote1@example.com' };
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET || 'test_secret', {
      expiresIn: '2m', issuer: 'civicos', audience: 'civicos-users'
    });
    const res = await request(app)
      .post('/api/voting/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ billId, vote: 'yes' });
    expect([201, 409]).toContain(res.status);
  });
});


