import { Page, Locator, expect } from '@playwright/test';

export class HvacDispatchPanelPage {
  readonly page: Page;
  
  // Main dispatch panel elements
  readonly dispatchPanel: Locator;
  readonly panelHeader: Locator;
  readonly panelTitle: Locator;
  readonly statusChips: Locator;
  
  // Status indicators
  readonly emergencyChip: Locator;
  readonly pendingChip: Locator;
  readonly activeChip: Locator;
  readonly emergencyCount: Locator;
  readonly pendingCount: Locator;
  readonly activeCount: Locator;
  
  // Job lists
  readonly emergencyJobs: Locator;
  readonly pendingJobs: Locator;
  readonly activeJobs: Locator;
  readonly jobCard: Locator;
  readonly jobTitle: Locator;
  readonly jobCustomer: Locator;
  readonly jobPriority: Locator;
  readonly jobStatus: Locator;
  readonly jobLocation: Locator;
  readonly jobTime: Locator;
  
  // Job actions
  readonly assignButton: Locator;
  readonly emergencyDispatchButton: Locator;
  readonly callCustomerButton: Locator;
  readonly viewDetailsButton: Locator;
  readonly reassignButton: Locator;
  
  // Assignment dialog
  readonly assignDialog: Locator;
  readonly technicianSelect: Locator;
  readonly dispatchNotes: Locator;
  readonly confirmAssignButton: Locator;
  readonly cancelAssignButton: Locator;
  
  // Technician list
  readonly availableTechnicians: Locator;
  readonly busyTechnicians: Locator;
  readonly technicianCard: Locator;
  readonly technicianName: Locator;
  readonly technicianStatus: Locator;
  readonly technicianLocation: Locator;
  readonly technicianSkills: Locator;
  
  // Filters and search
  readonly filterPanel: Locator;
  readonly priorityFilter: Locator;
  readonly statusFilter: Locator;
  readonly locationFilter: Locator;
  readonly searchInput: Locator;
  readonly clearFiltersButton: Locator;
  
  // Notifications
  readonly toast: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly warningMessage: Locator;
  
  // Polish localization elements
  readonly polishTitle: Locator;
  readonly polishLabels: Locator;
  readonly polishButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main dispatch panel elements
    this.dispatchPanel = page.locator('[data-testid="hvac-dispatch-panel"]').or(page.locator('.hvac-dispatch-panel'));
    this.panelHeader = page.locator('[data-testid="panel-header"]').or(page.locator('.panel-header'));
    this.panelTitle = page.locator('[data-testid="panel-title"]').or(page.locator('h2:has-text("Panel Dyspozytorski")'));
    this.statusChips = page.locator('[data-testid="status-chips"]').or(page.locator('.p-chip'));
    
    // Status indicators
    this.emergencyChip = page.locator('[data-testid="emergency-chip"]').or(page.locator('.p-chip:has-text("awarii")'));
    this.pendingChip = page.locator('[data-testid="pending-chip"]').or(page.locator('.p-chip:has-text("oczekujących")'));
    this.activeChip = page.locator('[data-testid="active-chip"]').or(page.locator('.p-chip:has-text("aktywnych")'));
    this.emergencyCount = page.locator('[data-testid="emergency-count"]').or(page.locator('.emergency-count'));
    this.pendingCount = page.locator('[data-testid="pending-count"]').or(page.locator('.pending-count'));
    this.activeCount = page.locator('[data-testid="active-count"]').or(page.locator('.active-count'));
    
    // Job lists
    this.emergencyJobs = page.locator('[data-testid="emergency-jobs"]').or(page.locator('.emergency-jobs'));
    this.pendingJobs = page.locator('[data-testid="pending-jobs"]').or(page.locator('.pending-jobs'));
    this.activeJobs = page.locator('[data-testid="active-jobs"]').or(page.locator('.active-jobs'));
    this.jobCard = page.locator('[data-testid="job-card"]').or(page.locator('.job-card'));
    this.jobTitle = page.locator('[data-testid="job-title"]').or(page.locator('.job-title'));
    this.jobCustomer = page.locator('[data-testid="job-customer"]').or(page.locator('.job-customer'));
    this.jobPriority = page.locator('[data-testid="job-priority"]').or(page.locator('.job-priority'));
    this.jobStatus = page.locator('[data-testid="job-status"]').or(page.locator('.job-status'));
    this.jobLocation = page.locator('[data-testid="job-location"]').or(page.locator('.job-location'));
    this.jobTime = page.locator('[data-testid="job-time"]').or(page.locator('.job-time'));
    
    // Job actions
    this.assignButton = page.locator('[data-testid="assign-button"]').or(page.locator('button:has(.pi-user-plus)'));
    this.emergencyDispatchButton = page.locator('[data-testid="emergency-dispatch"]').or(page.locator('button:has(.pi-bolt)'));
    this.callCustomerButton = page.locator('[data-testid="call-customer"]').or(page.locator('button:has(.pi-phone)'));
    this.viewDetailsButton = page.locator('[data-testid="view-details"]').or(page.locator('button:has(.pi-eye)'));
    this.reassignButton = page.locator('[data-testid="reassign-button"]').or(page.locator('button:has-text("Przydziel ponownie")'));
    
    // Assignment dialog
    this.assignDialog = page.locator('[data-testid="assign-dialog"]').or(page.locator('.p-dialog'));
    this.technicianSelect = page.locator('[data-testid="technician-select"]').or(page.locator('.p-dropdown'));
    this.dispatchNotes = page.locator('[data-testid="dispatch-notes"]').or(page.locator('textarea[placeholder*="Uwagi"]'));
    this.confirmAssignButton = page.locator('[data-testid="confirm-assign"]').or(page.locator('button:has-text("Przydziel")'));
    this.cancelAssignButton = page.locator('[data-testid="cancel-assign"]').or(page.locator('button:has-text("Anuluj")'));
    
    // Technician list
    this.availableTechnicians = page.locator('[data-testid="available-technicians"]').or(page.locator('.available-technicians'));
    this.busyTechnicians = page.locator('[data-testid="busy-technicians"]').or(page.locator('.busy-technicians'));
    this.technicianCard = page.locator('[data-testid="technician-card"]').or(page.locator('.technician-card'));
    this.technicianName = page.locator('[data-testid="technician-name"]').or(page.locator('.technician-name'));
    this.technicianStatus = page.locator('[data-testid="technician-status"]').or(page.locator('.technician-status'));
    this.technicianLocation = page.locator('[data-testid="technician-location"]').or(page.locator('.technician-location'));
    this.technicianSkills = page.locator('[data-testid="technician-skills"]').or(page.locator('.technician-skills'));
    
    // Filters and search
    this.filterPanel = page.locator('[data-testid="filter-panel"]').or(page.locator('.filter-panel'));
    this.priorityFilter = page.locator('[data-testid="priority-filter"]').or(page.locator('.priority-filter'));
    this.statusFilter = page.locator('[data-testid="status-filter"]').or(page.locator('.status-filter'));
    this.locationFilter = page.locator('[data-testid="location-filter"]').or(page.locator('.location-filter'));
    this.searchInput = page.locator('[data-testid="search-input"]').or(page.locator('input[placeholder*="Szukaj"]'));
    this.clearFiltersButton = page.locator('[data-testid="clear-filters"]').or(page.locator('button:has-text("Wyczyść filtry")'));
    
    // Notifications
    this.toast = page.locator('[data-testid="toast"]').or(page.locator('.p-toast'));
    this.successMessage = page.locator('[data-testid="success-message"]').or(page.locator('.p-toast-message-success'));
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.p-toast-message-error'));
    this.warningMessage = page.locator('[data-testid="warning-message"]').or(page.locator('.p-toast-message-warn'));
    
    // Polish localization elements
    this.polishTitle = page.locator('text=Panel Dyspozytorski');
    this.polishLabels = page.locator('text=awarii').or(page.locator('text=oczekujących')).or(page.locator('text=aktywnych'));
    this.polishButtons = page.locator('button:has-text("Przydziel")').or(page.locator('button:has-text("Anuluj")'));
  }

  async navigateTo() {
    await this.page.goto('/hvac/dispatch');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.dispatchPanel.waitFor({ state: 'visible', timeout: 10000 });
    await this.panelTitle.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDispatchPanelLoaded() {
    await expect(this.dispatchPanel).toBeVisible();
    await expect(this.panelTitle).toBeVisible();
    await expect(this.statusChips).toBeVisible();
  }

  async verifyStatusChips() {
    await expect(this.emergencyChip).toBeVisible();
    await expect(this.pendingChip).toBeVisible();
    await expect(this.activeChip).toBeVisible();
  }

  async getJobCounts() {
    const emergencyText = await this.emergencyChip.textContent();
    const pendingText = await this.pendingChip.textContent();
    const activeText = await this.activeChip.textContent();
    
    return {
      emergency: parseInt(emergencyText?.match(/\d+/)?.[0] || '0'),
      pending: parseInt(pendingText?.match(/\d+/)?.[0] || '0'),
      active: parseInt(activeText?.match(/\d+/)?.[0] || '0'),
    };
  }

  async assignJobToTechnician(jobIndex: number, technicianName: string, notes?: string) {
    const jobCard = this.jobCard.nth(jobIndex);
    const assignButton = jobCard.locator(this.assignButton);
    
    await assignButton.click();
    await expect(this.assignDialog).toBeVisible();
    
    // Select technician
    await this.technicianSelect.click();
    await this.page.locator(`text=${technicianName}`).click();
    
    // Add notes if provided
    if (notes) {
      await this.dispatchNotes.fill(notes);
    }
    
    // Confirm assignment
    await this.confirmAssignButton.click();
    
    // Wait for success notification
    await expect(this.successMessage).toBeVisible();
  }

  async emergencyDispatch(jobIndex: number) {
    const jobCard = this.jobCard.nth(jobIndex);
    const emergencyButton = jobCard.locator(this.emergencyDispatchButton);
    
    await emergencyButton.click();
    
    // Wait for emergency dispatch confirmation
    await expect(this.successMessage).toBeVisible();
  }

  async callCustomer(jobIndex: number) {
    const jobCard = this.jobCard.nth(jobIndex);
    const callButton = jobCard.locator(this.callCustomerButton);
    
    await callButton.click();
    
    // Verify that phone call is initiated (new tab/window)
    // Note: In real test, this would open a phone app or dialer
  }

  async viewJobDetails(jobIndex: number) {
    const jobCard = this.jobCard.nth(jobIndex);
    const detailsButton = jobCard.locator(this.viewDetailsButton);
    
    await detailsButton.click();
    
    // Wait for details dialog/page to open
    await this.page.waitForTimeout(1000);
  }

  async filterJobsByPriority(priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY') {
    await this.priorityFilter.click();
    await this.page.locator(`text=${priority}`).click();
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }

  async filterJobsByStatus(status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED') {
    await this.statusFilter.click();
    await this.page.locator(`text=${status}`).click();
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }

  async searchJobs(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(500); // Wait for search results
  }

  async clearAllFilters() {
    await this.clearFiltersButton.click();
    await this.page.waitForTimeout(500); // Wait for filters to clear
  }

  async verifyJobCard(jobIndex: number, expectedData: {
    title?: string;
    customer?: string;
    priority?: string;
    status?: string;
    location?: string;
  }) {
    const jobCard = this.jobCard.nth(jobIndex);
    
    if (expectedData.title) {
      await expect(jobCard.locator(this.jobTitle)).toContainText(expectedData.title);
    }
    
    if (expectedData.customer) {
      await expect(jobCard.locator(this.jobCustomer)).toContainText(expectedData.customer);
    }
    
    if (expectedData.priority) {
      await expect(jobCard.locator(this.jobPriority)).toContainText(expectedData.priority);
    }
    
    if (expectedData.status) {
      await expect(jobCard.locator(this.jobStatus)).toContainText(expectedData.status);
    }
    
    if (expectedData.location) {
      await expect(jobCard.locator(this.jobLocation)).toContainText(expectedData.location);
    }
  }

  async verifyTechnicianAvailability() {
    await expect(this.availableTechnicians).toBeVisible();
    await expect(this.technicianCard).toBeVisible();
  }

  async verifyPolishLocalization() {
    await expect(this.polishTitle).toBeVisible();
    
    const polishTexts = [
      'Panel Dyspozytorski',
      'awarii',
      'oczekujących',
      'aktywnych',
      'Przydziel technika',
      'Natychmiastowe przydzielenie',
      'Zadzwoń do klienta'
    ];
    
    for (const text of polishTexts) {
      await expect(this.page.locator(`text=${text}`)).toBeVisible();
    }
  }

  async verifyRealTimeUpdates() {
    const initialCounts = await this.getJobCounts();
    
    // Perform an action that should update counts
    if (initialCounts.pending > 0) {
      await this.assignJobToTechnician(0, 'Jan Kowalski');
      
      // Verify counts updated
      const updatedCounts = await this.getJobCounts();
      expect(updatedCounts.pending).toBeLessThan(initialCounts.pending);
    }
  }

  async verifyNotifications() {
    // Check if toast notifications appear
    if (await this.toast.isVisible()) {
      await expect(this.successMessage.or(this.errorMessage).or(this.warningMessage)).toBeVisible();
    }
  }
}
