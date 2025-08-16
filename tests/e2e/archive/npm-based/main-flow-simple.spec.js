const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Main Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
  });

  test('basic upload flow', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    // Upload file
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    await expect(page.locator('text=zabka.m4a')).toBeVisible();
    
    // Select language
    await page.locator('button:has-text("Polish")').click();
    
    // Start processing
    await page.locator('button:has-text("Upload and Process")').click();
    
    // Wait for processing
    await expect(page.locator('text=/Processing|Transcribing/')).toBeVisible({ 
      timeout: 10000 
    });
  });
});