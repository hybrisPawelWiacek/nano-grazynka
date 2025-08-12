const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Two-Pass Transcription Flow', () => {
  let sessionId;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
    sessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
  });

  test('should toggle advanced options visibility', async ({ page }) => {
    // Upload a file to get to preview dialog
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    // Check that advanced options are initially hidden
    await expect(page.locator('[placeholder="Enter Whisper prompt (optional)"]')).not.toBeVisible();
    
    // Click to show advanced options
    await page.locator('text=Show Advanced Options').click();
    
    // Check that advanced options are now visible
    await expect(page.locator('[placeholder="Enter Whisper prompt (optional)"]')).toBeVisible();
    
    // Click to hide advanced options
    await page.locator('text=Hide Advanced Options').click();
    
    // Check that advanced options are hidden again
    await expect(page.locator('[placeholder="Enter Whisper prompt (optional)"]')).not.toBeVisible();
  });

  test('should accept whisper prompt in advanced options', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    // Open advanced options
    await page.locator('text=Show Advanced Options').click();
    
    // Enter whisper prompt
    const whisperPrompt = 'This is a conversation about a small shop in Poland called Żabka.';
    await page.fill('[placeholder="Enter Whisper prompt (optional)"]', whisperPrompt);
    
    // Check character count is displayed
    const charCount = await page.locator('text=/\\d+ \\/ 224 tokens/').textContent();
    expect(charCount).toContain('224 tokens');
    
    // Select language
    await page.locator('button:has-text("Polish")').click();
    
    // Upload and process
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for processing to start
    await expect(page.locator('text=/Processing|Transcribing/')).toBeVisible({ timeout: 10000 });
  });

  test('should show post-transcription dialog after transcription completes', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/test-audio.mp3');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    // Select language
    await page.locator('button:has-text("English")').click();
    
    // Upload and process
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for transcription to complete and dialog to appear
    await expect(page.locator('h2:has-text("Review Transcription")')).toBeVisible({ timeout: 30000 });
    
    // Check that transcription text is displayed
    await expect(page.locator('text=Transcription Result:')).toBeVisible();
    
    // Check that summary prompt field is present
    await expect(page.locator('[placeholder="Enter custom instructions for the summary (optional)"]')).toBeVisible();
    
    // Check that both buttons are present
    await expect(page.locator('button:has-text("Generate Summary")')).toBeVisible();
    await expect(page.locator('button:has-text("Skip Summary")')).toBeVisible();
  });

  test('should allow customizing summary prompt in post-transcription dialog', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/test-audio.mp3');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    await page.locator('button:has-text("English")').click();
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for post-transcription dialog
    await expect(page.locator('h2:has-text("Review Transcription")')).toBeVisible({ timeout: 30000 });
    
    // Enter custom summary prompt
    const customPrompt = 'Focus on action items and key decisions made during the conversation.';
    await page.fill('[placeholder="Enter custom instructions for the summary (optional)"]', customPrompt);
    
    // Click generate summary
    await page.locator('button:has-text("Generate Summary")').click();
    
    // Check that loading state is shown
    await expect(page.locator('text=/Generating summary/i')).toBeVisible();
    
    // Wait for summary generation to complete (dialog should close)
    await expect(page.locator('h2:has-text("Review Transcription")')).not.toBeVisible({ timeout: 30000 });
    
    // Check that we're back to the main page or showing results
    await expect(page.locator('text=/Processing complete|View in Library|Upload another/i')).toBeVisible({ timeout: 10000 });
  });

  test('should allow skipping summary generation', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/test-audio.mp3');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    await page.locator('button:has-text("English")').click();
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for post-transcription dialog
    await expect(page.locator('h2:has-text("Review Transcription")')).toBeVisible({ timeout: 30000 });
    
    // Click skip summary
    await page.locator('button:has-text("Skip Summary")').click();
    
    // Dialog should close immediately
    await expect(page.locator('h2:has-text("Review Transcription")')).not.toBeVisible();
    
    // Should be back to main page
    await expect(page.locator('text=Click to upload')).toBeVisible();
  });

  test('should preserve whisper prompt through entire flow', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    const whisperPrompt = 'Polish convenience store conversation with brand names.';
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    // Open advanced options and enter whisper prompt
    await page.locator('text=Show Advanced Options').click();
    await page.fill('[placeholder="Enter Whisper prompt (optional)"]', whisperPrompt);
    
    await page.locator('button:has-text("Polish")').click();
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for transcription
    await expect(page.locator('h2:has-text("Review Transcription")')).toBeVisible({ timeout: 30000 });
    
    // Enter custom summary prompt
    await page.fill('[placeholder="Enter custom instructions for the summary (optional)"]', 'Summarize in bullet points.');
    
    // Generate summary
    await page.locator('button:has-text("Generate Summary")').click();
    
    // Wait for completion
    await expect(page.locator('h2:has-text("Review Transcription")')).not.toBeVisible({ timeout: 30000 });
    
    // Verify the note was processed successfully
    await expect(page.locator('text=/Processing complete|View in Library|Upload another/i')).toBeVisible({ timeout: 10000 });
  });

  test('should handle API errors gracefully in post-transcription dialog', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/test-audio.mp3');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    await page.locator('button:has-text("English")').click();
    
    // Mock API failure
    await page.route('**/api/voice-notes/*/regenerate-summary', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for post-transcription dialog
    await expect(page.locator('h2:has-text("Review Transcription")')).toBeVisible({ timeout: 30000 });
    
    // Try to generate summary
    await page.locator('button:has-text("Generate Summary")').click();
    
    // Should show error message
    await expect(page.locator('text=/Error|Failed|Something went wrong/i')).toBeVisible({ timeout: 5000 });
    
    // Dialog should remain open
    await expect(page.locator('h2:has-text("Review Transcription")')).toBeVisible();
    
    // Should be able to retry or skip
    await expect(page.locator('button:has-text("Generate Summary")')).toBeVisible();
    await expect(page.locator('button:has-text("Skip Summary")')).toBeVisible();
  });
});