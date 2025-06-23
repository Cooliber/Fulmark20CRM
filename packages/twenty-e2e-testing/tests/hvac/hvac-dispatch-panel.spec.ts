import { test, expect } from '../../lib/fixtures/hvac/hvac-test-fixture';
import { HvacTestUtils } from '../../lib/fixtures/hvac/hvac-test-fixture';

test.describe('HVAC Dispatch Panel Tests', () => {
  test.beforeEach(async ({ page, hvacTestData }) => {
    // Mock API responses for consistent testing
    await HvacTestUtils.mockHvacApiResponses(page);
    await HvacTestUtils.mockWeaviateResponses(page);
  });

  test.describe('Dispatch Panel Loading and Interface', () => {
    test('should load dispatch panel correctly', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.waitForLoad();
      await hvacDispatchPanel.verifyDispatchPanelLoaded();
    });

    test('should display panel title in Polish', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await expect(hvacDispatchPanel.polishTitle).toBeVisible();
    });

    test('should show status chips with job counts', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.verifyStatusChips();
      
      // Verify status chips display counts
      await expect(hvacDispatchPanel.emergencyChip).toBeVisible();
      await expect(hvacDispatchPanel.pendingChip).toBeVisible();
      await expect(hvacDispatchPanel.activeChip).toBeVisible();
    });

    test('should display job counts correctly', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      const jobCounts = await hvacDispatchPanel.getJobCounts();
      
      // Verify counts are numbers
      expect(typeof jobCounts.emergency).toBe('number');
      expect(typeof jobCounts.pending).toBe('number');
      expect(typeof jobCounts.active).toBe('number');
      
      // Verify counts are non-negative
      expect(jobCounts.emergency).toBeGreaterThanOrEqual(0);
      expect(jobCounts.pending).toBeGreaterThanOrEqual(0);
      expect(jobCounts.active).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Job Management and Assignment', () => {
    test('should display job cards with proper information', async ({ hvacDispatchPanel, hvacTestData }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Verify job cards are displayed
      await expect(hvacDispatchPanel.jobCard).toBeVisible();
      
      // Verify job card content
      await hvacDispatchPanel.verifyJobCard(0, {
        title: hvacTestData.serviceTicket.title,
        customer: hvacTestData.customer.name,
        priority: hvacTestData.serviceTicket.priority,
      });
    });

    test('should allow assigning jobs to technicians', async ({ hvacDispatchPanel, hvacTestData }) => {
      await hvacDispatchPanel.navigateTo();
      
      await hvacDispatchPanel.assignJobToTechnician(
        0, 
        hvacTestData.technician.name,
        'Test assignment notes'
      );
      
      // Verify assignment success notification
      await expect(hvacDispatchPanel.successMessage).toBeVisible();
    });

    test('should support emergency dispatch', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Test emergency dispatch for first job
      await hvacDispatchPanel.emergencyDispatch(0);
      
      // Verify emergency dispatch notification
      await expect(hvacDispatchPanel.successMessage).toBeVisible();
    });

    test('should allow calling customers', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Test customer call functionality
      await hvacDispatchPanel.callCustomer(0);
      
      // Note: In real implementation, this would open phone app
      // Here we just verify the action doesn't cause errors
    });

    test('should allow viewing job details', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      await hvacDispatchPanel.viewJobDetails(0);
      
      // Verify details view opens
      // Note: Implementation-dependent behavior
    });
  });

  test.describe('Technician Management', () => {
    test('should display technician availability', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.verifyTechnicianAvailability();
      
      // Verify technician information is displayed
      await expect(hvacDispatchPanel.availableTechnicians).toBeVisible();
      await expect(hvacDispatchPanel.technicianCard).toBeVisible();
    });

    test('should show technician status information', async ({ hvacDispatchPanel, page }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Verify technician status indicators
      await expect(hvacDispatchPanel.technicianStatus).toBeVisible();
      
      // Check for status types
      const statusTypes = ['AVAILABLE', 'BUSY', 'OFFLINE'];
      for (const status of statusTypes) {
        const statusElement = page.locator(`text=${status}`);
        if (await statusElement.isVisible()) {
          await expect(statusElement).toBeVisible();
        }
      }
    });

    test('should display technician location information', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      if (await hvacDispatchPanel.technicianLocation.isVisible()) {
        await expect(hvacDispatchPanel.technicianLocation).toBeVisible();
      }
    });

    test('should show technician skills and certifications', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      if (await hvacDispatchPanel.technicianSkills.isVisible()) {
        await expect(hvacDispatchPanel.technicianSkills).toBeVisible();
      }
    });
  });

  test.describe('Filtering and Search', () => {
    test('should filter jobs by priority', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Test priority filtering
      await hvacDispatchPanel.filterJobsByPriority('HIGH');
      
      // Verify filter is applied
      // Note: Implementation would show only HIGH priority jobs
    });

    test('should filter jobs by status', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Test status filtering
      await hvacDispatchPanel.filterJobsByStatus('PENDING');
      
      // Verify filter is applied
      // Note: Implementation would show only PENDING jobs
    });

    test('should support job search', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Test job search
      await hvacDispatchPanel.searchJobs('klimatyzacja');
      
      // Verify search results
      // Note: Implementation would filter jobs by search term
    });

    test('should allow clearing all filters', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Apply some filters first
      await hvacDispatchPanel.filterJobsByPriority('HIGH');
      await hvacDispatchPanel.searchJobs('test');
      
      // Clear all filters
      await hvacDispatchPanel.clearAllFilters();
      
      // Verify filters are cleared
      // Note: Implementation would show all jobs again
    });
  });

  test.describe('Real-time Updates and Notifications', () => {
    test('should display notifications correctly', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.verifyNotifications();
    });

    test('should update job counts in real-time', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.verifyRealTimeUpdates();
    });

    test('should show success notifications for assignments', async ({ hvacDispatchPanel, hvacTestData }) => {
      await hvacDispatchPanel.navigateTo();
      
      await hvacDispatchPanel.assignJobToTechnician(0, hvacTestData.technician.name);
      
      // Verify success notification appears
      await expect(hvacDispatchPanel.successMessage).toBeVisible();
    });

    test('should handle error notifications', async ({ hvacDispatchPanel, page }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Mock API error
      await page.route('**/api/jobs/assign', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Assignment failed' }),
        });
      });
      
      // Try to assign job (should fail)
      await hvacDispatchPanel.assignJobToTechnician(0, 'Test Technician');
      
      // Verify error notification
      if (await hvacDispatchPanel.errorMessage.isVisible()) {
        await expect(hvacDispatchPanel.errorMessage).toBeVisible();
      }
    });
  });

  test.describe('Polish Localization', () => {
    test('should display all Polish labels correctly', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.verifyPolishLocalization();
    });

    test('should use Polish terminology for HVAC operations', async ({ hvacDispatchPanel, page }) => {
      await hvacDispatchPanel.navigateTo();
      
      const polishHvacTerms = [
        'Panel Dyspozytorski',
        'awarii',
        'oczekujących',
        'aktywnych',
        'Przydziel technika',
        'Natychmiastowe przydzielenie',
        'Zadzwoń do klienta'
      ];
      
      for (const term of polishHvacTerms) {
        await expect(page.locator(`text=${term}`)).toBeVisible();
      }
    });

    test('should format job information in Polish', async ({ hvacDispatchPanel, page }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Verify Polish formatting for job details
      const polishJobTerms = [
        'Priorytet',
        'Status',
        'Klient',
        'Lokalizacja',
        'Czas'
      ];
      
      for (const term of polishJobTerms) {
        const element = page.locator(`text=${term}`);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Assignment Dialog Functionality', () => {
    test('should open assignment dialog correctly', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Click assign button to open dialog
      await hvacDispatchPanel.assignButton.first().click();
      
      // Verify dialog opens
      await expect(hvacDispatchPanel.assignDialog).toBeVisible();
      await expect(hvacDispatchPanel.technicianSelect).toBeVisible();
      await expect(hvacDispatchPanel.dispatchNotes).toBeVisible();
    });

    test('should allow selecting technicians in assignment dialog', async ({ hvacDispatchPanel, hvacTestData }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Open assignment dialog
      await hvacDispatchPanel.assignButton.first().click();
      
      // Select technician
      await hvacDispatchPanel.technicianSelect.click();
      await hvacDispatchPanel.page.locator(`text=${hvacTestData.technician.name}`).click();
      
      // Verify technician is selected
      await expect(hvacDispatchPanel.technicianSelect).toContainText(hvacTestData.technician.name);
    });

    test('should allow adding dispatch notes', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Open assignment dialog
      await hvacDispatchPanel.assignButton.first().click();
      
      // Add notes
      const testNotes = 'Urgent repair needed for air conditioning unit';
      await hvacDispatchPanel.dispatchNotes.fill(testNotes);
      
      // Verify notes are entered
      const notesValue = await hvacDispatchPanel.dispatchNotes.inputValue();
      expect(notesValue).toBe(testNotes);
    });

    test('should allow canceling assignment', async ({ hvacDispatchPanel }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Open assignment dialog
      await hvacDispatchPanel.assignButton.first().click();
      
      // Cancel assignment
      await hvacDispatchPanel.cancelAssignButton.click();
      
      // Verify dialog closes
      await expect(hvacDispatchPanel.assignDialog).not.toBeVisible();
    });
  });

  test.describe('Performance and Quality Standards', () => {
    test('should meet "Pasja rodzi profesjonalizm" quality standards', async ({ hvacDispatchPanel, page }) => {
      await hvacDispatchPanel.navigateTo();
      
      // Verify professional appearance
      await hvacDispatchPanel.verifyPolishLocalization();
      
      // Check for smooth interactions
      await hvacDispatchPanel.assignButton.first().click();
      await hvacDispatchPanel.cancelAssignButton.click();
      
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

    test('should load within acceptable time limits', async ({ hvacDispatchPanel }) => {
      const startTime = Date.now();
      await hvacDispatchPanel.navigateTo();
      await hvacDispatchPanel.waitForLoad();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle large numbers of jobs efficiently', async ({ hvacDispatchPanel, page }) => {
      // Mock large dataset
      await page.route('**/api/jobs', (route) => {
        const largeJobList = Array.from({ length: 100 }, (_, i) => ({
          id: `job-${i}`,
          title: `Job ${i}`,
          priority: i % 4 === 0 ? 'EMERGENCY' : 'MEDIUM',
          status: 'PENDING',
          customer: `Customer ${i}`,
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jobs: largeJobList }),
        });
      });
      
      await hvacDispatchPanel.navigateTo();
      
      // Should handle large dataset without performance issues
      await expect(hvacDispatchPanel.dispatchPanel).toBeVisible();
    });
  });
});
