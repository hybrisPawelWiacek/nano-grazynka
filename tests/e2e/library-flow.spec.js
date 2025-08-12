const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Library Functionality', () => {
  let sessionId;
  let createdNoteId;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');
    sessionId = await page.evaluate(() => localStorage.getItem('anonymousSessionId'));
  });

  test.describe.serial('Library after transcription', () => {
    test('create transcription and navigate to library', async ({ page }) => {
      const testFile = path.join(__dirname, '../test-data/zabka.m4a');
      
      await test.step('Upload and process file', async () => {
        await page.locator('text=Click to upload').click();
        const fileChooser = await page.waitForEvent('filechooser');
        await fileChooser.setFiles(testFile);
        
        await page.locator('button:has-text("Polish")').click();
        await page.locator('button:has-text("Upload and Process")').click();
        
        await expect(page.locator('.transcription-result, [data-testid="transcription-result"]')).toBeVisible({ 
          timeout: 60000 
        });
      });

      await test.step('Navigate to library', async () => {
        await page.locator('a:has-text("Library"), button:has-text("View in Library"), a[href*="library"]').first().click();
        
        await expect(page.url()).toContain('library');
        await expect(page.locator('h1:has-text("Library"), h2:has-text("Library"), .library-header')).toBeVisible();
      });

      await test.step('Verify transcription appears in library', async () => {
        const transcriptionCard = page.locator('.transcription-card, .library-item, [data-testid="library-item"]').first();
        await expect(transcriptionCard).toBeVisible();
        
        const titleText = await transcriptionCard.locator('.title, h3, [data-testid="item-title"]').textContent();
        expect(titleText).toContain('zabka');
        
        const transcriptionPreview = await transcriptionCard.locator('.preview, .transcription-preview, [data-testid="item-preview"]').textContent();
        expect(transcriptionPreview).toBeTruthy();
        expect(transcriptionPreview.length).toBeGreaterThan(10);
        
        const dateElement = transcriptionCard.locator('.date, .timestamp, time, [data-testid="item-date"]');
        if (await dateElement.isVisible()) {
          const dateText = await dateElement.textContent();
          expect(dateText).toBeTruthy();
        }
      });
    });

    test('search functionality in library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      await test.step('Search for existing transcription', async () => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]');
        await expect(searchInput).toBeVisible();
        
        await searchInput.fill('zabka');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(500);
        
        const searchResults = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
        const count = await searchResults.count();
        expect(count).toBeGreaterThan(0);
        
        const firstResult = searchResults.first();
        const titleText = await firstResult.locator('.title, h3, [data-testid="item-title"]').textContent();
        expect(titleText.toLowerCase()).toContain('zabka');
      });

      await test.step('Search with no results', async () => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]');
        await searchInput.clear();
        await searchInput.fill('nonexistentquery12345');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(500);
        
        const noResultsMessage = page.locator('text=/No results|No transcriptions found|Empty/i');
        const searchResults = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
        
        const resultsCount = await searchResults.count();
        if (resultsCount === 0) {
          await expect(noResultsMessage).toBeVisible();
        }
      });

      await test.step('Clear search', async () => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]');
        await searchInput.clear();
        await searchInput.press('Enter');
        
        await page.waitForTimeout(500);
        
        const allItems = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
        const count = await allItems.count();
        expect(count).toBeGreaterThan(0);
      });
    });

    test('filter by language in library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      await test.step('Apply language filter', async () => {
        const filterButton = page.locator('button:has-text("Filter"), [data-testid="filter-button"], select[aria-label*="language"]');
        
        if (await filterButton.isVisible()) {
          if (filterButton.locator('select').isVisible()) {
            await filterButton.selectOption('pl');
          } else {
            await filterButton.click();
            const polishOption = page.locator('button:has-text("Polish"), option:has-text("Polish"), [data-value="pl"]');
            await polishOption.click();
          }
          
          await page.waitForTimeout(500);
          
          const filteredItems = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
          const count = await filteredItems.count();
          
          if (count > 0) {
            const firstItem = filteredItems.first();
            const languageTag = firstItem.locator('.language-tag, .language, [data-testid="item-language"]');
            if (await languageTag.isVisible()) {
              const langText = await languageTag.textContent();
              expect(langText.toLowerCase()).toContain('pol');
            }
          }
        }
      });
    });

    test('sort functionality in library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      await test.step('Sort by date', async () => {
        const sortButton = page.locator('button:has-text("Sort"), select[aria-label*="sort"], [data-testid="sort-button"]');
        
        if (await sortButton.isVisible()) {
          if (sortButton.locator('select').isVisible()) {
            await sortButton.selectOption('date-desc');
          } else {
            await sortButton.click();
            const newestFirstOption = page.locator('button:has-text("Newest"), option:has-text("Newest"), [data-value="date-desc"]');
            await newestFirstOption.click();
          }
          
          await page.waitForTimeout(500);
          
          const items = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
          const itemCount = await items.count();
          
          if (itemCount > 1) {
            const dates = [];
            for (let i = 0; i < Math.min(itemCount, 3); i++) {
              const dateElement = items.nth(i).locator('.date, .timestamp, time, [data-testid="item-date"]');
              if (await dateElement.isVisible()) {
                const dateText = await dateElement.getAttribute('datetime') || await dateElement.textContent();
                dates.push(new Date(dateText));
              }
            }
            
            for (let i = 1; i < dates.length; i++) {
              expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
            }
          }
        }
      });
    });

    test('view transcription details from library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      await test.step('Click on transcription to view details', async () => {
        const firstItem = page.locator('.transcription-card, .library-item, [data-testid="library-item"]').first();
        await expect(firstItem).toBeVisible();
        
        await firstItem.click();
        
        const detailView = page.locator('.transcription-detail, .detail-view, [data-testid="detail-view"], [role="article"]');
        await expect(detailView).toBeVisible({ timeout: 5000 });
        
        const fullTranscription = detailView.locator('.transcription-text, .full-transcription, [data-testid="full-transcription"]');
        await expect(fullTranscription).toBeVisible();
        const transcriptionText = await fullTranscription.textContent();
        expect(transcriptionText.length).toBeGreaterThan(50);
        
        const summarySection = detailView.locator('.summary, [data-testid="summary-section"]');
        if (await summarySection.isVisible()) {
          const keyPoints = summarySection.locator('ul li, .key-point');
          const keyPointsCount = await keyPoints.count();
          expect(keyPointsCount).toBeGreaterThan(0);
        }
      });

      await test.step('Navigate back to library', async () => {
        const backButton = page.locator('button:has-text("Back"), a:has-text("Back to Library"), [data-testid="back-button"]');
        if (await backButton.isVisible()) {
          await backButton.click();
        } else {
          await page.goBack();
        }
        
        await expect(page.locator('h1:has-text("Library"), h2:has-text("Library"), .library-header')).toBeVisible();
      });
    });

    test('edit transcription from library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      await test.step('Open edit mode', async () => {
        const firstItem = page.locator('.transcription-card, .library-item, [data-testid="library-item"]').first();
        await firstItem.hover();
        
        const editButton = firstItem.locator('button:has-text("Edit"), [aria-label="Edit"], [data-testid="edit-button"]');
        if (await editButton.isVisible()) {
          await editButton.click();
        } else {
          await firstItem.click();
          const detailEditButton = page.locator('button:has-text("Edit"), [data-testid="detail-edit-button"]');
          await detailEditButton.click();
        }
        
        const editForm = page.locator('form, .edit-form, [data-testid="edit-form"]');
        await expect(editForm).toBeVisible();
      });

      await test.step('Modify transcription', async () => {
        const titleInput = page.locator('input[name="title"], input[placeholder*="Title"], [data-testid="title-input"]');
        if (await titleInput.isVisible()) {
          await titleInput.clear();
          await titleInput.fill('Updated Title - Test');
        }
        
        const transcriptionTextarea = page.locator('textarea[name="transcription"], textarea[placeholder*="Transcription"], [data-testid="transcription-textarea"]');
        if (await transcriptionTextarea.isVisible()) {
          const currentText = await transcriptionTextarea.inputValue();
          await transcriptionTextarea.fill(currentText + '\n\n[Edited by test]');
        }
        
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]:has-text("Update"), [data-testid="save-button"]');
        await saveButton.click();
        
        await expect(page.locator('text=/Saved|Updated|Success/i')).toBeVisible({ timeout: 5000 });
      });

      await test.step('Verify changes', async () => {
        await page.reload();
        
        const updatedItem = page.locator('.transcription-card:has-text("Updated Title"), .library-item:has-text("Updated Title")').first();
        if (await updatedItem.isVisible()) {
          const titleText = await updatedItem.locator('.title, h3').textContent();
          expect(titleText).toContain('Updated Title');
        }
      });
    });

    test('delete transcription from library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      await test.step('Count initial items', async () => {
        const initialItems = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
        const initialCount = await initialItems.count();
        expect(initialCount).toBeGreaterThan(0);
      });

      await test.step('Delete an item', async () => {
        const lastItem = page.locator('.transcription-card, .library-item, [data-testid="library-item"]').last();
        await lastItem.hover();
        
        const deleteButton = lastItem.locator('button:has-text("Delete"), [aria-label="Delete"], [data-testid="delete-button"]');
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
        } else {
          await lastItem.click();
          const detailDeleteButton = page.locator('button:has-text("Delete"), [data-testid="detail-delete-button"]');
          await detailDeleteButton.click();
        }
        
        const confirmDialog = page.locator('[role="dialog"]:has-text("Confirm"), .confirm-dialog, [data-testid="confirm-dialog"]');
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
          await confirmButton.click();
        }
        
        await expect(page.locator('text=/Deleted|Removed|Success/i')).toBeVisible({ timeout: 5000 });
      });

      await test.step('Verify deletion', async () => {
        await page.reload();
        
        const remainingItems = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
        const remainingCount = await remainingItems.count();
        
        if (remainingCount === 0) {
          const emptyMessage = page.locator('text=/No transcriptions|Empty library|No items/i');
          await expect(emptyMessage).toBeVisible();
        }
      });
    });

    test('pagination in library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      const paginationControls = page.locator('.pagination, [data-testid="pagination"], nav[aria-label="Pagination"]');
      
      if (await paginationControls.isVisible()) {
        await test.step('Check pagination controls', async () => {
          const nextButton = paginationControls.locator('button:has-text("Next"), [aria-label="Next page"]');
          const prevButton = paginationControls.locator('button:has-text("Previous"), [aria-label="Previous page"]');
          const pageInfo = paginationControls.locator('.page-info, [data-testid="page-info"]');
          
          if (await pageInfo.isVisible()) {
            const pageText = await pageInfo.textContent();
            expect(pageText).toMatch(/\d+/);
          }
          
          if (await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(500);
            
            const items = page.locator('.transcription-card, .library-item, [data-testid="library-item"]');
            await expect(items.first()).toBeVisible();
            
            await expect(prevButton).toBeEnabled();
          }
        });
      }
    });

    test('export functionality from library', async ({ page }) => {
      await page.goto('http://localhost:3100/library');
      
      const firstItem = page.locator('.transcription-card, .library-item, [data-testid="library-item"]').first();
      await firstItem.hover();
      
      const exportButton = firstItem.locator('button:has-text("Export"), button:has-text("Download"), [aria-label="Export"], [data-testid="export-button"]');
      
      if (await exportButton.isVisible()) {
        await test.step('Export transcription', async () => {
          const downloadPromise = page.waitForEvent('download');
          await exportButton.click();
          
          const formatOptions = page.locator('[role="menu"], .export-options, [data-testid="export-options"]');
          if (await formatOptions.isVisible({ timeout: 2000 })) {
            const txtOption = formatOptions.locator('button:has-text("TXT"), button:has-text("Text")');
            await txtOption.click();
          }
          
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.(txt|json|md)$/);
        });
      }
    });
  });
});