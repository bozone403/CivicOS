import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser, createNotification } from './helpers/seed.js';

describe('Notifications routes', () => {
  const user = { id: 'user-ntf-1', email: 'user1@example.com' };
  let token: string;

  beforeAll(async () => {
    await ensureUser(user.id, user.email, 'user1');
    token = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET || 'test_secret', {
      expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users'
    });
    await createNotification(user.id, 'Welcome', 'Hello from tests');
  });
  it('requires auth to fetch notifications', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('returns notifications, unread count, and supports mark-all-read when authenticated', async () => {
    const headers = { Authorization: `Bearer ${token}` };

    const list = await request(app).get('/api/notifications').set(headers);
    expect(200).toBe(list.status);
    expect(Array.isArray(list.body)).toBe(true);

    const unread = await request(app).get('/api/notifications/unread-count').set(headers);
    expect(200).toBe(unread.status);
    expect(unread.body).toHaveProperty('unread');

    const markAll = await request(app).patch('/api/notifications/read-all').set(headers);
    expect(200).toBe(markAll.status);
  });
});


