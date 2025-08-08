import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';
import { db } from '../server/db.js';
import { notifications, identityVerifications } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

describe('Identity E2E', () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicos.ca';
  const user = { id: 'user-ident-1', email: 'ident1@example.com' };
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    await ensureUser('admin-1', adminEmail, 'admin');
    await ensureUser(user.id, user.email, 'ident1');
    adminToken = jwt.sign({ id: 'admin-1', email: adminEmail }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
    userToken = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
  });

  it('user submits verification, admin approves, user receives notification', async () => {
    const submit = await request(app)
      .post('/api/identity/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: user.email, termsAgreed: true });
    expect([201, 200]).toContain(submit.status);

    const verificationId = submit.body?.verification?.id;
    expect(verificationId).toBeTruthy();

    const approve = await request(app)
      .post(`/api/admin/identity-verifications/${verificationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(approve.status).toBe(200);

    const notifs = await db.select().from(notifications).where(eq(notifications.userId, user.id));
    expect(notifs.some(n => (n.title || '').toLowerCase().includes('approved'))).toBe(true);

    // cleanup: mark verification approved exists
    const rec = await db.select().from(identityVerifications).where(eq(identityVerifications.id, verificationId)).limit(1);
    expect(rec.length).toBe(1);
  });
});


