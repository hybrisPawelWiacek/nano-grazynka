/**
 * Page Object Model for Library Page
 * Following Playwright best practices
 */

class LibraryPage {
  constructor(page) {
    this.page = page;
    
    // Locators
    this.searchInput = page.getByPlaceholder(/search/i);
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.statusFilter = page.getByRole('combobox', { name: /status/i });
    this.languageFilter = page.getByRole('combobox', { name: /language/i });
    this.voiceNoteCards = page.locator('[data-testid="voice-note-card"]');
    this.loadingSpinner = page.locator('.spinner, [aria-label="Loading"]');
    this.emptyState = page.getByText(/no voice notes found/i);
    this.paginationNext = page.getByRole('button', { name: 'Next' });
    this.paginationPrev = page.getByRole('button', { name: 'Previous' });
  }

  async goto() {
    await this.page.goto('http://localhost:3100/library');
    await this.waitForReady();
  }

  async waitForReady() {
    // Wait for loading to complete
    await this.page.waitForLoadState('networkidle');
    
    // Wait for spinner to disappear if present
    const spinner = this.loadingSpinner;
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  async searchNotes(query) {
    await this.searchInput.fill(query);
    // Debounce wait
    await this.page.waitForTimeout(500);
    await this.waitForReady();
  }

  async filterByStatus(status) {
    await this.filterButton.click();
    await this.statusFilter.waitFor({ state: 'visible' });
    await this.statusFilter.selectOption(status);
    await this.waitForReady();
  }

  async filterByLanguage(language) {
    await this.filterButton.click();
    await this.languageFilter.waitFor({ state: 'visible' });
    await this.languageFilter.selectOption(language);
    await this.waitForReady();
  }

  async getVoiceNoteCount() {
    await this.waitForReady();
    if (await this.emptyState.isVisible()) {
      return 0;
    }
    return await this.voiceNoteCards.count();
  }

  async openVoiceNote(index = 0) {
    const cards = this.voiceNoteCards;
    if (await cards.count() > index) {
      await cards.nth(index).click();
      // Wait for navigation
      await this.page.waitForURL(/\/note\//);
    }
  }

  async deleteVoiceNote(index = 0) {
    const deleteButton = this.voiceNoteCards
      .nth(index)
      .getByRole('button', { name: /delete/i });
    
    await deleteButton.click();
    
    // Handle confirmation if present
    const confirmButton = this.page.getByRole('button', { name: /confirm/i });
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
    
    // Wait for deletion
    await this.page.waitForResponse(
      response => response.url().includes('/api/voice-notes') && response.status() === 204
    );
    
    await this.waitForReady();
  }

  async goToNextPage() {
    const isEnabled = await this.paginationNext.isEnabled();
    if (isEnabled) {
      await this.paginationNext.click();
      await this.waitForReady();
      return true;
    }
    return false;
  }

  async goToPreviousPage() {
    const isEnabled = await this.paginationPrev.isEnabled();
    if (isEnabled) {
      await this.paginationPrev.click();
      await this.waitForReady();
      return true;
    }
    return false;
  }
}