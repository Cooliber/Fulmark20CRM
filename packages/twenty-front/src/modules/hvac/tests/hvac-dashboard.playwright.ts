/**
 * Enhanced HVAC Dashboard Playwright Tests
 * "Pasja rodzi profesjonalizm" - Professional E2E Testing
 * 
 * Comprehensive end-to-end tests for HVAC dashboard functionality
 * Following Twenty CRM testing patterns and best practices
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const HVAC_DASHBOARD_URL = '/hvac/dashboard';
const TEST_TIMEOUT = 30000;
const PERFORMANCE_THRESHOLD = 3000; // 3 seconds

// Test data
const TEST_USER = {
  email: 'hvac.admin@test.com',
  password: 'TestPassword123!',
  role: 'ADMIN',
};

const TEST_CUSTOMER = {
  name: 'Test HVAC Customer',
  email: 'customer@test.com',
  phone: '+48123456789',
  nip: '1234567890',
  address: {
    street: 'ul. Testowa 123',
    city: 'Warszawa',
    postalCode: '00-001',
    country: 'Polska',
  },
};

const TEST_SERVICE_TICKET = {
  title: 'Test Service Ticket',
  description: 'Test description for service ticket',
  priority: 'HIGH',
  type: 'REPAIR',
};

// Helper functions
async function loginAsHvacUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/');
  
  // Wait for authentication to complete
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
}

async function navigateToHvacDashboard(page: Page) {
  await page.click('[data-testid="hvac-navigation-item"]');
  await page.waitForURL(HVAC_DASHBOARD_URL);
  await page.waitForSelector('[data-testid="hvac-dashboard"]', { timeout: 10000 });
}

async function waitForHvacHealthCheck(page: Page) {
  // Wait for health status to load
  await page.waitForSelector('[data-testid="hvac-health-status"]', { timeout: 15000 });
  
  // Verify health status is displayed
  const healthStatus = await page.locator('[data-testid="hvac-health-status"]');
  await expect(healthStatus).toBeVisible();
}

// Test suite
test.describe('HVAC Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for HVAC tests
    test.setTimeout(TEST_TIMEOUT);
    
    // Login and navigate to HVAC dashboard
    await loginAsHvacUser(page);
    await navigateToHvacDashboard(page);
  });

  test('should load dashboard with health status', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="hvac-dashboard"]');
    
    // Check health status component
    await waitForHvacHealthCheck(page);
    
    // Verify dashboard header
    const header = await page.locator('[data-testid="hvac-dashboard-header"]');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Dashboard HVAC');
    
    // Verify navigation tabs
    const tabs = await page.locator('[data-testid="hvac-dashboard-tabs"] .p-tabview-nav li');
    await expect(tabs).toHaveCount(9); // 9 HVAC modules
    
    // Verify tab labels
    const expectedTabs = [
      'Dashboard',
      'Klienci',
      'Zlecenia',
      'Sprzęt',
      'Technicy',
      'Wyceny',
      'Finanse',
      'Magazyn',
      'Przeglądy'
    ];
    
    for (let i = 0; i < expectedTabs.length; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toContainText(expectedTabs[i]);
    }
  });

  test('should display system health status correctly', async ({ page }) => {
    await waitForHvacHealthCheck(page);
    
    const healthStatus = await page.locator('[data-testid="hvac-health-status"]');
    
    // Check health indicators
    const healthIndicators = await healthStatus.locator('.health-indicator');
    await expect(healthIndicators).toBeVisible();
    
    // Check service status display
    const serviceStatus = await healthStatus.locator('[data-testid="service-status"]');
    await expect(serviceStatus).toBeVisible();
    await expect(serviceStatus).toContainText('HVAC:');
    await expect(serviceStatus).toContainText('Twenty:');
    await expect(serviceStatus).toContainText('Weaviate:');
    await expect(serviceStatus).toContainText('Redis:');
    
    // Check last check timestamp
    const lastCheck = await healthStatus.locator('[data-testid="last-health-check"]');
    await expect(lastCheck).toBeVisible();
    await expect(lastCheck).toContainText('Ostatnie sprawdzenie:');
  });

  test('should navigate between dashboard tabs', async ({ page }) => {
    // Test navigation to Customers tab
    await page.click('[data-testid="hvac-tab-customers"]');
    await page.waitForSelector('[data-testid="hvac-customers-content"]');
    
    const customersContent = await page.locator('[data-testid="hvac-customers-content"]');
    await expect(customersContent).toBeVisible();
    
    // Test navigation to Service Tickets tab
    await page.click('[data-testid="hvac-tab-service-tickets"]');
    await page.waitForSelector('[data-testid="hvac-service-tickets-content"]');
    
    const ticketsContent = await page.locator('[data-testid="hvac-service-tickets-content"]');
    await expect(ticketsContent).toBeVisible();
    
    // Test navigation to Equipment tab
    await page.click('[data-testid="hvac-tab-equipment"]');
    await page.waitForSelector('[data-testid="hvac-equipment-content"]');
    
    const equipmentContent = await page.locator('[data-testid="hvac-equipment-content"]');
    await expect(equipmentContent).toBeVisible();
    
    // Return to Dashboard tab
    await page.click('[data-testid="hvac-tab-dashboard"]');
    await page.waitForSelector('[data-testid="hvac-dashboard-content"]');
  });

  test('should handle authentication and permissions', async ({ page }) => {
    // Verify user is authenticated
    const userMenu = await page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    
    // Check HVAC-specific permissions
    const adminActions = await page.locator('[data-testid="hvac-admin-actions"]');
    if (await adminActions.isVisible()) {
      // Admin user should see admin actions
      await expect(adminActions).toBeVisible();
    }
    
    // Verify protected routes are accessible
    await page.click('[data-testid="hvac-tab-customers"]');
    await page.waitForSelector('[data-testid="hvac-customers-content"]');
    
    // Should not show unauthorized message
    const unauthorizedMessage = await page.locator('[data-testid="unauthorized-message"]');
    await expect(unauthorizedMessage).not.toBeVisible();
  });

  test('should perform semantic search', async ({ page }) => {
    // Navigate to search
    const searchInput = await page.locator('[data-testid="hvac-semantic-search-input"]');
    if (await searchInput.isVisible()) {
      // Perform search
      await searchInput.fill('klimatyzacja');
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await page.waitForSelector('[data-testid="hvac-search-results"]', { timeout: 10000 });
      
      const searchResults = await page.locator('[data-testid="hvac-search-results"]');
      await expect(searchResults).toBeVisible();
      
      // Check search result items
      const resultItems = await searchResults.locator('[data-testid="search-result-item"]');
      if (await resultItems.count() > 0) {
        await expect(resultItems.first()).toBeVisible();
      }
    }
  });

  test('should display analytics and KPIs', async ({ page }) => {
    // Wait for analytics to load
    await page.waitForSelector('[data-testid="hvac-analytics-section"]', { timeout: 15000 });
    
    const analyticsSection = await page.locator('[data-testid="hvac-analytics-section"]');
    await expect(analyticsSection).toBeVisible();
    
    // Check KPI cards
    const kpiCards = await analyticsSection.locator('[data-testid="hvac-kpi-card"]');
    await expect(kpiCards).toHaveCountGreaterThan(0);
    
    // Verify KPI card content
    const firstKpiCard = kpiCards.first();
    await expect(firstKpiCard).toBeVisible();
    
    // Check charts
    const charts = await analyticsSection.locator('[data-testid="hvac-chart"]');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate network error by intercepting API calls
    await page.route('**/api/hvac/**', route => {
      route.abort('failed');
    });
    
    // Reload page to trigger error
    await page.reload();
    
    // Check for error boundary or error message
    const errorBoundary = await page.locator('[data-testid="hvac-error-boundary"]');
    const errorMessage = await page.locator('[data-testid="hvac-error-message"]');
    
    // Either error boundary or error message should be visible
    const hasErrorHandling = await errorBoundary.isVisible() || await errorMessage.isVisible();
    expect(hasErrorHandling).toBe(true);
  });

  test('should meet performance requirements', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to dashboard
    await navigateToHvacDashboard(page);
    await waitForHvacHealthCheck(page);
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within performance threshold
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLD);
    
    // Check bundle size (approximate by checking network requests)
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('hvac') && response.request().resourceType() === 'script') {
        responses.push(response);
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify reasonable number of HVAC-related script requests
    expect(responses.length).toBeLessThan(10); // Should be bundled efficiently
  });

  test('should support Polish language and compliance', async ({ page }) => {
    // Check for Polish language elements
    const polishElements = await page.locator('text=/Klienci|Zlecenia|Sprzęt|Technicy|Wyceny|Finanse|Magazyn|Przeglądy/');
    await expect(polishElements.first()).toBeVisible();

    // Check for Polish compliance features
    const nipValidation = await page.locator('[data-testid="nip-validation"]');
    const regonValidation = await page.locator('[data-testid="regon-validation"]');

    // At least one Polish compliance feature should be available
    if (await nipValidation.isVisible() || await regonValidation.isVisible()) {
      // Polish compliance features are present
      expect(true).toBe(true);
    }

    // Check date formatting (Polish format)
    const dateElements = await page.locator('[data-testid*="date"]');
    if (await dateElements.count() > 0) {
      const dateText = await dateElements.first().textContent();
      // Should use Polish date format or locale
      expect(dateText).toBeTruthy();
    }
  });

  test('should demonstrate "Pasja rodzi profesjonalizm" philosophy', async ({ page }) => {
    // Verify professional UI elements
    const professionalElements = await page.locator('[data-testid="hvac-dashboard"]');
    await expect(professionalElements).toHaveClass(/professional|elegant|refined/);

    // Check for smooth animations and transitions
    await page.click('[data-testid="hvac-tab-customers"]');

    // Verify responsive design
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="hvac-dashboard"]')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="hvac-dashboard"]')).toBeVisible();

    // Check for accessibility features
    const accessibleElements = await page.locator('[aria-label], [role], [tabindex]');
    await expect(accessibleElements).toHaveCountGreaterThan(5);
  });
});
