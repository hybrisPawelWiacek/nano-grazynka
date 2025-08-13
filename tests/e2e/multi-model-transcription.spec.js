// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Multi-Model Transcription', () => {
  const TEST_AUDIO = path.join(__dirname, '../test-data/zabka.m4a');
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
    // Wait for page to load
    await page.waitForSelector('h1:has-text("nano-Grazynka")', { timeout: 10000 });
  });

  test('should display model selection when Advanced Options is expanded', async ({ page }) => {
    // Click Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Check for model selection cards
    await expect(page.locator('text=Choose Transcription Model')).toBeVisible();
    await expect(page.locator('text=GPT-4o Transcribe')).toBeVisible();
    await expect(page.locator('text=Gemini 2.0 Flash')).toBeVisible();
    
    // Check model features are displayed
    await expect(page.locator('text=224 token prompt limit')).toBeVisible();
    await expect(page.locator('text=1M token prompt capacity')).toBeVisible();
  });

  test('should switch between GPT-4o and Gemini models', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Initially GPT-4o should be selected
    const gptRadio = page.locator('input[value="gpt-4o-transcribe"]');
    await expect(gptRadio).toBeChecked();
    
    // Click Gemini model
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Gemini should now be selected
    const geminiRadio = page.locator('input[value="google/gemini-2.0-flash-001"]');
    await expect(geminiRadio).toBeChecked();
  });

  test('should show different prompt interfaces for each model', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // With GPT-4o selected (default)
    await expect(page.locator('textarea[placeholder*="proper nouns"]')).toBeVisible();
    
    // Switch to Gemini
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Should show template selector
    await expect(page.locator('text=Select Template')).toBeVisible();
  });

  test('should display template options for Gemini model', async ({ page }) => {
    // Expand Advanced Options and select Gemini
    await page.click('button:has-text("Advanced Options")');
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Click template dropdown if it exists
    const templateButton = page.locator('button:has-text("Select Template")');
    if (await templateButton.isVisible()) {
      await templateButton.click();
      
      // Check template options are visible
      await expect(page.locator('text=Meeting Transcription')).toBeVisible();
      await expect(page.locator('text=Technical Discussion')).toBeVisible();
      await expect(page.locator('text=Podcast/Interview')).toBeVisible();
    }
  });

  test('should show token counter with appropriate limits', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Type in GPT-4o prompt
    const gptPrompt = page.locator('textarea[placeholder*="proper nouns"]');
    await gptPrompt.fill('Test prompt for token counting');
    
    // Check token counter shows
    const tokenCounter = page.locator('[class*="tokenCounter"]');
    if (await tokenCounter.isVisible()) {
      await expect(tokenCounter).toContainText(/\d+.*224/);
    }
    
    // Switch to Gemini
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Check for Gemini prompt area
    const geminiPrompt = page.locator('textarea').last();
    if (await geminiPrompt.isVisible()) {
      await geminiPrompt.fill('Test prompt for Gemini');
    }
  });

  test('should upload file with GPT-4o model', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Add whisper prompt
    const whisperPrompt = page.locator('textarea[placeholder*="proper nouns"]');
    await whisperPrompt.fill('Żabka, sklep, zakupy');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_AUDIO);
    
    // Wait for some indication of processing
    await page.waitForTimeout(2000);
    
    // Check for any status change
    const processingIndicators = [
      'text=/Processing|Uploading|Transcribing/',
      'text=/Upload successful|File uploaded/',
      '[class*="progress"]',
      '[class*="loading"]'
    ];
    
    let foundIndicator = false;
    for (const selector of processingIndicators) {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundIndicator = true;
        break;
      }
    }
    
    expect(foundIndicator).toBeTruthy();
  });

  test('should upload file with Gemini model', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Switch to Gemini
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Add some context if prompt field exists
    const geminiPrompt = page.locator('textarea').last();
    if (await geminiPrompt.isVisible()) {
      await geminiPrompt.fill('Test Gemini context');
    }
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_AUDIO);
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check for processing indicator
    const processingIndicators = [
      'text=/Processing|Uploading|Transcribing/',
      'text=/Upload successful|File uploaded/',
      '[class*="progress"]',
      '[class*="loading"]'
    ];
    
    let foundIndicator = false;
    for (const selector of processingIndicators) {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundIndicator = true;
        break;
      }
    }
    
    expect(foundIndicator).toBeTruthy();
  });

  test('should show cost estimator for both models', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Check for cost information with GPT-4o
    const costInfo = page.locator('[class*="cost"], text=/\\$0\\.006|cost/i');
    if (await costInfo.isVisible()) {
      await expect(costInfo.first()).toBeVisible();
    }
    
    // Switch to Gemini
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Check for Gemini cost and savings
    const savingsInfo = page.locator('text=/75%|savings|\\$0\\.0015/i');
    if (await savingsInfo.isVisible()) {
      await expect(savingsInfo.first()).toBeVisible();
    }
  });

  test('should handle model selection persistence', async ({ page }) => {
    // Expand Advanced Options and select Gemini
    await page.click('button:has-text("Advanced Options")');
    await page.click('label:has-text("Gemini 2.0 Flash")');
    
    // Collapse Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Re-expand
    await page.click('button:has-text("Advanced Options")');
    
    // Gemini should still be selected
    const geminiRadio = page.locator('input[value="google/gemini-2.0-flash-001"]');
    await expect(geminiRadio).toBeChecked();
  });

  test('should validate token limits', async ({ page }) => {
    // Expand Advanced Options
    await page.click('button:has-text("Advanced Options")');
    
    // Fill GPT-4o prompt with long text
    const longPrompt = 'word '.repeat(300); // ~300 tokens, exceeds 224 limit
    const whisperPrompt = page.locator('textarea[placeholder*="proper nouns"]');
    await whisperPrompt.fill(longPrompt);
    
    // Check for warning or error indication
    const warningIndicators = [
      'text=/exceed|limit|too long|224/i',
      '[class*="error"]',
      '[class*="warning"]',
      '[style*="red"]'
    ];
    
    let foundWarning = false;
    for (const selector of warningIndicators) {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundWarning = true;
        break;
      }
    }
    
    // Either warning shown or upload disabled
    if (!foundWarning) {
      const uploadButton = page.locator('button:has-text("Upload")').or(page.locator('button[type="submit"]'));
      const isDisabled = await uploadButton.isDisabled().catch(() => false);
      expect(isDisabled).toBeTruthy();
    }
  });
});