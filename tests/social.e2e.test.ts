import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/index.js';
import { ensureUser } from './helpers/seed.js';
import { db } from '../server/db.js';
import { notifications } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

describe('Social notifications E2E', () => {
  let authorToken = '';
  let followerToken = '';

  beforeAll(async () => {
    await ensureUser('social-author-1', 'sa1@example.com', 'sa1');
    await ensureUser('social-follower-1', 'sf1@example.com', 'sf1');
    authorToken = jwt.sign({ id: 'social-author-1', email: 'sa1@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
    followerToken = jwt.sign({ id: 'social-follower-1', email: 'sf1@example.com' }, process.env.SESSION_SECRET || 'test_secret', { expiresIn: '5m', issuer: 'civicos', audience: 'civicos-users' });
  });

  it('follower sees notification on author post; author sees on like/comment', async () => {
    // Follow
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${followerToken}`).send({ followingId: 'social-author-1' });

    // Author posts
    const post = await request(app).post('/api/social/posts').set('Authorization', `Bearer ${authorToken}`).send({ content: 'Hello world' });
    expect([200, 201]).toContain(post.status);
    const postId = post.body?.post?.id;

    // Follower receives notification for new post
    const followerNotifs = await db.select().from(notifications).where(eq(notifications.userId, 'social-follower-1'));
    expect(followerNotifs.some(n => (n.title || '').toLowerCase().includes('new post'))).toBe(true);

    if (postId) {
      // Follower likes/comments
      await request(app).post(`/api/social/posts/${postId}/like`).set('Authorization', `Bearer ${followerToken}`).send({ reaction: '👍' });
      await request(app).post(`/api/social/posts/${postId}/comment`).set('Authorization', `Bearer ${followerToken}`).send({ content: 'nice' });

      // Author receives notifications
      const authorNotifs = await db.select().from(notifications).where(eq(notifications.userId, 'social-author-1'));
      expect(authorNotifs.some(n => (n.title || '').toLowerCase().includes('liked')) || authorNotifs.some(n => (n.title || '').toLowerCase().includes('comment'))).toBe(true);
    }
  });
});


