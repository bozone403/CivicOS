import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';
import { db } from '../server/db.js';
import { notifications } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

describe('Notifications unread count transitions', () => {
  const user = { id: 'user-notif-ct-1', email: 'notifct1@example.com' };
  let token = '';

  beforeAll(async () => {
    await ensureUser(user.id, user.email, 'notifct1');
    token = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
  });

  it('increments unread on new notification and drops to zero after mark-all-read', async () => {
    // Create two notifications directly
    await db.insert(notifications).values({ userId: user.id, type: 'test', title: 'A', message: 'a' });
    await db.insert(notifications).values({ userId: user.id, type: 'test', title: 'B', message: 'b' });

    const unread1 = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
    expect(unread1.status).toBe(200);
    expect(unread1.body.unread).toBeGreaterThanOrEqual(2);

    const markAll = await request(app).patch('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect(markAll.status).toBe(200);

    const unread2 = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
    expect(unread2.status).toBe(200);
    expect(unread2.body.unread).toBe(0);
  });
});


