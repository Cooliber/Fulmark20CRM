import { test, expect } from '../../lib/fixtures/hvac/hvac-test-fixture';
import { HvacTestUtils } from '../../lib/fixtures/hvac/hvac-test-fixture';

test.describe('HVAC Service Planner Tests', () => {
  test.beforeEach(async ({ page, hvacTestData }) => {
    // Mock API responses for consistent testing
    await HvacTestUtils.mockHvacApiResponses(page);
    await HvacTestUtils.mockWeaviateResponses(page);
  });

  test.describe('Service Planner Loading and Navigation', () => {
    test('should load service planner interface correctly', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.waitForLoad();
      
      // Verify main planner components
      await expect(hvacServicePlanner.plannerContainer).toBeVisible();
      await expect(hvacServicePlanner.plannerHeader).toBeVisible();
      await expect(hvacServicePlanner.plannerTabs).toBeVisible();
    });

    test('should display all planner tabs', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      
      // Verify all tabs are visible
      await expect(hvacServicePlanner.schedulingTab).toBeVisible();
      await expect(hvacServicePlanner.maintenanceTab).toBeVisible();
      await expect(hvacServicePlanner.mobileTab).toBeVisible();
      await expect(hvacServicePlanner.analyticsTab).toBeVisible();
    });

    test('should navigate between planner tabs correctly', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      
      // Test tab navigation
      await hvacServicePlanner.clickTab('scheduling');
      await hvacServicePlanner.verifySchedulingDashboard();
      
      await hvacServicePlanner.clickTab('maintenance');
      await hvacServicePlanner.verifyMaintenanceDashboard();
      
      await hvacServicePlanner.clickTab('mobile');
      await hvacServicePlanner.verifyMobileDashboard();
    });

    test('should verify Polish localization in service planner', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.verifyPolishLocalization();
    });
  });

  test.describe('Scheduling Dashboard Functionality', () => {
    test('should display scheduling dashboard components', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.verifySchedulingDashboard();
      
      // Verify specific scheduling components
      await expect(hvacServicePlanner.calendarView).toBeVisible();
      await expect(hvacServicePlanner.technicianTracker).toBeVisible();
      await expect(hvacServicePlanner.routeOptimizer).toBeVisible();
    });

    test('should display calendar with proper navigation', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      // Verify calendar components
      await expect(hvacServicePlanner.calendarHeader).toBeVisible();
      await expect(hvacServicePlanner.calendarGrid).toBeVisible();
      
      // Test calendar navigation
      await hvacServicePlanner.navigateCalendar('next');
      await hvacServicePlanner.navigateCalendar('prev');
      await hvacServicePlanner.navigateCalendar('today');
    });

    test('should support different calendar views', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      // Test different calendar views
      await hvacServicePlanner.changeCalendarView('month');
      await hvacServicePlanner.changeCalendarView('week');
      await hvacServicePlanner.changeCalendarView('day');
      await hvacServicePlanner.changeCalendarView('month'); // Back to default
    });

    test('should display calendar events', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      await hvacServicePlanner.verifyCalendarEvents();
    });

    test('should show technician tracking information', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      await hvacServicePlanner.verifyTechnicianList();
      
      // Verify technician information
      await expect(hvacServicePlanner.availableTechnicians).toBeVisible();
      await expect(hvacServicePlanner.technicianCard).toBeVisible();
      await expect(hvacServicePlanner.technicianStatus).toBeVisible();
    });
  });

  test.describe('Job Management', () => {
    test('should allow creating new jobs', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      await hvacServicePlanner.createNewJob();
      
      // Verify job creation interface appears
      await page.waitForTimeout(1000);
      // Note: Actual form verification depends on implementation
    });

    test('should display job cards with proper information', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      // Verify job cards are displayed
      await expect(hvacServicePlanner.jobCard).toBeVisible();
      await expect(hvacServicePlanner.jobTitle).toBeVisible();
      await expect(hvacServicePlanner.jobPriority).toBeVisible();
      await expect(hvacServicePlanner.jobStatus).toBeVisible();
    });

    test('should support job assignment to technicians', async ({ hvacServicePlanner, hvacTestData }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      // Test job assignment
      await hvacServicePlanner.assignJobToTechnician(0, 0);
      await hvacServicePlanner.verifyJobAssignment(0, hvacTestData.technician.name);
    });

    test('should display job priorities correctly', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      await hvacServicePlanner.verifyJobPriorities();
    });

    test('should display job statuses correctly', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      await hvacServicePlanner.verifyJobStatuses();
    });

    test('should display technician statuses correctly', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      await hvacServicePlanner.verifyTechnicianStatuses();
    });
  });

  test.describe('Maintenance Dashboard', () => {
    test('should display maintenance dashboard components', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.verifyMaintenanceDashboard();
      
      // Verify specific maintenance components
      await expect(hvacServicePlanner.maintenanceCalendar).toBeVisible();
      await expect(hvacServicePlanner.maintenanceChecklist).toBeVisible();
      await expect(hvacServicePlanner.complianceTracker).toBeVisible();
    });

    test('should show maintenance analytics', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      await expect(hvacServicePlanner.maintenanceAnalytics).toBeVisible();
    });

    test('should display compliance tracking', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      // Verify compliance elements
      await expect(hvacServicePlanner.complianceTracker).toBeVisible();
      await expect(page.locator('text=Zgodność z przepisami')).toBeVisible();
    });

    test('should show maintenance checklists', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('maintenance');
      
      await expect(hvacServicePlanner.maintenanceChecklist).toBeVisible();
      await expect(page.locator('text=Lista kontrolna')).toBeVisible();
    });
  });

  test.describe('Mobile Dashboard', () => {
    test('should display mobile dashboard components', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.verifyMobileDashboard();
      
      // Verify mobile-specific components
      await expect(hvacServicePlanner.mobileJobCard).toBeVisible();
      await expect(hvacServicePlanner.mobileWorkOrder).toBeVisible();
      await expect(hvacServicePlanner.mobileNavigation).toBeVisible();
    });

    test('should be responsive for mobile devices', async ({ hvacServicePlanner, page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      // Verify mobile layout
      await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
    });

    test('should display mobile job cards', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      await expect(hvacServicePlanner.mobileJobCard).toBeVisible();
      await expect(page.locator('text=Zlecenia mobilne')).toBeVisible();
    });

    test('should show mobile work orders', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('mobile');
      
      await expect(hvacServicePlanner.mobileWorkOrder).toBeVisible();
      await expect(page.locator('text=Zlecenia pracy')).toBeVisible();
    });
  });

  test.describe('Responsive Design and Accessibility', () => {
    test('should work correctly on different screen sizes', async ({ hvacServicePlanner }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.verifyResponsiveDesign();
    });

    test('should maintain functionality on mobile devices', async ({ hvacServicePlanner, page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await hvacServicePlanner.navigateTo();
      
      // Verify mobile functionality
      await hvacServicePlanner.clickTab('scheduling');
      await expect(hvacServicePlanner.schedulingDashboard).toBeVisible();
      
      await hvacServicePlanner.clickTab('mobile');
      await expect(hvacServicePlanner.mobileDashboard).toBeVisible();
    });

    test('should work on tablet devices', async ({ hvacServicePlanner, page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await hvacServicePlanner.navigateTo();
      
      // Verify tablet functionality
      await hvacServicePlanner.clickTab('scheduling');
      await expect(hvacServicePlanner.schedulingDashboard).toBeVisible();
    });

    test('should support keyboard navigation', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      
      // Test keyboard navigation between tabs
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verify tab navigation works with keyboard
      await expect(hvacServicePlanner.plannerContainer).toBeVisible();
    });
  });

  test.describe('Polish Localization and HVAC Domain', () => {
    test('should display all Polish labels correctly', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      
      const polishLabels = [
        'Harmonogram',
        'Konserwacja',
        'Mobilny',
        'Analityka',
        'Nowe zlecenie',
        'Przydziel',
        'Dziś',
        'Miesiąc',
        'Tydzień',
        'Dzień'
      ];
      
      for (const label of polishLabels) {
        await expect(page.locator(`text=${label}`)).toBeVisible();
      }
    });

    test('should handle Polish HVAC terminology', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      const hvacTerms = [
        'Klimatyzacja',
        'Ogrzewanie',
        'Wentylacja',
        'Konserwacja',
        'Serwis',
        'Technik',
        'Zlecenie'
      ];
      
      for (const term of hvacTerms) {
        await expect(page.locator(`text=${term}`)).toBeVisible();
      }
    });

    test('should format dates and times in Polish locale', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.clickTab('scheduling');
      
      // Verify Polish date format (DD.MM.YYYY or similar)
      const dateElements = page.locator('[data-testid*="date"], .date, .calendar-date');
      if (await dateElements.count() > 0) {
        const dateText = await dateElements.first().textContent();
        // Polish date formats typically use dots or slashes
        expect(dateText).toMatch(/\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}/);
      }
    });
  });

  test.describe('Performance and Quality Standards', () => {
    test('should meet "Pasja rodzi profesjonalizm" quality standards', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      
      // Verify professional appearance and functionality
      await hvacServicePlanner.verifyPolishLocalization();
      
      // Check for smooth transitions between tabs
      await hvacServicePlanner.clickTab('scheduling');
      await page.waitForTimeout(300);
      await hvacServicePlanner.clickTab('maintenance');
      await page.waitForTimeout(300);
      await hvacServicePlanner.clickTab('mobile');
      
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

    test('should load within acceptable time limits', async ({ hvacServicePlanner }) => {
      const startTime = Date.now();
      await hvacServicePlanner.navigateTo();
      await hvacServicePlanner.waitForLoad();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle data loading gracefully', async ({ hvacServicePlanner, page }) => {
      await hvacServicePlanner.navigateTo();
      
      // Mock slow API response
      await page.route('**/api/technicians', (route) => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ technicians: [] }),
          });
        }, 2000);
      });
      
      await hvacServicePlanner.clickTab('scheduling');
      
      // Should show loading state or handle gracefully
      await expect(hvacServicePlanner.technicianTracker).toBeVisible();
    });
  });
});
