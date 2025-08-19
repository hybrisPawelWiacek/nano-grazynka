#!/usr/bin/env node

/**
 * Enhanced Test Framework with Proper Error Reporting
 * Provides utilities for running tests with detailed logging and retry logic
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TestFramework {
  constructor(options = {}) {
    this.apiBase = options.apiBase || 'http://localhost:3101/api';
    this.frontendBase = options.frontendBase || 'http://localhost:3100';
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      partial: [],
      totalTests: 0,
      startTime: Date.now()
    };
    this.verbose = options.verbose || false;
    this.retryConfig = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000
    };
  }

  /**
   * Log with levels: info, warn, error, debug
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      skip: '⏭️',
      partial: '⚡'
    };
    
    const output = `[${timestamp}] ${prefix[level] || ''} ${message}`;
    
    if (level === 'error') {
      console.error(output);
      if (data) console.error(JSON.stringify(data, null, 2));
    } else if (level === 'debug' && this.verbose) {
      console.log(output);
      if (data) console.log(JSON.stringify(data, null, 2));
    } else if (level !== 'debug') {
      console.log(output);
      if (data && this.verbose) console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Run a test with proper error handling and reporting
   */
  async runTest(testId, testName, testFunction, options = {}) {
    this.results.totalTests++;
    const testStart = Date.now();
    
    this.log('info', `Running test ${testId}: ${testName}`);
    
    try {
      // Check if test should be skipped
      if (options.skip) {
        this.log('skip', `Test skipped: ${options.skipReason || 'No reason provided'}`);
        this.results.skipped.push({
          id: testId,
          name: testName,
          reason: options.skipReason,
          duration: 0
        });
        return { status: 'SKIP', reason: options.skipReason };
      }
      
      // Run test with retry logic
      let lastError = null;
      let attempt = 0;
      
      while (attempt < (options.retries || 1)) {
        attempt++;
        
        try {
          if (attempt > 1) {
            this.log('warn', `Retry attempt ${attempt}/${options.retries || 1}`);
            await this.wait(this.retryConfig.retryDelay * attempt);
          }
          
          const result = await testFunction();
          const duration = Date.now() - testStart;
          
          // Check if test is partial pass
          if (result && result.partial) {
            this.log('partial', `Test partially passed: ${result.message || 'No details'}`);
            this.results.partial.push({
              id: testId,
              name: testName,
              message: result.message,
              duration
            });
            return { status: 'PARTIAL', message: result.message };
          }
          
          // Test passed
          this.log('info', `Test passed in ${duration}ms`);
          this.results.passed.push({
            id: testId,
            name: testName,
            duration
          });
          return { status: 'PASS', duration };
          
        } catch (error) {
          lastError = error;
          this.log('debug', `Attempt ${attempt} failed:`, { 
            error: error.message,
            stack: error.stack 
          });
          
          // Check if error is retryable
          if (!this.isRetryableError(error) || attempt >= (options.retries || 1)) {
            break;
          }
        }
      }
      
      // Test failed after all retries
      const duration = Date.now() - testStart;
      this.log('error', `Test failed after ${attempt} attempts: ${lastError.message}`);
      this.results.failed.push({
        id: testId,
        name: testName,
        error: lastError.message,
        stack: this.verbose ? lastError.stack : undefined,
        duration,
        attempts: attempt
      });
      return { status: 'FAIL', error: lastError.message, attempts: attempt };
      
    } catch (error) {
      // Unexpected error
      const duration = Date.now() - testStart;
      this.log('error', `Unexpected error in test: ${error.message}`);
      this.results.failed.push({
        id: testId,
        name: testName,
        error: error.message,
        stack: this.verbose ? error.stack : undefined,
        duration
      });
      return { status: 'FAIL', error: error.message };
    }
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    // Network errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // HTTP 5xx errors
    if (error.response && error.response.status >= 500) {
      return true;
    }
    
    // Rate limiting
    if (error.response && error.response.status === 429) {
      return true;
    }
    
    return false;
  }

  /**
   * Wait for services to be ready
   */
  async waitForServices(timeout = 30000) {
    const startTime = Date.now();
    
    this.log('info', 'Waiting for services to be ready...');
    
    while (Date.now() - startTime < timeout) {
      try {
        // Check backend health
        const backendHealth = await axios.get('http://localhost:3101/health');
        if (backendHealth.data.status !== 'healthy') {
          throw new Error('Backend not healthy');
        }
        
        // Check backend routes are ready
        const backendReady = await axios.get('http://localhost:3101/ready');
        if (backendReady.data.status !== 'ready') {
          throw new Error('Backend routes not ready');
        }
        
        // Check frontend
        await axios.get('http://localhost:3100');
        
        this.log('info', 'All services are ready');
        return true;
        
      } catch (error) {
        this.log('debug', 'Services not ready yet...', { error: error.message });
        await this.wait(2000);
      }
    }
    
    throw new Error('Services did not become ready within timeout');
  }

  /**
   * Utility to wait
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test report
   */
  generateReport(format = 'console') {
    const duration = Date.now() - this.results.startTime;
    const passRate = this.results.totalTests > 0 
      ? Math.round((this.results.passed.length / this.results.totalTests) * 100)
      : 0;
    
    if (format === 'console') {
      console.log('\n' + '='.repeat(60));
      console.log('TEST EXECUTION REPORT');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${this.results.totalTests}`);
      console.log(`✅ Passed: ${this.results.passed.length}`);
      console.log(`❌ Failed: ${this.results.failed.length}`);
      console.log(`⚡ Partial: ${this.results.partial.length}`);
      console.log(`⏭️  Skipped: ${this.results.skipped.length}`);
      console.log(`Pass Rate: ${passRate}%`);
      console.log(`Duration: ${Math.round(duration / 1000)}s`);
      
      if (this.results.failed.length > 0) {
        console.log('\nFailed Tests:');
        this.results.failed.forEach(test => {
          console.log(`  - ${test.id}: ${test.name}`);
          console.log(`    Error: ${test.error}`);
          if (test.attempts > 1) {
            console.log(`    Attempts: ${test.attempts}`);
          }
        });
      }
      
      if (this.results.partial.length > 0) {
        console.log('\nPartial Passes:');
        this.results.partial.forEach(test => {
          console.log(`  - ${test.id}: ${test.name}`);
          console.log(`    Message: ${test.message}`);
        });
      }
      
      if (this.results.skipped.length > 0) {
        console.log('\nSkipped Tests:');
        this.results.skipped.forEach(test => {
          console.log(`  - ${test.id}: ${test.name}`);
          console.log(`    Reason: ${test.reason}`);
        });
      }
      
      console.log('='.repeat(60));
    }
    
    return {
      summary: {
        total: this.results.totalTests,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        partial: this.results.partial.length,
        skipped: this.results.skipped.length,
        passRate,
        duration
      },
      details: this.results
    };
  }

  /**
   * Save report to file
   */
  async saveReport(filename) {
    const report = this.generateReport('json');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(
      __dirname, 
      '../../imp_docs/testing/results',
      filename || `TEST_REPORT_${timestamp}.json`
    );
    
    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log('info', `Report saved to ${reportPath}`);
    
    return reportPath;
  }

  /**
   * Test utilities for common operations
   */
  async uploadFile(filePath, sessionId = null) {
    const form = new FormData();
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }
    
    form.append('file', fs.createReadStream(filePath));
    form.append('userId', sessionId || 'anonymous');
    
    const headers = {
      ...form.getHeaders()
    };
    
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    const response = await axios.post(
      `${this.apiBase}/voice-notes/upload`,
      form,
      { headers }
    );
    
    return response.data;
  }

  /**
   * Get test exit code based on results
   */
  getExitCode() {
    // Return 0 if all tests passed or only had partial passes
    // Return 1 if any tests failed
    return this.results.failed.length > 0 ? 1 : 0;
  }
}

module.exports = TestFramework;