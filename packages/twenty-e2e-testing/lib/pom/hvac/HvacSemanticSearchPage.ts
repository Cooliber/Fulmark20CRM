import { Page, Locator, expect } from '@playwright/test';

export class HvacSemanticSearchPage {
  readonly page: Page;
  
  // Main search elements
  readonly searchContainer: Locator;
  readonly searchHeader: Locator;
  readonly searchInputContainer: Locator;
  readonly searchInput: Locator;
  readonly searchIcon: Locator;
  readonly searchButton: Locator;
  
  // Filter and options
  readonly filterButton: Locator;
  readonly weaviateToggle: Locator;
  readonly refreshButton: Locator;
  readonly advancedFilters: Locator;
  
  // Search results
  readonly resultsContainer: Locator;
  readonly resultItems: Locator;
  readonly resultTitle: Locator;
  readonly resultDescription: Locator;
  readonly resultScore: Locator;
  readonly resultMetadata: Locator;
  readonly noResultsMessage: Locator;
  
  // Search statistics
  readonly statsContainer: Locator;
  readonly totalDocuments: Locator;
  readonly indexedDocuments: Locator;
  readonly lastUpdate: Locator;
  readonly executionTime: Locator;
  readonly searchSource: Locator;
  
  // Loading states
  readonly loadingSpinner: Locator;
  readonly searchingIndicator: Locator;
  
  // Error states
  readonly errorMessage: Locator;
  readonly retryButton: Locator;
  
  // Polish localization elements
  readonly polishPlaceholder: Locator;
  readonly polishLabels: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main search elements
    this.searchContainer = page.locator('[data-testid="hvac-semantic-search"]').or(page.locator('.hvac-semantic-search'));
    this.searchHeader = page.locator('[data-testid="search-header"]').or(page.locator('.search-header'));
    this.searchInputContainer = page.locator('[data-testid="search-input-container"]').or(page.locator('.search-input-container'));
    this.searchInput = page.locator('[data-testid="search-input"]').or(page.locator('input[placeholder*="Szukaj"]'));
    this.searchIcon = page.locator('[data-testid="search-icon"]').or(page.locator('.pi-search'));
    this.searchButton = page.locator('[data-testid="search-button"]').or(page.locator('button:has-text("Szukaj")'));
    
    // Filter and options
    this.filterButton = page.locator('[data-testid="filter-button"]').or(page.locator('button:has(.pi-filter)'));
    this.weaviateToggle = page.locator('[data-testid="weaviate-toggle"]').or(page.locator('button:has(.pi-database)'));
    this.refreshButton = page.locator('[data-testid="refresh-button"]').or(page.locator('button:has(.pi-refresh)'));
    this.advancedFilters = page.locator('[data-testid="advanced-filters"]').or(page.locator('.advanced-filters'));
    
    // Search results
    this.resultsContainer = page.locator('[data-testid="search-results"]').or(page.locator('.search-results'));
    this.resultItems = page.locator('[data-testid="result-item"]').or(page.locator('.result-item'));
    this.resultTitle = page.locator('[data-testid="result-title"]').or(page.locator('.result-title'));
    this.resultDescription = page.locator('[data-testid="result-description"]').or(page.locator('.result-description'));
    this.resultScore = page.locator('[data-testid="result-score"]').or(page.locator('.result-score'));
    this.resultMetadata = page.locator('[data-testid="result-metadata"]').or(page.locator('.result-metadata'));
    this.noResultsMessage = page.locator('text=Brak wyników').or(page.locator('text=No results found'));
    
    // Search statistics
    this.statsContainer = page.locator('[data-testid="search-stats"]').or(page.locator('.search-stats'));
    this.totalDocuments = page.locator('[data-testid="total-documents"]').or(page.locator('.total-documents'));
    this.indexedDocuments = page.locator('[data-testid="indexed-documents"]').or(page.locator('.indexed-documents'));
    this.lastUpdate = page.locator('[data-testid="last-update"]').or(page.locator('.last-update'));
    this.executionTime = page.locator('[data-testid="execution-time"]').or(page.locator('.execution-time'));
    this.searchSource = page.locator('[data-testid="search-source"]').or(page.locator('.search-source'));
    
    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]').or(page.locator('.pi-spin'));
    this.searchingIndicator = page.locator('text=Wyszukiwanie...').or(page.locator('text=Searching...'));
    
    // Error states
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error-message'));
    this.retryButton = page.locator('[data-testid="retry-button"]').or(page.locator('button:has-text("Spróbuj ponownie")'));
    
    // Polish localization elements
    this.polishPlaceholder = page.locator('input[placeholder*="Szukaj w dokumentach HVAC"]');
    this.polishLabels = page.locator('text=Wyszukiwanie semantyczne');
  }

  async navigateTo() {
    await this.page.goto('/hvac#search');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.searchContainer.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  async performSearch(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForSearchResults();
  }

  async performSearchWithButton(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForSearchResults();
  }

  async waitForSearchResults() {
    // Wait for either results or no results message
    await Promise.race([
      this.resultItems.first().waitFor({ state: 'visible', timeout: 10000 }),
      this.noResultsMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  async verifySearchResults(expectedCount?: number) {
    await expect(this.resultsContainer).toBeVisible();
    
    if (expectedCount !== undefined) {
      await expect(this.resultItems).toHaveCount(expectedCount);
    } else {
      await expect(this.resultItems).toHaveCount({ min: 1 });
    }
  }

  async verifyNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }

  async verifySearchStats() {
    await expect(this.statsContainer).toBeVisible();
    await expect(this.totalDocuments).toBeVisible();
    await expect(this.executionTime).toBeVisible();
  }

  async clickFirstResult() {
    await this.resultItems.first().click();
  }

  async verifyResultContent(index: number, expectedTitle?: string, expectedDescription?: string) {
    const resultItem = this.resultItems.nth(index);
    await expect(resultItem).toBeVisible();
    
    if (expectedTitle) {
      await expect(resultItem.locator('.result-title')).toContainText(expectedTitle);
    }
    
    if (expectedDescription) {
      await expect(resultItem.locator('.result-description')).toContainText(expectedDescription);
    }
  }

  async toggleWeaviateSource() {
    await this.weaviateToggle.click();
    await this.page.waitForTimeout(500); // Wait for toggle effect
  }

  async verifyWeaviateEnabled() {
    await expect(this.searchSource).toContainText('Weaviate');
  }

  async verifyWeaviateDisabled() {
    await expect(this.searchSource).toContainText('PostgreSQL');
  }

  async refreshSearch() {
    await this.refreshButton.click();
    await this.waitForSearchResults();
  }

  async verifyPolishLocalization() {
    await expect(this.polishPlaceholder).toBeVisible();
    
    const polishTexts = [
      'Szukaj w dokumentach HVAC',
      'konserwacja kotła',
      'awaria klimatyzacji'
    ];
    
    for (const text of polishTexts) {
      await expect(this.page.locator(`text=${text}`)).toBeVisible();
    }
  }

  async verifySearchPlaceholder() {
    const placeholder = await this.searchInput.getAttribute('placeholder');
    expect(placeholder).toContain('Szukaj w dokumentach HVAC');
  }

  async verifyHvacSpecificSuggestions() {
    const hvacTerms = [
      'konserwacja kotła',
      'awaria klimatyzacji',
      'serwis pompy ciepła',
      'wymiana filtrów'
    ];
    
    for (const term of hvacTerms) {
      await this.performSearch(term);
      // Verify that search doesn't throw errors for HVAC-specific terms
      await expect(this.errorMessage).not.toBeVisible();
    }
  }

  async verifySearchPerformance() {
    const startTime = Date.now();
    await this.performSearch('klimatyzacja');
    const endTime = Date.now();
    
    const searchTime = endTime - startTime;
    expect(searchTime).toBeLessThan(5000); // Search should complete within 5 seconds
    
    // Verify execution time is displayed
    await expect(this.executionTime).toBeVisible();
  }

  async verifyErrorHandling() {
    // Test with invalid search query
    await this.performSearch('');
    
    if (await this.errorMessage.isVisible()) {
      await expect(this.retryButton).toBeVisible();
    }
  }

  async retryFailedSearch() {
    if (await this.retryButton.isVisible()) {
      await this.retryButton.click();
      await this.waitForSearchResults();
    }
  }

  async verifyLoadingState() {
    await this.searchInput.fill('test query');
    await this.searchButton.click();
    
    // Verify loading indicator appears briefly
    await expect(this.loadingSpinner.or(this.searchingIndicator)).toBeVisible();
  }

  async verifyAdvancedFilters() {
    if (await this.filterButton.isVisible()) {
      await this.filterButton.click();
      await expect(this.advancedFilters).toBeVisible();
    }
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async getSearchResultsCount(): Promise<number> {
    return await this.resultItems.count();
  }

  async getExecutionTime(): Promise<string> {
    return await this.executionTime.textContent() || '';
  }
}
