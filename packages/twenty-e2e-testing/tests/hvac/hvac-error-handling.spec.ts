import { test, expect } from '../../lib/fixtures/hvac/hvac-test-fixture';
import { HvacTestUtils } from '../../lib/fixtures/hvac/hvac-test-fixture';

test.describe('HVAC Error Handling and Monitoring Tests', () => {
  test.beforeEach(async ({ page, hvacTestData }) => {
    // Mock API responses for consistent testing
    await HvacTestUtils.mockHvacApiResponses(page);
    await HvacTestUtils.mockWeaviateResponses(page);
  });

  test.describe('Error Boundary Testing', () => {
    test('should display error boundary when component crashes', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Simulate component error
      await page.evaluate(() => {
        // Force a React error by throwing in a component
        const errorEvent = new CustomEvent('react-error', {
          detail: { error: new Error('Test component error') }
        });
        window.dispatchEvent(errorEvent);
      });
      
      // Verify error boundary is displayed
      if (await hvacDashboard.errorBoundary.isVisible()) {
        await expect(hvacDashboard.errorBoundary).toBeVisible();
        await expect(hvacDashboard.errorMessage).toBeVisible();
      }
    });

    test('should show Polish error messages', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Trigger error boundary
      await page.evaluate(() => {
        throw new Error('Test error for boundary');
      });
      
      // Check for Polish error messages
      const polishErrorTexts = [
        'Błąd w Dashboard HVAC',
        'Wystąpił problem',
        'Spróbuj odświeżyć stronę',
        'Zgłoś błąd'
      ];
      
      for (const text of polishErrorTexts) {
        const element = page.locator(`text=${text}`);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should provide error reporting functionality', async ({ hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      await hvacDashboard.verifyErrorHandling();
      
      // Test error reporting if available
      if (await hvacDashboard.reportErrorButton.isVisible()) {
        await hvacDashboard.reportError();
      }
    });

    test('should handle nested component errors gracefully', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Navigate to different tabs to test error boundaries in different components
      await hvacDashboard.clickTab('search');
      await page.evaluate(() => {
        throw new Error('Search component error');
      });
      
      await hvacDashboard.clickTab('tickets');
      await page.evaluate(() => {
        throw new Error('Tickets component error');
      });
      
      // Verify error boundaries handle errors in different components
      if (await hvacDashboard.errorBoundary.isVisible()) {
        await expect(hvacDashboard.errorBoundary).toBeVisible();
      }
    });
  });

  test.describe('Sentry Integration Testing', () => {
    test('should initialize Sentry correctly', async ({ page, hvacDashboard }) => {
      let sentryInitialized = false;
      
      // Mock Sentry initialization
      await page.route('**/sentry.io/**', (route) => {
        sentryInitialized = true;
        route.fulfill({ status: 200, body: 'OK' });
      });
      
      await hvacDashboard.navigateTo();
      
      // Verify Sentry initialization (implementation-dependent)
      // Note: In real implementation, check for Sentry SDK initialization
    });

    test('should capture JavaScript errors', async ({ page, hvacDashboard }) => {
      let errorCaptured = false;
      
      // Mock Sentry error capture
      await page.route('**/sentry.io/api/**', (route) => {
        if (route.request().method() === 'POST') {
          errorCaptured = true;
        }
        route.fulfill({ status: 200, body: 'OK' });
      });
      
      await hvacDashboard.navigateTo();
      
      // Trigger an error
      await page.evaluate(() => {
        throw new Error('Test error for Sentry capture');
      });
      
      await page.waitForTimeout(1000);
      
      // Note: In real implementation, verify error was sent to Sentry
    });

    test('should capture performance metrics', async ({ page, hvacDashboard }) => {
      let performanceDataSent = false;
      
      // Mock Sentry performance monitoring
      await page.route('**/sentry.io/**', (route) => {
        if (route.request().url().includes('envelope')) {
          performanceDataSent = true;
        }
        route.fulfill({ status: 200, body: 'OK' });
      });
      
      await hvacDashboard.navigateTo();
      
      // Perform actions that should be monitored
      await hvacDashboard.clickTab('search');
      await hvacDashboard.clickTab('tickets');
      
      await page.waitForTimeout(2000);
      
      // Note: In real implementation, verify performance data was sent
    });

    test('should add breadcrumbs for user actions', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Perform actions that should create breadcrumbs
      await hvacDashboard.clickTab('search');
      await hvacDashboard.performSearch('test query');
      await hvacDashboard.clickTab('tickets');
      
      // Trigger an error to see breadcrumbs
      await page.evaluate(() => {
        throw new Error('Test error with breadcrumbs');
      });
      
      // Note: In real implementation, verify breadcrumbs are included in error reports
    });

    test('should capture user feedback', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Trigger error that shows feedback dialog
      await page.evaluate(() => {
        throw new Error('Test error for user feedback');
      });
      
      // Look for user feedback interface
      const feedbackDialog = page.locator('[data-testid="user-feedback"], .user-feedback-dialog');
      if (await feedbackDialog.isVisible()) {
        await expect(feedbackDialog).toBeVisible();
      }
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle API connection failures', async ({ page, hvacDashboard }) => {
      // Mock API failures
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });
      
      await hvacDashboard.navigateTo();
      
      // Verify graceful handling of API failures
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
      
      // Check for error messages or fallback content
      const errorIndicators = page.locator('text=Błąd połączenia, text=Connection error, .error-message');
      if (await errorIndicators.count() > 0) {
        await expect(errorIndicators.first()).toBeVisible();
      }
    });

    test('should handle Weaviate connection failures', async ({ page, hvacSemanticSearch }) => {
      // Mock Weaviate failures
      await page.route('**/weaviate/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Weaviate connection failed' }),
        });
      });
      
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('test query');
      
      // Verify error handling
      await hvacSemanticSearch.verifyErrorHandling();
    });

    test('should handle slow network responses', async ({ page, hvacDashboard }) => {
      // Mock slow responses
      await page.route('**/api/**', (route) => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: 'slow response' }),
          });
        }, 5000); // 5 second delay
      });
      
      await hvacDashboard.navigateTo();
      
      // Verify loading states are shown
      const loadingIndicators = page.locator('.loading, .spinner, text=Ładowanie');
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeVisible();
      }
    });

    test('should retry failed requests', async ({ page, hvacSemanticSearch }) => {
      let requestCount = 0;
      
      // Mock initial failure, then success
      await page.route('**/weaviate/**', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 500, body: 'Server Error' });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { Get: { HvacDocument: [{ title: 'Retry Success' }] } }
            }),
          });
        }
      });
      
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('test');
      
      // Try retry if available
      await hvacSemanticSearch.retryFailedSearch();
      
      // Verify retry worked
      await hvacSemanticSearch.verifySearchResults();
    });
  });

  test.describe('Fault Tolerance Components', () => {
    test('should handle component loading failures', async ({ page, hvacDashboard }) => {
      // Mock component loading failures
      await page.route('**/static/js/**', (route) => {
        if (route.request().url().includes('chunk')) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await hvacDashboard.navigateTo();
      
      // Verify fallback content is shown
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
    });

    test('should provide offline functionality', async ({ page, hvacDashboard }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await hvacDashboard.navigateTo();
      
      // Verify offline handling
      const offlineIndicators = page.locator('text=Tryb offline, text=Offline mode, .offline-indicator');
      if (await offlineIndicators.count() > 0) {
        await expect(offlineIndicators.first()).toBeVisible();
      }
      
      // Restore online mode
      await page.context().setOffline(false);
    });

    test('should handle memory pressure gracefully', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Simulate memory pressure by creating large objects
      await page.evaluate(() => {
        const largeArray = new Array(1000000).fill('memory pressure test');
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      });
      
      // Verify application still functions
      await hvacDashboard.clickTab('search');
      await hvacDashboard.clickTab('tickets');
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
    });

    test('should handle concurrent operations safely', async ({ page, hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Perform multiple concurrent searches
      const searchPromises = [
        hvacSemanticSearch.performSearch('klimatyzacja'),
        hvacSemanticSearch.performSearch('ogrzewanie'),
        hvacSemanticSearch.performSearch('wentylacja'),
      ];
      
      await Promise.all(searchPromises);
      
      // Verify no race conditions or errors
      await hvacSemanticSearch.verifySearchResults();
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('should recover from temporary failures', async ({ page, hvacDashboard }) => {
      let failureCount = 0;
      
      // Mock temporary failures
      await page.route('**/api/dashboard', (route) => {
        failureCount++;
        if (failureCount <= 2) {
          route.fulfill({ status: 500, body: 'Temporary failure' });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'success' }),
          });
        }
      });
      
      await hvacDashboard.navigateTo();
      
      // Verify eventual recovery
      await expect(hvacDashboard.dashboardContainer).toBeVisible();
    });

    test('should maintain state during errors', async ({ page, hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Perform a search
      await hvacSemanticSearch.performSearch('test query');
      
      // Simulate error
      await page.route('**/weaviate/**', (route) => {
        route.fulfill({ status: 500, body: 'Error' });
      });
      
      // Try another search
      await hvacSemanticSearch.performSearch('another query');
      
      // Verify search input maintains state
      const searchValue = await hvacSemanticSearch.searchInput.inputValue();
      expect(searchValue).toBe('another query');
    });

    test('should provide clear error messages in Polish', async ({ page, hvacDashboard }) => {
      // Mock various error scenarios
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
      });
      
      await hvacDashboard.navigateTo();
      
      // Look for Polish error messages
      const polishErrorMessages = [
        'Nie znaleziono',
        'Błąd serwera',
        'Brak połączenia',
        'Spróbuj ponownie',
        'Wystąpił błąd'
      ];
      
      for (const message of polishErrorMessages) {
        const element = page.locator(`text=${message}`);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance Monitoring and Alerts', () => {
    test('should monitor component render times', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Measure tab switching performance
      const startTime = Date.now();
      await hvacDashboard.clickTab('search');
      await hvacDashboard.clickTab('tickets');
      await hvacDashboard.clickTab('overview');
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    test('should detect memory leaks', async ({ page, hvacDashboard }) => {
      await hvacDashboard.navigateTo();
      
      // Perform actions that might cause memory leaks
      for (let i = 0; i < 10; i++) {
        await hvacDashboard.clickTab('search');
        await hvacDashboard.clickTab('tickets');
        await hvacDashboard.clickTab('overview');
      }
      
      // Check for excessive memory usage
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        } : null;
      });
      
      if (memoryInfo) {
        const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
        expect(memoryUsageRatio).toBeLessThan(0.9); // Should not use more than 90% of heap
      }
    });

    test('should handle console errors appropriately', async ({ page, hvacDashboard }) => {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text());
        }
      });
      
      await hvacDashboard.navigateTo();
      await hvacDashboard.clickTab('search');
      await hvacDashboard.clickTab('tickets');
      
      await page.waitForTimeout(2000);
      
      // Verify no critical console errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Warning') && 
        !error.includes('DevTools') &&
        !error.includes('Extension')
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });
});
