import { Page, Locator, expect } from '@playwright/test';

export class HvacDashboardPage {
  readonly page: Page;
  
  // Main dashboard elements
  readonly dashboardContainer: Locator;
  readonly dashboardHeader: Locator;
  readonly dashboardContent: Locator;
  
  // Tab navigation
  readonly overviewTab: Locator;
  readonly searchTab: Locator;
  readonly ticketsTab: Locator;
  readonly equipmentTab: Locator;
  readonly analyticsTab: Locator;
  
  // Overview tab elements
  readonly welcomeMessage: Locator;
  readonly kpiCards: Locator;
  readonly recentActivity: Locator;
  readonly quickActions: Locator;
  
  // Search tab elements
  readonly semanticSearchContainer: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly searchStats: Locator;
  
  // Tickets tab elements
  readonly ticketsList: Locator;
  readonly createTicketButton: Locator;
  readonly ticketFilters: Locator;
  readonly ticketCard: Locator;
  
  // Equipment tab elements (placeholder)
  readonly equipmentPlaceholder: Locator;
  readonly equipmentComingSoon: Locator;
  
  // Analytics tab elements (placeholder)
  readonly analyticsPlaceholder: Locator;
  readonly analyticsComingSoon: Locator;
  
  // Error handling elements
  readonly errorBoundary: Locator;
  readonly errorMessage: Locator;
  readonly reportErrorButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main dashboard elements
    this.dashboardContainer = page.locator('[data-testid="hvac-dashboard"]').or(page.locator('.hvac-dashboard'));
    this.dashboardHeader = page.locator('[data-testid="hvac-dashboard-header"]').or(page.locator('.hvac-dashboard-header'));
    this.dashboardContent = page.locator('[data-testid="hvac-dashboard-content"]').or(page.locator('.hvac-dashboard-content'));
    
    // Tab navigation
    this.overviewTab = page.locator('[data-testid="tab-overview"]').or(page.locator('text=Przegląd'));
    this.searchTab = page.locator('[data-testid="tab-search"]').or(page.locator('text=Wyszukiwanie'));
    this.ticketsTab = page.locator('[data-testid="tab-tickets"]').or(page.locator('text=Zgłoszenia'));
    this.equipmentTab = page.locator('[data-testid="tab-equipment"]').or(page.locator('text=Sprzęt'));
    this.analyticsTab = page.locator('[data-testid="tab-analytics"]').or(page.locator('text=Analityka'));
    
    // Overview tab elements
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]').or(page.locator('text=Witaj w systemie HVAC CRM'));
    this.kpiCards = page.locator('[data-testid="kpi-cards"]').or(page.locator('.kpi-card'));
    this.recentActivity = page.locator('[data-testid="recent-activity"]').or(page.locator('.recent-activity'));
    this.quickActions = page.locator('[data-testid="quick-actions"]').or(page.locator('.quick-actions'));
    
    // Search tab elements
    this.semanticSearchContainer = page.locator('[data-testid="semantic-search"]').or(page.locator('.hvac-semantic-search'));
    this.searchInput = page.locator('[data-testid="search-input"]').or(page.locator('input[placeholder*="Szukaj"]'));
    this.searchButton = page.locator('[data-testid="search-button"]').or(page.locator('button:has-text("Szukaj")'));
    this.searchResults = page.locator('[data-testid="search-results"]').or(page.locator('.search-results'));
    this.searchStats = page.locator('[data-testid="search-stats"]').or(page.locator('.search-stats'));
    
    // Tickets tab elements
    this.ticketsList = page.locator('[data-testid="tickets-list"]').or(page.locator('.hvac-service-ticket-list'));
    this.createTicketButton = page.locator('[data-testid="create-ticket"]').or(page.locator('button:has-text("Nowe zgłoszenie")'));
    this.ticketFilters = page.locator('[data-testid="ticket-filters"]').or(page.locator('.ticket-filters'));
    this.ticketCard = page.locator('[data-testid="ticket-card"]').or(page.locator('.ticket-card'));
    
    // Equipment tab elements
    this.equipmentPlaceholder = page.locator('[data-testid="equipment-placeholder"]').or(page.locator('text=Zarządzanie Sprzętem HVAC'));
    this.equipmentComingSoon = page.locator('text=Moduł zarządzania sprzętem będzie dostępny wkrótce');
    
    // Analytics tab elements
    this.analyticsPlaceholder = page.locator('[data-testid="analytics-placeholder"]').or(page.locator('text=Analityka HVAC'));
    this.analyticsComingSoon = page.locator('text=Moduł analityki będzie dostępny wkrótce');
    
    // Error handling elements
    this.errorBoundary = page.locator('[data-testid="error-boundary"]').or(page.locator('.error-boundary'));
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error-message'));
    this.reportErrorButton = page.locator('[data-testid="report-error"]').or(page.locator('button:has-text("Zgłoś błąd")'));
  }

  async navigateTo() {
    await this.page.goto('/hvac');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.dashboardContainer.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async clickTab(tabName: 'overview' | 'search' | 'tickets' | 'equipment' | 'analytics') {
    const tabMap = {
      overview: this.overviewTab,
      search: this.searchTab,
      tickets: this.ticketsTab,
      equipment: this.equipmentTab,
      analytics: this.analyticsTab,
    };
    
    await tabMap[tabName].click();
    await this.page.waitForTimeout(500); // Wait for tab transition
  }

  async verifyTabIsActive(tabName: 'overview' | 'search' | 'tickets' | 'equipment' | 'analytics') {
    const tabMap = {
      overview: this.overviewTab,
      search: this.searchTab,
      tickets: this.ticketsTab,
      equipment: this.equipmentTab,
      analytics: this.analyticsTab,
    };
    
    await expect(tabMap[tabName]).toHaveClass(/active|selected/);
  }

  async verifyOverviewTabContent() {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.kpiCards).toBeVisible();
    await expect(this.recentActivity).toBeVisible();
  }

  async verifySearchTabContent() {
    await expect(this.semanticSearchContainer).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async verifyTicketsTabContent() {
    await expect(this.ticketsList).toBeVisible();
    await expect(this.createTicketButton).toBeVisible();
  }

  async verifyEquipmentTabContent() {
    await expect(this.equipmentPlaceholder).toBeVisible();
    await expect(this.equipmentComingSoon).toBeVisible();
  }

  async verifyAnalyticsTabContent() {
    await expect(this.analyticsPlaceholder).toBeVisible();
    await expect(this.analyticsComingSoon).toBeVisible();
  }

  async performSearch(query: string) {
    await this.clickTab('search');
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async verifySearchResults() {
    await expect(this.searchResults).toBeVisible();
    await expect(this.searchStats).toBeVisible();
  }

  async createNewTicket() {
    await this.clickTab('tickets');
    await this.createTicketButton.click();
  }

  async verifyDashboardLoaded() {
    await expect(this.dashboardContainer).toBeVisible();
    await expect(this.dashboardHeader).toBeVisible();
    await expect(this.dashboardContent).toBeVisible();
  }

  async verifyPolishLocalization() {
    const polishTexts = [
      'Przegląd',
      'Wyszukiwanie', 
      'Zgłoszenia',
      'Sprzęt',
      'Analityka'
    ];
    
    for (const text of polishTexts) {
      await expect(this.page.locator(`text=${text}`)).toBeVisible();
    }
  }

  async verifyDarkTheme() {
    const backgroundColor = await this.page.evaluate(() => {
      const dashboard = document.querySelector('.hvac-dashboard') || document.body;
      return window.getComputedStyle(dashboard).backgroundColor;
    });
    
    // Verify dark theme colors
    expect(backgroundColor).toMatch(/rgb\(18, 18, 18\)|rgb\(30, 30, 30\)|#121212|#1e1e1e/);
  }

  async verifyErrorHandling() {
    if (await this.errorBoundary.isVisible()) {
      await expect(this.errorMessage).toBeVisible();
      await expect(this.reportErrorButton).toBeVisible();
    }
  }

  async reportError() {
    if (await this.reportErrorButton.isVisible()) {
      await this.reportErrorButton.click();
    }
  }
}
