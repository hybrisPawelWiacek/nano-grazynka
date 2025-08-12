import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Container } from '../../presentation/api/container';
import authRoutes from '../../presentation/api/routes/auth';
import paymentsRoutes from '../../presentation/api/routes/payments';
import { voiceNoteRoutes } from '../../presentation/api/routes/voiceNotes';
import multipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import fs from 'fs';
import path from 'path';

describe('API Integration Tests', () => {
  let fastify: FastifyInstance;
  let prisma: PrismaClient;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Initialize Fastify with test configuration
    fastify = Fastify({ logger: false });
    await fastify.register(cookie);
    await fastify.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
      },
    });

    // Initialize Prisma and clean database
    prisma = new PrismaClient();
    await prisma.$connect();

    // Register routes
    await fastify.register(authRoutes);
    await fastify.register(paymentsRoutes);
    await fastify.register(voiceNoteRoutes);

    // Initialize container
    Container.getInstance();
  });

  afterAll(async () => {
    await fastify.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.voiceNote.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Authentication Routes', () => {
    it('should register a new user', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.tier).toBe('free');
      expect(data.token).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'weak'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      // First register
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });

      // Then login
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
      
      // Save for other tests
      authToken = data.token;
      userId = data.user.id;
    });

    it('should reject login with invalid credentials', async () => {
      // Register user
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });

      // Try login with wrong password
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword!'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should get current user with valid token', async () => {
      // Register and login
      const registerResponse = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });
      const { token } = JSON.parse(registerResponse.payload);

      // Get current user
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.email).toBe('test@example.com');
    });

    it('should logout successfully', async () => {
      // Register and login
      const registerResponse = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });
      const { token } = JSON.parse(registerResponse.payload);

      // Logout
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      // Try to access protected route after logout
      const meResponse = await fastify.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Session should be invalidated
      expect(meResponse.statusCode).toBe(401);
    });
  });

  describe('Payment Routes', () => {
    let token: string;

    beforeEach(async () => {
      // Create a user for payment tests
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'payment@example.com',
          password: 'Password123!'
        }
      });
      const data = JSON.parse(response.payload);
      token = data.token;
    });

    it('should get available prices', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/payments/prices'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.prices).toBeDefined();
      expect(Array.isArray(data.prices)).toBe(true);
      expect(data.prices.length).toBeGreaterThan(0);
    });

    it('should create checkout session', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/payments/create-checkout-session',
        headers: {
          Authorization: `Bearer ${token}`
        },
        payload: {
          priceId: 'price_mock_pro_monthly'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.sessionId).toBeDefined();
      expect(data.checkoutUrl).toBeDefined();
    });

    it('should get subscription status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/payments/subscription',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.hasSubscription).toBe(false);
      expect(data.tier).toBe('free');
    });

    it('should upgrade tier directly (for testing)', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/payments/upgrade-tier',
        headers: {
          Authorization: `Bearer ${token}`
        },
        payload: {
          tier: 'pro'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.tier).toBe('pro');

      // Verify tier was updated
      const userResponse = await fastify.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const userData = JSON.parse(userResponse.payload);
      expect(userData.tier).toBe('pro');
    });

    it('should handle webhook simulation', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/payments/webhook',
        payload: {
          sessionId: 'cs_mock_123',
          customerId: 'cus_mock_123',
          priceId: 'price_mock_pro_monthly'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.subscriptionId).toBeDefined();
    });
  });

  describe('Voice Note Routes with Rate Limiting', () => {
    let token: string;
    let voiceNoteId: string;

    beforeEach(async () => {
      // Create a user
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'voice@example.com',
          password: 'Password123!'
        }
      });
      const data = JSON.parse(response.payload);
      token = data.token;
    });

    it('should enforce rate limits for free tier', async () => {
      // Free tier has 10 requests per minute limit
      const requests = [];
      
      // Make 11 requests
      for (let i = 0; i < 11; i++) {
        requests.push(
          fastify.inject({
            method: 'GET',
            url: '/api/voice-notes',
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // First 10 should succeed
      for (let i = 0; i < 10; i++) {
        expect(responses[i].statusCode).toBe(200);
      }
      
      // 11th should be rate limited
      expect(responses[10].statusCode).toBe(429);
      const errorData = JSON.parse(responses[10].payload);
      expect(errorData.error).toBe('Too Many Requests');
    });

    it('should enforce usage limits for free tier', async () => {
      // Create a test audio file
      const audioBuffer = Buffer.from('fake audio data');
      
      // Free tier has 5 transcriptions per month
      // First set user to have 4 credits already used
      const user = await prisma.user.findUnique({
        where: { email: 'voice@example.com' }
      });
      await prisma.user.update({
        where: { id: user!.id },
        data: { creditsUsed: 4 }
      });

      // This upload should succeed (5th credit)
      const form1 = new FormData();
      form1.append('file', new Blob([audioBuffer], { type: 'audio/mp4' }), 'test.m4a');
      
      const response1 = await fastify.inject({
        method: 'POST',
        url: '/api/voice-notes',
        headers: {
          Authorization: `Bearer ${token}`,
          ...form1.getHeaders()
        },
        payload: form1
      });

      expect(response1.statusCode).toBe(201);

      // This upload should fail (would be 6th credit)
      const form2 = new FormData();
      form2.append('file', new Blob([audioBuffer], { type: 'audio/mp4' }), 'test2.m4a');
      
      const response2 = await fastify.inject({
        method: 'POST',
        url: '/api/voice-notes',
        headers: {
          Authorization: `Bearer ${token}`,
          ...form2.getHeaders()
        },
        payload: form2
      });

      expect(response2.statusCode).toBe(403);
      const errorData = JSON.parse(response2.payload);
      expect(errorData.message).toContain('usage limit reached');
    });

    it('should allow more requests for pro tier', async () => {
      // Upgrade to pro
      await fastify.inject({
        method: 'POST',
        url: '/api/payments/upgrade-tier',
        headers: {
          Authorization: `Bearer ${token}`
        },
        payload: {
          tier: 'pro'
        }
      });

      // Pro tier has 60 requests per minute
      const requests = [];
      
      // Make 15 requests (more than free tier limit)
      for (let i = 0; i < 15; i++) {
        requests.push(
          fastify.inject({
            method: 'GET',
            url: '/api/voice-notes',
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // All should succeed for pro tier
      for (let i = 0; i < 15; i++) {
        expect(responses[i].statusCode).toBe(200);
      }
    });

    it('should list voice notes for authenticated user', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voice-notes',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.voiceNotes).toBeDefined();
      expect(Array.isArray(data.voiceNotes)).toBe(true);
    });

    it('should reject requests without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voice-notes'
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Credit Reset Functionality', () => {
    it('should reset credits after billing period', async () => {
      // Create user
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'reset@example.com',
          password: 'Password123!'
        }
      });
      const { token } = JSON.parse(response.payload);

      // Set credits to max and reset date to past
      const user = await prisma.user.findUnique({
        where: { email: 'reset@example.com' }
      });
      await prisma.user.update({
        where: { id: user!.id },
        data: {
          creditsUsed: 5,
          creditsResetDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
        }
      });

      // Make a request that should trigger credit reset
      const meResponse = await fastify.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      expect(meResponse.statusCode).toBe(200);
      const userData = JSON.parse(meResponse.payload);
      
      // Credits should be available again after reset
      expect(userData.creditsUsed).toBe(0);
    });
  });
});

// FormData helper for multipart requests
class FormData {
  private boundary = `----boundary${Date.now()}`;
  private parts: any[] = [];

  append(name: string, value: any, filename?: string) {
    this.parts.push({ name, value, filename });
  }

  getHeaders() {
    return {
      'content-type': `multipart/form-data; boundary=${this.boundary}`
    };
  }

  toString() {
    let body = '';
    for (const part of this.parts) {
      body += `--${this.boundary}\r\n`;
      if (part.filename) {
        body += `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n`;
        body += `Content-Type: ${part.value.type || 'application/octet-stream'}\r\n\r\n`;
        body += part.value.toString();
      } else {
        body += `Content-Disposition: form-data; name="${part.name}"\r\n\r\n`;
        body += part.value;
      }
      body += '\r\n';
    }
    body += `--${this.boundary}--\r\n`;
    return body;
  }
}