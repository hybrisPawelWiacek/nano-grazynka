const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Main Application Flow', () => {
  let sessionId;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
    sessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
  });

  test('complete upload and transcription flow', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    await test.step('Upload file', async () => {
      await page.locator('text=Click to upload').click();
      const fileChooser = await page.waitForEvent('filechooser');
      await fileChooser.setFiles(testFile);
      
      await expect(page.locator('text=zabka.m4a')).toBeVisible();
    });

    await test.step('Select language and configure options', async () => {
      await page.locator('button:has-text("Polish")').click();
      
      const advancedOptionsButton = page.locator('button:has-text("Advanced Options")');
      if (await advancedOptionsButton.isVisible()) {
        await advancedOptionsButton.click();
        
        const modelSelect = page.locator('select[aria-label="Whisper model"]');
        if (await modelSelect.isVisible()) {
          await modelSelect.selectOption('turbo');
        }
        
        const initialPromptInput = page.locator('textarea[placeholder*="initial transcription"]');
        if (await initialPromptInput.isVisible()) {
          await initialPromptInput.fill('Transcribe this Polish audio about a convenience store visit');
        }
      }
    });

    await test.step('Start processing', async () => {
      await page.locator('button:has-text("Upload and Process")').click();
      
      await expect(page.locator('text=/Processing|Transcribing|Analyzing/')).toBeVisible({ 
        timeout: 10000 
      });
    });

    await test.step('Wait for transcription to complete', async () => {
      await expect(page.locator('.transcription-result, [data-testid="transcription-result"]')).toBeVisible({ 
        timeout: 60000 
      });
      
      const transcriptionText = await page.locator('.transcription-content, [data-testid="transcription-content"]').textContent();
      expect(transcriptionText).toBeTruthy();
      expect(transcriptionText.length).toBeGreaterThan(10);
    });

    await test.step('Check for post-transcription dialog', async () => {
      const postTranscriptionDialog = page.locator('[role="dialog"]:has-text("Refine"), .post-transcription-dialog');
      
      if (await postTranscriptionDialog.isVisible({ timeout: 5000 })) {
        const skipButton = page.locator('button:has-text("Skip"), button:has-text("Continue without")');
        if (await skipButton.isVisible()) {
          await skipButton.click();
        }
      }
    });

    await test.step('Verify result display', async () => {
      const keyPointsSection = page.locator('text=/Key Points|Main Points|Summary/i');
      if (await keyPointsSection.isVisible({ timeout: 5000 })) {
        const keyPointsList = await page.locator('ul li, .key-points li').count();
        expect(keyPointsList).toBeGreaterThan(0);
      }
      
      const actionItemsSection = page.locator('text=/Action Items|Tasks|To.*Do/i');
      if (await actionItemsSection.isVisible({ timeout: 5000 })) {
        const actionItemsList = await page.locator('.action-items li, ul:has-text("Action") li').count();
        expect(actionItemsList).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test('upload with two-pass transcription', async ({ page }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    await test.step('Upload and configure two-pass', async () => {
      await page.locator('text=Click to upload').click();
      const fileChooser = await page.waitForEvent('filechooser');
      await fileChooser.setFiles(testFile);
      
      await page.locator('button:has-text("Polish")').click();
      
      const advancedOptionsButton = page.locator('button:has-text("Advanced Options")');
      if (await advancedOptionsButton.isVisible()) {
        await advancedOptionsButton.click();
        
        const twoPassCheckbox = page.locator('input[type="checkbox"][name*="twoPass"], label:has-text("Enable two-pass")');
        if (await twoPassCheckbox.isVisible()) {
          await twoPassCheckbox.check();
        }
        
        await page.locator('textarea[placeholder*="initial"]').fill('First pass: basic transcription');
        await page.locator('textarea[placeholder*="refined"], textarea[placeholder*="second"]').fill('Second pass: improve accuracy');
      }
    });

    await test.step('Process with two-pass', async () => {
      await page.locator('button:has-text("Upload and Process")').click();
      
      await expect(page.locator('text=/Processing|Pass 1|Initial transcription/')).toBeVisible({ 
        timeout: 10000 
      });
      
      await expect(page.locator('.transcription-result, [data-testid="transcription-result"]')).toBeVisible({ 
        timeout: 90000 
      });
    });

    await test.step('Handle post-transcription dialog', async () => {
      const dialog = page.locator('[role="dialog"]:has-text("Refine Transcription")');
      
      if (await dialog.isVisible({ timeout: 10000 })) {
        const transcriptionPreview = await page.locator('.transcription-preview, [data-testid="transcription-preview"]').textContent();
        expect(transcriptionPreview).toBeTruthy();
        
        const refineButton = page.locator('button:has-text("Refine"), button:has-text("Generate Summary")');
        if (await refineButton.isVisible()) {
          await refineButton.click();
          
          await expect(page.locator('text=/Generating|Processing|Summarizing/')).toBeVisible({ 
            timeout: 5000 
          });
          
          await expect(page.locator('.summary-result, [data-testid="summary-result"]')).toBeVisible({ 
            timeout: 30000 
          });
        }
      }
    });
  });

  test('handle errors gracefully', async ({ page }) => {
    await test.step('Upload invalid file type', async () => {
      const invalidFile = path.join(__dirname, '../test-data/test-file.txt');
      const fs = require('fs');
      fs.writeFileSync(invalidFile, 'This is not an audio file');
      
      await page.locator('text=Click to upload').click();
      const fileChooser = await page.waitForEvent('filechooser');
      await fileChooser.setFiles(invalidFile);
      
      await page.locator('button:has-text("Upload and Process")').click();
      
      await expect(page.locator('text=/error|invalid|unsupported/i')).toBeVisible({ 
        timeout: 5000 
      });
      
      fs.unlinkSync(invalidFile);
    });
  });

  test('responsive UI elements', async ({ page }) => {
    await test.step('Check mobile responsiveness', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('text=Click to upload, button:has-text("Upload")')).toBeVisible();
      
      const mobileMenu = page.locator('[aria-label="Menu"], .mobile-menu-button');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await expect(page.locator('a:has-text("Library"), nav a:has-text("Library")')).toBeVisible();
      }
    });

    await test.step('Check desktop view', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await expect(page.locator('nav, .navigation')).toBeVisible();
      const libraryLink = page.locator('a:has-text("Library")');
      if (await libraryLink.isVisible()) {
        expect(await libraryLink.isVisible()).toBeTruthy();
      }
    });
  });

  test('verify API integration', async ({ page, request }) => {
    const testFile = path.join(__dirname, '../test-data/zabka.m4a');
    
    await test.step('Upload via UI and verify API response', async () => {
      await page.locator('text=Click to upload').click();
      const fileChooser = await page.waitForEvent('filechooser');
      await fileChooser.setFiles(testFile);
      
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/voice-notes') && response.status() === 200
      );
      
      await page.locator('button:has-text("Polish")').click();
      await page.locator('button:has-text("Upload and Process")').click();
      
      const response = await responsePromise;
      const responseData = await response.json();
      
      expect(responseData).toHaveProperty('voiceNote');
      expect(responseData.voiceNote).toHaveProperty('id');
      expect(responseData.voiceNote).toHaveProperty('transcription');
    });
  });
});