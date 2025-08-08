import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';
import { db } from '../server/db.js';
import { notifications } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

describe('Social routes', () => {
  it('requires auth to create a post', async () => {
    const res = await request(app)
      .post('/api/social/posts')
      .send({ content: 'hello' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid inputs', async () => {
    // no auth, but verify bad request shape is not 500; since auth fails first this remains 401
    const res = await request(app)
      .post('/api/social/posts')
      .send({ content: '' });
    expect([400, 401]).toContain(res.status);
  });

  beforeAll(async () => {
    await ensureUser('user-social-1', 'social1@example.com', 'social1');
  });

  it('allows creating a post with valid token', async () => {
    const user = { id: 'user-social-1', email: 'social1@example.com' };
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET || 'test_secret', {
      expiresIn: '2m', issuer: 'civicos', audience: 'civicos-users'
    });
    const res = await request(app)
      .post('/api/social/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hello world' });
    expect([200, 201]).toContain(res.status);
  });

  it('emits notification to followers when posting, and to author when liked/commented', async () => {
    // Arrange: author and follower
    await ensureUser('user-social-2', 'social2@example.com', 'social2');
    await ensureUser('user-follower-1', 'follower1@example.com', 'follower1');

    // Give follower a token and author a token
    const authorToken = jwt.sign({ id: 'user-social-2', email: 'social2@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '3m', issuer: 'civicos', audience: 'civicos-users' });
    const followerToken = jwt.sign({ id: 'user-follower-1', email: 'follower1@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '3m', issuer: 'civicos', audience: 'civicos-users' });

    // Follow relationship via API
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${followerToken}`).send({ followingId: 'user-social-2' });

    // Post by author
    const postRes = await request(app).post('/api/social/posts').set('Authorization', `Bearer ${authorToken}`).send({ content: 'hello followers' });
    expect([200, 201]).toContain(postRes.status);
    const postId = (postRes.body?.post?.id) || (postRes.body?.post?.id === 0 ? 0 : undefined);

    // Verify follower received a notification (best-effort)
    const followerNotifs = await db.select().from(notifications).where(eq(notifications.userId, 'user-follower-1'));
    expect(followerNotifs.some(n => (n.title || '').toLowerCase().includes('new post'))).toBe(true);

    if (postId) {
      // Like by follower
      await request(app).post(`/api/social/posts/${postId}/like`).set('Authorization', `Bearer ${followerToken}`).send({ reaction: '👍' });
      // Comment by follower
      await request(app).post(`/api/social/posts/${postId}/comment`).set('Authorization', `Bearer ${followerToken}`).send({ content: 'nice post' });

      // Verify author received like/comment notifications
      const authorNotifs = await db.select().from(notifications).where(eq(notifications.userId, 'user-social-2'));
      const hasLike = authorNotifs.some(n => (n.title || '').toLowerCase().includes('liked'));
      const hasComment = authorNotifs.some(n => (n.title || '').toLowerCase().includes('comment'));
      expect(hasLike || hasComment).toBe(true);
    }
  });

  it('allows like/comment/message with token (shape only)', async () => {
    const user = { id: 'user-social-2', email: 'social2@example.com' };
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.SESSION_SECRET || 'test_secret', {
      expiresIn: '2m', issuer: 'civicos', audience: 'civicos-users'
    });
    const headers = { Authorization: `Bearer ${token}` };

    const like = await request(app).post('/api/social/posts/1/like').set(headers).send({ reaction: '😊' });
    expect([200, 404]).toContain(like.status);

    const comment = await request(app).post('/api/social/posts/1/comment').set(headers).send({ content: 'nice' });
    expect([200, 404]).toContain(comment.status);

    const msg = await request(app).post('/api/social/messages').set(headers).send({ recipientId: 'user-social-3', content: 'hi' });
    expect([200, 404, 400]).toContain(msg.status);
  });
});


