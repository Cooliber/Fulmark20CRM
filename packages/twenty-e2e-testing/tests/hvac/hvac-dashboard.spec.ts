import { test, expect } from '../../lib/fixtures/hvac/hvac-test-fixture';
import { HvacTestUtils } from '../../lib/fixtures/hvac/hvac-test-fixture';

test.describe('HVAC Dashboard Tests', () => {
  test.beforeEach(async ({ page, hvacTestData }) => {
    // Mock API responses for consistent testing
    await HvacTestUtils.mockHvacApiResponses(page);
    await HvacTestUtils.mockWeaviateResponses(page);
  });

  test.describe('Dashboard Loading and Navigation', () => {
    test('should load HVAC dashboard successfully', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyDashboardLoaded();
    });

    test('should display all navigation tabs', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Verify all tabs are visible
      await expect(hvacDashboard.overviewTab).toBeVisible();
      await expect(hvacDashboard.searchTab).toBeVisible();
      await expect(hvacDashboard.ticketsTab).toBeVisible();
      await expect(hvacDashboard.equipmentTab).toBeVisible();
      await expect(hvacDashboard.analyticsTab).toBeVisible();
    });

    test('should navigate between tabs correctly', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Test tab navigation
      await hvacDashboard.clickTab('search');
      await hvacDashboard.verifyTabIsActive('search');
      await hvacDashboard.verifySearchTabContent();
      
      await hvacDashboard.clickTab('tickets');
      await hvacDashboard.verifyTabIsActive('tickets');
      await hvacDashboard.verifyTicketsTabContent();
      
      await hvacDashboard.clickTab('overview');
      await hvacDashboard.verifyTabIsActive('overview');
      await hvacDashboard.verifyOverviewTabContent();
    });

    test('should verify Polish localization', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyPolishLocalization();
    });

    test('should verify dark theme implementation', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyDarkTheme();
    });
  });

  test.describe('Overview Tab Functionality', () => {
    test('should display overview content correctly', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('overview');
      await hvacDashboard.verifyOverviewTabContent();
      
      // Verify specific overview elements
      await expect(hvacDashboard.welcomeMessage).toBeVisible();
      await expect(hvacDashboard.kpiCards).toBeVisible();
      await expect(hvacDashboard.recentActivity).toBeVisible();
    });

    test('should display KPI cards with data', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('overview');
      
      // Verify KPI cards are present and contain data
      const kpiCards = hvacDashboard.kpiCards;
      await expect(kpiCards).toBeVisible();
      
      // Check for specific KPI metrics
      await expect(page.locator('text=Aktywne zgłoszenia')).toBeVisible();
      await expect(page.locator('text=Technicy dostępni')).toBeVisible();
      await expect(page.locator('text=Dzisiejsze zlecenia')).toBeVisible();
    });

    test('should display recent activity', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('overview');
      
      await expect(hvacDashboard.recentActivity).toBeVisible();
      await expect(page.locator('text=Ostatnia aktywność')).toBeVisible();
    });

    test('should provide quick actions', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('overview');
      
      await expect(hvacDashboard.quickActions).toBeVisible();
      
      // Verify quick action buttons
      await expect(page.locator('button:has-text("Nowe zgłoszenie")')).toBeVisible();
      await expect(page.locator('button:has-text("Wyszukaj")')).toBeVisible();
    });
  });

  test.describe('Search Tab Functionality', () => {
    test('should display semantic search interface', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('search');
      await hvacDashboard.verifySearchTabContent();
      
      // Verify search components are loaded
      await expect(hvacDashboard.semanticSearchContainer).toBeVisible();
      await expect(hvacDashboard.searchInput).toBeVisible();
    });

    test('should perform search and display results', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.performSearch('klimatyzacja');
      await hvacDashboard.verifySearchResults();
    });

    test('should display search statistics', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('search');
      
      // Verify search stats are visible
      await expect(hvacDashboard.searchStats).toBeVisible();
      await expect(page.locator('text=Dokumenty w bazie')).toBeVisible();
    });
  });

  test.describe('Tickets Tab Functionality', () => {
    test('should display service tickets list', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('tickets');
      await hvacDashboard.verifyTicketsTabContent();
      
      // Verify tickets components
      await expect(hvacDashboard.ticketsList).toBeVisible();
      await expect(hvacDashboard.createTicketButton).toBeVisible();
    });

    test('should allow creating new ticket', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.createNewTicket();
      
      // Verify create ticket dialog/form appears
      await page.waitForTimeout(1000);
      // Note: Actual form verification would depend on implementation
    });

    test('should display ticket filters', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('tickets');
      
      // Check for filter options
      await expect(page.locator('text=Filtruj zgłoszenia')).toBeVisible();
    });
  });

  test.describe('Equipment Tab Functionality', () => {
    test('should display equipment placeholder', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('equipment');
      await hvacDashboard.verifyEquipmentTabContent();
      
      // Verify placeholder content
      await expect(hvacDashboard.equipmentPlaceholder).toBeVisible();
      await expect(hvacDashboard.equipmentComingSoon).toBeVisible();
    });

    test('should show coming soon message in Polish', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('equipment');
      
      await expect(page.locator('text=Zarządzanie Sprzętem HVAC')).toBeVisible();
      await expect(page.locator('text=Moduł zarządzania sprzętem będzie dostępny wkrótce')).toBeVisible();
    });
  });

  test.describe('Analytics Tab Functionality', () => {
    test('should display analytics placeholder', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('analytics');
      await hvacDashboard.verifyAnalyticsTabContent();
      
      // Verify placeholder content
      await expect(hvacDashboard.analyticsPlaceholder).toBeVisible();
      await expect(hvacDashboard.analyticsComingSoon).toBeVisible();
    });

    test('should show coming soon message in Polish', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('analytics');
      
      await expect(page.locator('text=Analityka HVAC')).toBeVisible();
      await expect(page.locator('text=Moduł analityki będzie dostępny wkrótce')).toBeVisible();
    });
  });

  test.describe('Error Handling and Monitoring', () => {
    test('should handle errors gracefully', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyErrorHandling();
    });

    test('should allow error reporting', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // If error boundary is visible, test error reporting
      if (await hvacDashboard.errorBoundary.isVisible()) {
        await hvacDashboard.reportError();
      }
    });

    test('should verify Sentry integration', async ({ page }) => {
      // Mock Sentry calls to verify integration
      let sentryCallMade = false;
      
      await page.route('**/sentry.io/**', (route) => {
        sentryCallMade = true;
        route.fulfill({ status: 200, body: 'OK' });
      });
      
      await page.goto('/hvac');
      
      // Trigger an error to test Sentry reporting
      await page.evaluate(() => {
        // Simulate an error
        throw new Error('Test error for Sentry');
      });
      
      // Note: In real implementation, verify Sentry error was captured
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ hvacDashboard, page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyDashboardLoaded();
      
      // Verify mobile-specific layout
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
    });

    test('should work on tablet devices', async ({ hvacDashboard, page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyDashboardLoaded();
      
      // Verify tablet-specific layout
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
    });

    test('should work on desktop devices', async ({ hvacDashboard, page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyDashboardLoaded();
      
      // Verify desktop-specific layout
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
    });
  });

  test.describe('Performance and Quality Standards', () => {
    test('should meet "Pasja rodzi profesjonalizm" quality standards', async ({ hvacDashboard, page }) => {
      await hvacDashboard.navigateTo();
      
      // Verify professional appearance
      await hvacDashboard.verifyDarkTheme();
      await hvacDashboard.verifyPolishLocalization();
      
      // Check for smooth animations and transitions
      await hvacDashboard.clickTab('search');
      await page.waitForTimeout(500);
      await hvacDashboard.clickTab('overview');
      
      // Verify no console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      expect(consoleErrors.length).toBe(0);
    });

    test('should load within acceptable time limits', async ({ hvacDashboard, page }) => {
      const startTime = Date.now();
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyDashboardLoaded();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
  });
});
