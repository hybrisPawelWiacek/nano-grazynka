const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Anonymous User Flow', () => {
  let sessionId;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
    sessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
  });

  test('should generate anonymous session on first visit', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    const newSessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
    expect(newSessionId).toBeTruthy();
    expect(newSessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test('should show 5 free uses for anonymous users', async ({ page }) => {
    const freeUsesText = await page.locator('text=/Free uses: \\d+ \\/ 5 remaining/').textContent();
    expect(freeUsesText).toContain('5 remaining');
  });

  test('should upload file as anonymous user', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    await expect(page.locator('text=zabka.m4a')).toBeVisible();
    
    await page.locator('button:has-text("Polish")').click();
    
    await page.locator('button:has-text("Upload and Process")').click();
    
    await expect(page.locator('text=/Processing|Transcribing/')).toBeVisible({ timeout: 10000 });
  });

  test('should track usage count', async ({ page, request }) => {
    const headers = sessionId ? { 'x-session-id': sessionId } : {};
    
    const response = await request.get('http://localhost:3101/api/anonymous/usage', { headers });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('remaining');
      expect(data.remaining).toBeGreaterThanOrEqual(0);
      expect(data.remaining).toBeLessThanOrEqual(5);
    }
  });

  test('should show conversion modal after 5 uploads', async ({ page, request }) => {
    const headers = { 'x-session-id': sessionId };
    
    for (let i = 0; i < 5; i++) {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'audio/mp3' }), `test${i}.mp3`);
      formData.append('language', 'en');
      
      await request.post('http://localhost:3101/api/anonymous/upload', {
        headers,
        multipart: {
          file: {
            name: `test${i}.mp3`,
            mimeType: 'audio/mp3',
            buffer: Buffer.from('test audio content')
          },
          language: 'en'
        }
      });
    }
    
    await page.reload();
    
    const testFile = path.join(__dirname, '../test-data/test-audio.mp3');
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    await fileChooser.setFiles(testFile);
    
    await page.locator('button:has-text("Upload and Process")').click();
    
    await expect(page.locator('text=/upgrade|limit reached/i')).toBeVisible({ timeout: 5000 });
  });

  test('should persist session across page reloads', async ({ page }) => {
    const initialSessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
    
    await page.reload();
    
    const reloadedSessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
    expect(reloadedSessionId).toBe(initialSessionId);
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.locator('text=Click to upload').click();
    const fileChooser = await page.waitForEvent('filechooser');
    
    const invalidFile = path.join(__dirname, '../test-data/invalid.txt');
    fs.writeFileSync(invalidFile, 'This is not an audio file');
    
    await fileChooser.setFiles(invalidFile);
    await page.locator('button:has-text("Upload and Process")').click();
    
    await expect(page.locator('text=/error|invalid|failed/i')).toBeVisible({ timeout: 5000 });
    
    fs.unlinkSync(invalidFile);
  });
});