import { test, expect } from '../../lib/fixtures/hvac/hvac-test-fixture';
import { HvacTestUtils } from '../../lib/fixtures/hvac/hvac-test-fixture';

test.describe('HVAC Mobile and Maintenance Tests', () => {
  test.beforeEach(async ({ page, hvacTestData }) => {
    // Mock API responses for consistent testing
    await HvacTestUtils.mockHvacApiResponses(page);
    await HvacTestUtils.mockWeaviateResponses(page);
  });

  test.describe('Mobile Dashboard Functionality', () => {
    test('should display mobile dashboard on mobile viewport', async ({ page, hvacServicePlanner }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      await hvacServicePlanner.verifyMobileDashboard();
      
      // Verify mobile-specific components
      await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
      await expect(hvacServicePlanner.mobileJobCard).toBeVisible();
      await expect(hvacServicePlanner.mobileNavigation).toBeVisible();
    });

    test('should adapt layout for tablet viewport', async ({ page, hvacServicePlanner }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Verify tablet layout
      await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
      await expect(hvacServicePlanner.mobileJobCard).toBeVisible();
    });

    test('should display mobile job cards correctly', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Verify mobile job card content
      await expect(hvacServicePlanner.mobileJobCard).toBeVisible();
      await expect(page.locator('text=Zlecenia mobilne')).toBeVisible();
    });

    test('should show mobile work orders', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      await expect(hvacServicePlanner.mobileWorkOrder).toBeVisible();
      await expect(page.locator('text=Zlecenia pracy')).toBeVisible();
    });

    test('should provide mobile navigation', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      await expect(hvacServicePlanner.mobileNavigation).toBeVisible();
    });

    test('should support touch interactions on mobile', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Test touch interactions
      if (await hvacServicePlanner.mobileJobCard.isVisible()) {
        await hvacServicePlanner.mobileJobCard.first().tap();
        // Verify touch interaction works
      }
    });
  });

  test.describe('Maintenance Dashboard Functionality', () => {
    test('should display maintenance dashboard components', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.verifyMaintenanceDashboard();
      
      // Verify maintenance-specific components
      await expect(hvacServicePlanner.maintenanceDashboard).toBeVisible();
      await expect(hvacServicePlanner.maintenanceCalendar).toBeVisible();
      await expect(hvacServicePlanner.maintenanceChecklist).toBeVisible();
      await expect(hvacServicePlanner.complianceTracker).toBeVisible();
    });

    test('should show maintenance calendar', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      await expect(hvacServicePlanner.maintenanceCalendar).toBeVisible();
      await expect(page.locator('text=Kalendarz konserwacji')).toBeVisible();
    });

    test('should display maintenance checklists', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      await expect(hvacServicePlanner.maintenanceChecklist).toBeVisible();
      await expect(page.locator('text=Lista kontrolna')).toBeVisible();
    });

    test('should show compliance tracking', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      await expect(hvacServicePlanner.complianceTracker).toBeVisible();
      await expect(page.locator('text=Zgodność z przepisami')).toBeVisible();
    });

    test('should display maintenance analytics', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      await expect(hvacServicePlanner.maintenanceAnalytics).toBeVisible();
    });

    test('should handle maintenance scheduling', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Verify maintenance scheduling features
      await expect(page.locator('text=Zaplanuj konserwację')).toBeVisible();
      await expect(page.locator('text=Harmonogram konserwacji')).toBeVisible();
    });
  });

  test.describe('Responsive Design Validation', () => {
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1280, height: 720 },
      { name: 'Desktop Large', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`should work correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page, hvacServicePlanner }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await hvacServicePlanner.navigateTo();
        
        // Verify basic functionality on this viewport
        await expect(hvacServicePlanner.plannerContainer).toBeVisible();
        
        // Test tab navigation
        await hvacServicePlanner.clickTab('mobile');
        await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
        
        await hvacServicePlanner.clickTab('maintenance');
        await expect(hvacServicePlanner.maintenanceDashboard).toBeVisible();
      });
    }

    test('should adapt navigation for small screens', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // Very small mobile
      
      await hvacServicePlanner.navigateTo();
      
      // Verify navigation adapts to small screen
      await expect(hvacServicePlanner.plannerTabs).toBeVisible();
      
      // Tabs might be collapsed or in a different layout
      await hvacServicePlanner.clickTab('mobile');
      await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
    });

    test('should maintain functionality across orientation changes', async ({ page, hvacServicePlanner }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Verify functionality is maintained
      await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
      
      // Test navigation still works
      await hvacServicePlanner.clickTab('maintenance');
      await expect(hvacServicePlanner.maintenanceDashboard).toBeVisible();
    });
  });

  test.describe('Touch and Mobile Interactions', () => {
    test('should support swipe gestures on mobile', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Test swipe gestures if implemented
      if (await hvacServicePlanner.mobileJobCard.isVisible()) {
        const jobCard = hvacServicePlanner.mobileJobCard.first();
        
        // Simulate swipe gesture
        await jobCard.hover();
        await page.mouse.down();
        await page.mouse.move(100, 0); // Swipe right
        await page.mouse.up();
        
        // Verify swipe action (implementation-dependent)
      }
    });

    test('should handle pinch-to-zoom on mobile', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Test pinch-to-zoom behavior
      // Note: Playwright has limited support for multi-touch gestures
      // This would typically be tested with actual mobile devices
    });

    test('should provide appropriate touch targets', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Verify touch targets are appropriately sized (minimum 44px)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();
          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  test.describe('Maintenance Scheduling Features', () => {
    test('should allow scheduling maintenance tasks', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Look for maintenance scheduling features
      const scheduleButton = page.locator('button:has-text("Zaplanuj konserwację")');
      if (await scheduleButton.isVisible()) {
        await scheduleButton.click();
        
        // Verify scheduling interface opens
        await page.waitForTimeout(1000);
      }
    });

    test('should display maintenance history', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Verify maintenance history is displayed
      await expect(page.locator('text=Historia konserwacji')).toBeVisible();
    });

    test('should show upcoming maintenance tasks', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Verify upcoming tasks are displayed
      await expect(page.locator('text=Nadchodzące zadania')).toBeVisible();
    });

    test('should handle maintenance reminders', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Verify maintenance reminders
      await expect(page.locator('text=Przypomnienia')).toBeVisible();
    });
  });

  test.describe('Polish Localization for Mobile and Maintenance', () => {
    test('should display mobile interface in Polish', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      const polishMobileTerms = [
        'Mobilny',
        'Zlecenia mobilne',
        'Zlecenia pracy',
        'Nawigacja mobilna'
      ];
      
      for (const term of polishMobileTerms) {
        await expect(page.locator(`text=${term}`)).toBeVisible();
      }
    });

    test('should display maintenance interface in Polish', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      const polishMaintenanceTerms = [
        'Konserwacja',
        'Kalendarz konserwacji',
        'Lista kontrolna',
        'Zgodność z przepisami',
        'Harmonogram konserwacji',
        'Zaplanuj konserwację'
      ];
      
      for (const term of polishMaintenanceTerms) {
        await expect(page.locator(`text=${term}`)).toBeVisible();
      }
    });

    test('should use Polish date and time formats', async ({ page, hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Verify Polish date format in maintenance calendar
      const dateElements = page.locator('[data-testid*="date"], .date, .calendar-date');
      if (await dateElements.count() > 0) {
        const dateText = await dateElements.first().textContent();
        // Polish date formats typically use dots or slashes
        expect(dateText).toMatch(/\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}/);
      }
    });
  });

  test.describe('Performance on Mobile Devices', () => {
    test('should load quickly on mobile networks', async ({ page, hvacServicePlanner }) => {
      // Simulate slow 3G network
      await page.route('**/*', (route) => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds on slow network
    });

    test('should handle limited memory gracefully', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Verify no memory-related errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('memory')) {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(consoleErrors.length).toBe(0);
    });

    test('should optimize images for mobile', async ({ page, hvacServicePlanner }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Check for responsive images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const src = await img.getAttribute('src');
          // Verify images are optimized (implementation-dependent)
          expect(src).toBeTruthy();
        }
      }
    });
  });
});
