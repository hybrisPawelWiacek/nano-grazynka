import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

describe('E2E User Flow Tests', () => {
  let browser: Browser;
  let page: Page;
  let prisma: PrismaClient;
  let backendProcess: ChildProcess;
  let frontendProcess: ChildProcess;
  
  const FRONTEND_URL = 'http://localhost:3100';
  const BACKEND_URL = 'http://localhost:3101';
  const TEST_EMAIL = 'e2e@example.com';
  const TEST_PASSWORD = 'TestPassword123!';

  beforeAll(async () => {
    // Start backend server
    console.log('Starting backend server...');
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: '3101' }
    });

    // Start frontend server
    console.log('Starting frontend server...');
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd() + '/../frontend',
      env: { ...process.env, PORT: '3100' }
    });

    // Wait for servers to start
    await sleep(5000);

    // Initialize Prisma
    prisma = new PrismaClient();
    await prisma.$connect();

    // Clean database
    await prisma.voiceNote.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Launch browser
    browser = await chromium.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    // Cleanup
    await browser?.close();
    await prisma?.$disconnect();
    
    // Kill server processes
    backendProcess?.kill();
    frontendProcess?.kill();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page?.close();
  });

  describe('User Registration and Login Flow', () => {
    it('should register a new user', async () => {
      // Navigate to registration page
      await page.goto(`${FRONTEND_URL}/register`);
      
      // Fill registration form
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
      
      // Verify user is on dashboard
      const welcomeText = await page.textContent('h1');
      expect(welcomeText).toContain('Welcome');
      
      // Verify free tier badge
      const tierBadge = await page.textContent('.tier-badge');
      expect(tierBadge).toContain('Free');
    });

    it('should login with existing user', async () => {
      // Navigate to login page
      await page.goto(`${FRONTEND_URL}/login`);
      
      // Fill login form
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
      
      // Verify user is logged in
      const userEmail = await page.textContent('.user-email');
      expect(userEmail).toContain(TEST_EMAIL);
    });

    it('should logout successfully', async () => {
      // Login first
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
      
      // Click logout button
      await page.click('button[aria-label="Logout"]');
      
      // Should redirect to home
      await page.waitForURL(FRONTEND_URL);
      
      // Try to access dashboard
      await page.goto(`${FRONTEND_URL}/dashboard`);
      
      // Should redirect to login
      await page.waitForURL(`${FRONTEND_URL}/login`);
    });
  });

  describe('Voice Note Upload Flow', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
    });

    it('should show upload interface', async () => {
      // Navigate to upload page
      await page.goto(FRONTEND_URL);
      
      // Verify upload elements exist
      const uploadArea = await page.isVisible('.upload-area');
      expect(uploadArea).toBe(true);
      
      const fileInput = await page.isVisible('input[type="file"]');
      expect(fileInput).toBe(true);
      
      // Verify processing status is idle
      const statusText = await page.textContent('.status-message');
      expect(statusText).toContain('Ready to upload');
    });

    it('should display processing stages during upload', async () => {
      await page.goto(FRONTEND_URL);
      
      // Create a test audio file
      const testFile = Buffer.from('test audio content');
      
      // Set file input
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.m4a',
        mimeType: 'audio/mp4',
        buffer: testFile
      });
      
      // Click upload button
      await page.click('button[aria-label="Upload"]');
      
      // Check for uploading stage
      await page.waitForSelector('.status-uploading', { timeout: 5000 });
      let statusText = await page.textContent('.status-message');
      expect(statusText).toContain('Uploading');
      
      // Note: Actual processing would require a real audio file
      // This test verifies the UI flow
    });

    it('should show usage limits for free tier', async () => {
      await page.goto(`${FRONTEND_URL}/dashboard`);
      
      // Check usage display
      const usageText = await page.textContent('.usage-stats');
      expect(usageText).toContain('0 / 5');
      expect(usageText).toContain('transcriptions used');
    });
  });

  describe('Pricing and Payment Flow', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
    });

    it('should display pricing page with tiers', async () => {
      await page.goto(`${FRONTEND_URL}/pricing`);
      
      // Verify all tiers are displayed
      const freeTier = await page.textContent('.tier-free');
      expect(freeTier).toContain('Free');
      expect(freeTier).toContain('5 transcriptions');
      
      const proTier = await page.textContent('.tier-pro');
      expect(proTier).toContain('Pro');
      expect(proTier).toContain('$9.99');
      expect(proTier).toContain('50 transcriptions');
      
      const businessTier = await page.textContent('.tier-business');
      expect(businessTier).toContain('Business');
      expect(businessTier).toContain('$29.99');
      expect(businessTier).toContain('200 transcriptions');
    });

    it('should initiate checkout for pro tier', async () => {
      await page.goto(`${FRONTEND_URL}/pricing`);
      
      // Click upgrade button for pro tier
      await page.click('.tier-pro button[aria-label="Choose Pro"]');
      
      // Should redirect to payment page (mock)
      await page.waitForURL(/payment/);
      
      // In mock mode, should show success
      const successMessage = await page.textContent('.payment-status');
      expect(successMessage).toContain('Processing');
    });

    it('should show upgraded tier after payment', async () => {
      // Simulate tier upgrade via API
      await page.evaluate(async () => {
        const response = await fetch('/api/payments/upgrade-tier', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ tier: 'pro' })
        });
        return response.json();
      });
      
      // Refresh dashboard
      await page.goto(`${FRONTEND_URL}/dashboard`);
      
      // Verify pro tier is shown
      const tierBadge = await page.textContent('.tier-badge');
      expect(tierBadge).toContain('Pro');
      
      // Verify usage limits updated
      const usageText = await page.textContent('.usage-stats');
      expect(usageText).toContain('0 / 50');
    });
  });

  describe('Settings and Account Management', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
    });

    it('should display account settings', async () => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      // Verify settings sections
      const accountSection = await page.isVisible('.settings-account');
      expect(accountSection).toBe(true);
      
      const notificationSection = await page.isVisible('.settings-notifications');
      expect(notificationSection).toBe(true);
      
      const languageSection = await page.isVisible('.settings-language');
      expect(languageSection).toBe(true);
    });

    it('should save notification preferences', async () => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      // Toggle email notifications
      await page.click('input[name="emailNotifications"]');
      
      // Save settings
      await page.click('button[aria-label="Save Settings"]');
      
      // Verify success message
      const successToast = await page.textContent('.toast-success');
      expect(successToast).toContain('Settings saved');
    });

    it('should handle password change', async () => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      // Fill password change form
      await page.fill('input[name="currentPassword"]', TEST_PASSWORD);
      await page.fill('input[name="newPassword"]', 'NewPassword123!');
      await page.fill('input[name="confirmNewPassword"]', 'NewPassword123!');
      
      // Submit form
      await page.click('button[aria-label="Change Password"]');
      
      // Verify success message
      const successToast = await page.textContent('.toast-success');
      expect(successToast).toContain('Password updated');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
    });

    it('should enforce rate limits for free tier', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 12; i++) {
        requests.push(
          page.evaluate(async () => {
            const response = await fetch('/api/voice-notes', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            return {
              status: response.status,
              headers: {
                rateLimitRemaining: response.headers.get('X-RateLimit-Remaining')
              }
            };
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // First 10 should succeed
      for (let i = 0; i < 10; i++) {
        expect(responses[i].status).toBe(200);
      }
      
      // 11th and 12th should be rate limited
      expect(responses[10].status).toBe(429);
      expect(responses[11].status).toBe(429);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be responsive on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(FRONTEND_URL);
      
      // Check mobile menu exists
      const mobileMenu = await page.isVisible('.mobile-menu-button');
      expect(mobileMenu).toBe(true);
      
      // Click mobile menu
      await page.click('.mobile-menu-button');
      
      // Verify navigation items are visible
      const navItems = await page.isVisible('.mobile-nav');
      expect(navItems).toBe(true);
    });

    it('should handle upload on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/dashboard`);
      
      // Navigate to upload
      await page.goto(FRONTEND_URL);
      
      // Verify upload area is visible and properly sized
      const uploadArea = await page.isVisible('.upload-area');
      expect(uploadArea).toBe(true);
      
      const uploadBox = await page.boundingBox('.upload-area');
      expect(uploadBox?.width).toBeLessThanOrEqual(375);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      await page.goto(`${FRONTEND_URL}/login`);
      
      // Simulate network failure
      await page.route('**/api/auth/login', route => {
        route.abort('connectionfailed');
      });
      
      // Try to login
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Should show error message
      const errorMessage = await page.textContent('.error-message');
      expect(errorMessage).toContain('Network error');
    });

    it('should handle API errors with proper messages', async () => {
      await page.goto(`${FRONTEND_URL}/login`);
      
      // Mock API error response
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Database connection failed'
          })
        });
      });
      
      // Try to login
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Should show error message
      const errorMessage = await page.textContent('.error-message');
      expect(errorMessage).toContain('Database connection failed');
    });
  });
});