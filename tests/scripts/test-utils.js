#!/usr/bin/env node

/**
 * Test Utilities for nano-Grazynka
 * Provides consistent session management and test helpers
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class TestUtils {
  constructor() {
    this.baseUrl = 'http://localhost:3101';
    this.frontendUrl = 'http://localhost:3100';
    this.currentSession = null;
    this.testDataDir = path.join(__dirname, '../test-data');
  }

  /**
   * Generate a unique test session ID
   */
  generateSessionId(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create and track a test session
   */
  createTestSession(prefix = 'test') {
    this.currentSession = this.generateSessionId(prefix);
    return this.currentSession;
  }

  /**
   * Get current session or create new one
   */
  getOrCreateSession() {
    if (!this.currentSession) {
      this.createTestSession();
    }
    return this.currentSession;
  }

  /**
   * Upload a test file with consistent session handling
   */
  async uploadTestFile(filename = 'zabka.m4a', options = {}) {
    const session = options.sessionId || this.getOrCreateSession();
    const filePath = path.join(this.testDataDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }

    const form = new FormData();
    form.append('audio', fs.createReadStream(filePath));
    form.append('sessionId', session);
    
    // Add optional fields
    if (options.projectId) form.append('projectId', options.projectId);
    if (options.language) form.append('language', options.language);
    if (options.customPrompt) form.append('customPrompt', options.customPrompt);

    const response = await fetch(`${this.baseUrl}/api/voice-notes`, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'x-session-id': session
      }
    });

    const result = await response.json();
    return {
      status: response.status,
      data: result,
      sessionId: session,
      noteId: result.voiceNote?.id
    };
  }

  /**
   * List voice notes for current session
   */
  async listVoiceNotes(options = {}) {
    const session = options.sessionId || this.getOrCreateSession();
    const limit = options.limit || 20;
    const page = options.page || 1;
    
    const url = `${this.baseUrl}/api/voice-notes?limit=${limit}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        'x-session-id': session
      }
    });

    return {
      status: response.status,
      data: await response.json(),
      sessionId: session
    };
  }

  /**
   * Get a single voice note
   */
  async getVoiceNote(noteId, options = {}) {
    const session = options.sessionId || this.getOrCreateSession();
    
    const response = await fetch(`${this.baseUrl}/api/voice-notes/${noteId}`, {
      headers: {
        'x-session-id': session
      }
    });

    return {
      status: response.status,
      data: await response.json(),
      sessionId: session
    };
  }

  /**
   * Delete a voice note with proper session
   */
  async deleteVoiceNote(noteId, options = {}) {
    const session = options.sessionId || this.getOrCreateSession();
    
    const response = await fetch(`${this.baseUrl}/api/voice-notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'x-session-id': session
      }
    });

    return {
      status: response.status,
      sessionId: session
    };
  }

  /**
   * Wait for note processing to complete
   */
  async waitForProcessing(noteId, maxAttempts = 30, delayMs = 2000) {
    const session = this.getOrCreateSession();
    
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getVoiceNote(noteId, { sessionId: session });
      
      if (result.data.status === 'completed' || result.data.status === 'failed') {
        return result.data;
      }
      
      await this.sleep(delayMs);
    }
    
    throw new Error(`Processing timeout for note ${noteId}`);
  }

  /**
   * Register a test user
   */
  async registerUser(options = {}) {
    const email = options.email || `test-${Date.now()}@example.com`;
    const password = options.password || 'Test123!';
    const name = options.name || 'Test User';
    
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    return {
      status: response.status,
      data: await response.json(),
      credentials: { email, password }
    };
  }

  /**
   * Login and get JWT token
   */
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const setCookie = response.headers.get('set-cookie');
    const token = setCookie ? setCookie.match(/token=([^;]+)/)?.[1] : null;

    return {
      status: response.status,
      data: await response.json(),
      token
    };
  }

  /**
   * Clean up test data from database
   */
  async cleanupTestData(sessionPrefix = 'test') {
    // This would need backend support or direct database access
    console.log(`Cleanup for sessions starting with: ${sessionPrefix}`);
    // TODO: Implement cleanup via API or database
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return {
      status: response.status,
      data: await response.json()
    };
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Assert helper for tests
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Log test result
   */
  logResult(testName, passed, details = '') {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${testName}: ${status} ${details}`);
    return passed;
  }

  /**
   * Get correct frontend routes
   */
  getFrontendRoutes() {
    return {
      home: this.frontendUrl,
      note: (id) => `${this.frontendUrl}/note/${id}`, // Singular, not plural
      library: `${this.frontendUrl}/library`,
      dashboard: `${this.frontendUrl}/dashboard`,
      login: `${this.frontendUrl}/login`,
      register: `${this.frontendUrl}/register`,
      settings: `${this.frontendUrl}/settings`
    };
  }
}

// Export for use in other test files
module.exports = TestUtils;

// If run directly, show example usage
if (require.main === module) {
  console.log('Test Utils Ready');
  console.log('Example usage:');
  console.log('  const TestUtils = require("./test-utils");');
  console.log('  const utils = new TestUtils();');
  console.log('  const session = utils.createTestSession();');
  console.log('  const result = await utils.uploadTestFile("zabka.m4a");');
}