/**
 * Page Object Model for Upload Page
 * Following Playwright best practices
 */

class UploadPage {
  constructor(page) {
    this.page = page;
    
    // Locators
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page.getByRole('button', { name: /upload/i });
    this.titleInput = page.getByLabel(/title/i);
    this.languageSelect = page.getByRole('combobox', { name: /language/i });
    this.successMessage = page.getByText(/upload successful/i);
    this.errorMessage = page.getByRole('alert');
    this.uploadForm = page.locator('form').first();
    this.dropZone = page.getByText(/drag.*drop|drop.*file/i);
  }

  async goto() {
    await this.page.goto('http://localhost:3100');
    await this.waitForReady();
  }

  async waitForReady() {
    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle');
    // Ensure upload form is visible
    await this.uploadForm.waitFor({ state: 'visible' });
  }

  async uploadFile(filePath, title = 'Test Voice Note', language = 'EN') {
    // Set file input
    await this.fileInput.setInputFiles(filePath);
    
    // Fill in metadata if fields exist
    if (await this.titleInput.isVisible()) {
      await this.titleInput.fill(title);
    }
    
    if (await this.languageSelect.isVisible()) {
      await this.languageSelect.selectOption(language);
    }
    
    // Click upload button
    await this.uploadButton.click();
    
    // Wait for upload to complete
    await this.page.waitForResponse(
      response => response.url().includes('/api/voice-notes') && response.status() === 201,
      { timeout: 30000 }
    );
  }

  async isUploadSuccessful() {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}