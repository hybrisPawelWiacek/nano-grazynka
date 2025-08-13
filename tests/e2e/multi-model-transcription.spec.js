const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Multi-Model Transcription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
  });

  test('Should display model selection in advanced options', async ({ page }) => {
    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    
    // Check that model selection is visible
    await expect(page.locator('[data-testid="model-selection"]')).toBeVisible();
    await expect(page.locator('input[value="gpt-4o-transcribe"]')).toBeVisible();
    await expect(page.locator('input[value="google/gemini-2.0-flash-001"]')).toBeVisible();
  });

  test('Should show GPT-4o prompt interface when GPT-4o selected', async ({ page }) => {
    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.click('input[value="gpt-4o-transcribe"]');
    
    // Should show whisper prompt field with 224 token limit
    await expect(page.locator('[data-testid="whisper-prompt"]')).toBeVisible();
    await expect(page.locator('.token-counter')).toContainText('224');
  });

  test('Should show Gemini extended interface when Gemini selected', async ({ page }) => {
    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.click('input[value="google/gemini-2.0-flash-001"]');
    
    // Should show template selector and extended prompt
    await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="gemini-prompt"]')).toBeVisible();
    await expect(page.locator('.token-counter')).toContainText('1000000');
  });

  test('Should apply meeting template when selected', async ({ page }) => {
    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.click('input[value="google/gemini-2.0-flash-001"]');
    await page.selectOption('[data-testid="template-selector"]', 'meeting');
    
    const promptContent = await page.locator('[data-testid="gemini-prompt"]').inputValue();
    expect(promptContent).toContain('MEETING CONTEXT');
    expect(promptContent).toContain('COMPANY GLOSSARY');
    expect(promptContent).toContain('TRANSCRIPTION INSTRUCTIONS');
  });

  test('Should warn when GPT-4o prompt exceeds token limit', async ({ page }) => {
    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.click('input[value="gpt-4o-transcribe"]');
    
    // Type a very long prompt
    const longPrompt = 'a'.repeat(1000);
    await page.fill('[data-testid="whisper-prompt"]', longPrompt);
    
    // Should show warning
    await expect(page.locator('.token-warning')).toBeVisible();
    await expect(page.locator('.token-counter')).toHaveClass(/danger/);
  });

  test('Should upload with GPT-4o model selection', async ({ page }) => {
    // Set up request interception
    const uploadPromise = page.waitForRequest(req => 
      req.url().includes('/api/voice-notes/upload') && req.method() === 'POST'
    );

    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.click('input[value="gpt-4o-transcribe"]');
    await page.fill('[data-testid="whisper-prompt"]', 'Test prompt for GPT-4o');
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-audio.m4a'));
    
    await page.click('[data-testid="upload-button"]');
    
    const request = await uploadPromise;
    const postData = request.postDataJSON();
    expect(postData.transcriptionModel).toBe('gpt-4o-transcribe');
    expect(postData.whisperPrompt).toBe('Test prompt for GPT-4o');
  });

  test('Should upload with Gemini model selection and template', async ({ page }) => {
    // Set up request interception
    const uploadPromise = page.waitForRequest(req => 
      req.url().includes('/api/voice-notes/upload') && req.method() === 'POST'
    );

    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.click('input[value="google/gemini-2.0-flash-001"]');
    await page.selectOption('[data-testid="template-selector"]', 'technical');
    
    // Fill in template placeholders
    const promptContent = await page.locator('[data-testid="gemini-prompt"]').inputValue();
    const updatedPrompt = promptContent
      .replace('{domain}', 'Software Development')
      .replace('{technologies}', 'Node.js, TypeScript, React');
    await page.fill('[data-testid="gemini-prompt"]', updatedPrompt);
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-audio.m4a'));
    
    await page.click('[data-testid="upload-button"]');
    
    const request = await uploadPromise;
    const postData = request.postDataJSON();
    expect(postData.transcriptionModel).toBe('google/gemini-2.0-flash-001');
    expect(postData.geminiPrompt).toContain('Software Development');
    expect(postData.geminiPrompt).toContain('Node.js, TypeScript, React');
  });

  test('Should show cost comparison between models', async ({ page }) => {
    await page.click('[data-testid="upload-zone"]');
    await page.click('[data-testid="advanced-options-toggle"]');
    
    // Check cost displays
    const gpt4oCard = page.locator('[data-testid="model-card-gpt-4o"]');
    const geminiCard = page.locator('[data-testid="model-card-gemini"]');
    
    await expect(gpt4oCard).toContainText('$0.006/minute');
    await expect(geminiCard).toContainText('$0.0015/minute');
    await expect(geminiCard).toContainText('75% cheaper');
  });
});