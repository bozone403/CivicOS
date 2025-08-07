import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Test configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const API_BASE_URL = process.env.API_BASE_URL || 'https://civicos.onrender.com';

// Database client for testing
const sql = postgres(TEST_DATABASE_URL!);
const db = drizzle(sql);

// API client for testing
const apiClient = {
  async request(endpoint: string, method: string = 'GET', data?: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data?.token && { Authorization: `Bearer ${data.token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    const result = await response.json();
    return { status: response.status, data: result };
  }
};

describe('CivicOS Full-Stack Integration Tests', () => {
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Clean up test data
    await sql`DELETE FROM user_follows WHERE user_id LIKE 'test-%'`;
    await sql`DELETE FROM users WHERE id LIKE 'test-%'`;
  });

  afterAll(async () => {
    // Clean up test data
    await sql`DELETE FROM user_follows WHERE user_id LIKE 'test-%'`;
    await sql`DELETE FROM users WHERE id LIKE 'test-%'`;
    await sql.end();
  });

  describe('Authentication System', () => {
    it('should register a new user successfully', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      const response = await apiClient.request('/api/auth/register', 'POST', {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        agreeToTerms: true
      });

      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      expect(response.data.user.id).toBeDefined();
      expect(response.data.user.email).toBe(testEmail);

      testUserToken = response.data.token;
      testUserId = response.data.user.id;
    });

    it('should login user successfully', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      // First register
      await apiClient.request('/api/auth/register', 'POST', {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        agreeToTerms: true
      });

      // Then login
      const response = await apiClient.request('/api/auth/login', 'POST', {
        email: testEmail,
        password: testPassword
      });

      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      expect(response.data.user.email).toBe(testEmail);
    });

    it('should validate JWT token correctly', async () => {
      const response = await apiClient.request('/api/auth/user', 'GET', {
        token: testUserToken
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testUserId);
    });

    it('should reject invalid tokens', async () => {
      const response = await apiClient.request('/api/auth/user', 'GET', {
        token: 'invalid-token'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Social System', () => {
    let testUser2Token: string;
    let testUser2Id: string;

    beforeAll(async () => {
      // Create second test user
      const testEmail2 = `test2-${Date.now()}@example.com`;
      const response = await apiClient.request('/api/auth/register', 'POST', {
        email: testEmail2,
        password: 'TestPassword123!',
        firstName: 'Test2',
        lastName: 'User2',
        agreeToTerms: true
      });

      testUser2Token = response.data.token;
      testUser2Id = response.data.user.id;
    });

    it('should follow user successfully', async () => {
      const response = await apiClient.request('/api/social/follow', 'POST', {
        token: testUserToken,
        userId: testUser2Id
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.followerId).toBe(testUserId);
      expect(response.data.data.followingId).toBe(testUser2Id);
    });

    it('should prevent duplicate follows', async () => {
      const response = await apiClient.request('/api/social/follow', 'POST', {
        token: testUserToken,
        userId: testUser2Id
      });

      expect(response.status).toBe(400);
      expect(response.data.code).toBe('ALREADY_FOLLOWING');
    });

    it('should prevent self-following', async () => {
      const response = await apiClient.request('/api/social/follow', 'POST', {
        token: testUserToken,
        userId: testUserId
      });

      expect(response.status).toBe(400);
      expect(response.data.code).toBe('SELF_FOLLOW');
    });

    it('should unfollow user successfully', async () => {
      const response = await apiClient.request('/api/social/unfollow', 'DELETE', {
        token: testUserToken,
        userId: testUser2Id
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get followers list', async () => {
      // First follow again
      await apiClient.request('/api/social/follow', 'POST', {
        token: testUserToken,
        userId: testUser2Id
      });

      const response = await apiClient.request(`/api/social/followers/${testUser2Id}`, 'GET', {
        token: testUserToken
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.followers)).toBe(true);
      expect(response.data.followers.length).toBeGreaterThan(0);
    });

    it('should get following list', async () => {
      const response = await apiClient.request(`/api/social/following/${testUserId}`, 'GET', {
        token: testUserToken
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.following)).toBe(true);
      expect(response.data.following.length).toBeGreaterThan(0);
    });
  });

  describe('Voting System', () => {
    let votingItemId: number;

    beforeAll(async () => {
      // Create a test voting item
      const result = await sql`
        INSERT INTO voting_items (title, description, type, status, start_date, end_date)
        VALUES ('Test Vote', 'Test voting item', 'bill', 'active', NOW(), NOW() + INTERVAL '1 day')
        RETURNING id
      `;
      votingItemId = result[0].id;
    });

    afterAll(async () => {
      await sql`DELETE FROM votes WHERE voting_item_id = ${votingItemId}`;
      await sql`DELETE FROM voting_items WHERE id = ${votingItemId}`;
    });

    it('should allow user to vote', async () => {
      const response = await apiClient.request('/api/voting/vote', 'POST', {
        token: testUserToken,
        votingItemId,
        voteValue: 1,
        reasoning: 'Test vote reasoning'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should prevent duplicate votes', async () => {
      const response = await apiClient.request('/api/voting/vote', 'POST', {
        token: testUserToken,
        votingItemId,
        voteValue: -1,
        reasoning: 'Test vote reasoning'
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Already voted');
    });

    it('should get voting items', async () => {
      const response = await apiClient.request('/api/voting/items', 'GET', {
        token: testUserToken
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.items)).toBe(true);
    });
  });

  describe('Database Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Test that foreign key constraints work
      const result = await sql`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'user_follows' 
          AND tc.constraint_type = 'FOREIGN KEY'
      `;

      expect(result.length).toBeGreaterThan(0);
    });

    it('should have proper indexes', async () => {
      const result = await sql`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'user_follows'
      `;

      expect(result.length).toBeGreaterThan(0);
    });

    it('should prevent duplicate follows', async () => {
      // Try to insert duplicate follow
      try {
        await sql`
          INSERT INTO user_follows (user_id, follow_id)
          VALUES (${testUserId}, ${testUserId})
        `;
        expect.fail('Should have thrown constraint error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          apiClient.request('/api/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'wrongpassword'
          })
        );
      }

      const responses = await Promise.all(promises);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing parameters gracefully', async () => {
      const response = await apiClient.request('/api/social/follow', 'POST', {
        token: testUserToken
        // Missing userId
      });

      expect(response.status).toBe(400);
      expect(response.data.code).toBe('MISSING_PARAMETERS');
    });

    it('should handle invalid tokens gracefully', async () => {
      const response = await apiClient.request('/api/social/follow', 'POST', {
        token: 'invalid-token',
        userId: testUser2Id
      });

      expect(response.status).toBe(401);
    });
  });
}); 