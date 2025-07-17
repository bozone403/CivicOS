import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import type { Server } from 'http';
import { app } from '../server/index.js';

let server: Server;

beforeAll(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
});
afterAll(() => {
  server.close();
});

describe('Auth Integration', () => {
  let jwtToken = '';
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };

  it('should register a new user', async () => {
    const res = await request(server)
      .post('/api/register')
      .send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should not allow duplicate registration', async () => {
    const res = await request(server)
      .post('/api/register')
      .send(testUser);
    expect(res.status).toBe(409); // Conflict
  });

  it('should login and return a JWT', async () => {
    const res = await request(server)
      .post('/api/login')
      .send(testUser);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    jwtToken = res.body.token;
  });

  it('should not login with wrong password', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ ...testUser, password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  it('should access a protected route with JWT', async () => {
    const res = await request(server)
      .get('/api/profile')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', testUser.email);
  });

  it('should not access protected route without JWT', async () => {
    const res = await request(server)
      .get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('should not access protected route with invalid JWT', async () => {
    const res = await request(server)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('should not access admin route as non-admin', async () => {
    const res = await request(server)
      .get('/api/admin/identity-review')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(403);
  });
}); 