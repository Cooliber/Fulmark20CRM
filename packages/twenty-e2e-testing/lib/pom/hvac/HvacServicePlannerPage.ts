import { Page, Locator, expect } from '@playwright/test';

export class HvacServicePlannerPage {
  readonly page: Page;
  
  // Main planner elements
  readonly plannerContainer: Locator;
  readonly plannerHeader: Locator;
  readonly plannerTabs: Locator;
  
  // Tab navigation
  readonly schedulingTab: Locator;
  readonly maintenanceTab: Locator;
  readonly mobileTab: Locator;
  readonly analyticsTab: Locator;
  
  // Scheduling Dashboard elements
  readonly schedulingDashboard: Locator;
  readonly calendarView: Locator;
  readonly technicianTracker: Locator;
  readonly routeOptimizer: Locator;
  readonly jobsList: Locator;
  
  // Calendar elements
  readonly calendarHeader: Locator;
  readonly calendarGrid: Locator;
  readonly calendarEvents: Locator;
  readonly todayButton: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly monthView: Locator;
  readonly weekView: Locator;
  readonly dayView: Locator;
  
  // Technician tracking
  readonly technicianList: Locator;
  readonly technicianCard: Locator;
  readonly technicianStatus: Locator;
  readonly technicianLocation: Locator;
  readonly availableTechnicians: Locator;
  readonly busyTechnicians: Locator;
  
  // Job management
  readonly createJobButton: Locator;
  readonly jobCard: Locator;
  readonly jobTitle: Locator;
  readonly jobPriority: Locator;
  readonly jobStatus: Locator;
  readonly assignJobButton: Locator;
  
  // Maintenance elements
  readonly maintenanceDashboard: Locator;
  readonly maintenanceCalendar: Locator;
  readonly maintenanceChecklist: Locator;
  readonly complianceTracker: Locator;
  readonly maintenanceAnalytics: Locator;
  
  // Mobile elements
  readonly mobileDashboard: Locator;
  readonly mobileJobCard: Locator;
  readonly mobileWorkOrder: Locator;
  readonly mobileNavigation: Locator;
  
  // Polish localization elements
  readonly polishLabels: Locator;
  readonly polishButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main planner elements
    this.plannerContainer = page.locator('[data-testid="hvac-service-planner"]').or(page.locator('.hvac-service-planner'));
    this.plannerHeader = page.locator('[data-testid="planner-header"]').or(page.locator('.planner-header'));
    this.plannerTabs = page.locator('[data-testid="planner-tabs"]').or(page.locator('.planner-tabs'));
    
    // Tab navigation
    this.schedulingTab = page.locator('[data-testid="scheduling-tab"]').or(page.locator('text=Harmonogram'));
    this.maintenanceTab = page.locator('[data-testid="maintenance-tab"]').or(page.locator('text=Konserwacja'));
    this.mobileTab = page.locator('[data-testid="mobile-tab"]').or(page.locator('text=Mobilny'));
    this.analyticsTab = page.locator('[data-testid="analytics-tab"]').or(page.locator('text=Analityka'));
    
    // Scheduling Dashboard elements
    this.schedulingDashboard = page.locator('[data-testid="scheduling-dashboard"]').or(page.locator('.hvac-scheduling-dashboard'));
    this.calendarView = page.locator('[data-testid="calendar-view"]').or(page.locator('.hvac-scheduling-calendar'));
    this.technicianTracker = page.locator('[data-testid="technician-tracker"]').or(page.locator('.hvac-technician-tracker'));
    this.routeOptimizer = page.locator('[data-testid="route-optimizer"]').or(page.locator('.hvac-route-optimizer'));
    this.jobsList = page.locator('[data-testid="jobs-list"]').or(page.locator('.jobs-list'));
    
    // Calendar elements
    this.calendarHeader = page.locator('[data-testid="calendar-header"]').or(page.locator('.p-datepicker-header'));
    this.calendarGrid = page.locator('[data-testid="calendar-grid"]').or(page.locator('.p-datepicker-calendar'));
    this.calendarEvents = page.locator('[data-testid="calendar-events"]').or(page.locator('.calendar-event'));
    this.todayButton = page.locator('[data-testid="today-button"]').or(page.locator('button:has-text("Dziś")'));
    this.prevButton = page.locator('[data-testid="prev-button"]').or(page.locator('.p-datepicker-prev'));
    this.nextButton = page.locator('[data-testid="next-button"]').or(page.locator('.p-datepicker-next'));
    this.monthView = page.locator('[data-testid="month-view"]').or(page.locator('button:has-text("Miesiąc")'));
    this.weekView = page.locator('[data-testid="week-view"]').or(page.locator('button:has-text("Tydzień")'));
    this.dayView = page.locator('[data-testid="day-view"]').or(page.locator('button:has-text("Dzień")'));
    
    // Technician tracking
    this.technicianList = page.locator('[data-testid="technician-list"]').or(page.locator('.technician-list'));
    this.technicianCard = page.locator('[data-testid="technician-card"]').or(page.locator('.technician-card'));
    this.technicianStatus = page.locator('[data-testid="technician-status"]').or(page.locator('.technician-status'));
    this.technicianLocation = page.locator('[data-testid="technician-location"]').or(page.locator('.technician-location'));
    this.availableTechnicians = page.locator('[data-testid="available-technicians"]').or(page.locator('.available-technicians'));
    this.busyTechnicians = page.locator('[data-testid="busy-technicians"]').or(page.locator('.busy-technicians'));
    
    // Job management
    this.createJobButton = page.locator('[data-testid="create-job"]').or(page.locator('button:has-text("Nowe zlecenie")'));
    this.jobCard = page.locator('[data-testid="job-card"]').or(page.locator('.job-card'));
    this.jobTitle = page.locator('[data-testid="job-title"]').or(page.locator('.job-title'));
    this.jobPriority = page.locator('[data-testid="job-priority"]').or(page.locator('.job-priority'));
    this.jobStatus = page.locator('[data-testid="job-status"]').or(page.locator('.job-status'));
    this.assignJobButton = page.locator('[data-testid="assign-job"]').or(page.locator('button:has-text("Przydziel")'));
    
    // Maintenance elements
    this.maintenanceDashboard = page.locator('[data-testid="maintenance-dashboard"]').or(page.locator('.hvac-maintenance-dashboard'));
    this.maintenanceCalendar = page.locator('[data-testid="maintenance-calendar"]').or(page.locator('.hvac-maintenance-calendar'));
    this.maintenanceChecklist = page.locator('[data-testid="maintenance-checklist"]').or(page.locator('.hvac-maintenance-checklist'));
    this.complianceTracker = page.locator('[data-testid="compliance-tracker"]').or(page.locator('.hvac-compliance-tracker'));
    this.maintenanceAnalytics = page.locator('[data-testid="maintenance-analytics"]').or(page.locator('.hvac-maintenance-analytics'));
    
    // Mobile elements
    this.mobileDashboard = page.locator('[data-testid="mobile-dashboard"]').or(page.locator('.hvac-mobile-dashboard'));
    this.mobileJobCard = page.locator('[data-testid="mobile-job-card"]').or(page.locator('.hvac-mobile-job-card'));
    this.mobileWorkOrder = page.locator('[data-testid="mobile-work-order"]').or(page.locator('.hvac-mobile-work-order'));
    this.mobileNavigation = page.locator('[data-testid="mobile-navigation"]').or(page.locator('.hvac-mobile-navigation'));
    
    // Polish localization elements
    this.polishLabels = page.locator('text=Harmonogram').or(page.locator('text=Konserwacja')).or(page.locator('text=Mobilny'));
    this.polishButtons = page.locator('button:has-text("Nowe zlecenie")').or(page.locator('button:has-text("Przydziel")'));
  }

  async navigateTo() {
    await this.page.goto('/hvac/service-planner');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.plannerContainer.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async clickTab(tabName: 'scheduling' | 'maintenance' | 'mobile' | 'analytics') {
    const tabMap = {
      scheduling: this.schedulingTab,
      maintenance: this.maintenanceTab,
      mobile: this.mobileTab,
      analytics: this.analyticsTab,
    };
    
    await tabMap[tabName].click();
    await this.page.waitForTimeout(500); // Wait for tab transition
  }

  async verifySchedulingDashboard() {
    await this.clickTab('scheduling');
    await expect(this.schedulingDashboard).toBeVisible();
    await expect(this.calendarView).toBeVisible();
    await expect(this.technicianTracker).toBeVisible();
  }

  async verifyMaintenanceDashboard() {
    await this.clickTab('maintenance');
    await expect(this.maintenanceDashboard).toBeVisible();
    await expect(this.maintenanceCalendar).toBeVisible();
    await expect(this.maintenanceChecklist).toBeVisible();
  }

  async verifyMobileDashboard() {
    await this.clickTab('mobile');
    await expect(this.mobileDashboard).toBeVisible();
    await expect(this.mobileJobCard).toBeVisible();
  }

  async createNewJob() {
    await this.createJobButton.click();
    // Wait for job creation dialog/form
    await this.page.waitForTimeout(1000);
  }

  async verifyTechnicianList() {
    await expect(this.technicianList).toBeVisible();
    await expect(this.technicianCard).toBeVisible();
    await expect(this.availableTechnicians).toBeVisible();
  }

  async assignJobToTechnician(jobIndex: number, technicianIndex: number) {
    const jobCard = this.jobCard.nth(jobIndex);
    const assignButton = jobCard.locator(this.assignJobButton);
    
    await assignButton.click();
    
    // Select technician from dropdown/list
    const technicianCard = this.technicianCard.nth(technicianIndex);
    await technicianCard.click();
    
    await this.page.waitForTimeout(1000); // Wait for assignment
  }

  async verifyJobAssignment(jobIndex: number, expectedTechnician: string) {
    const jobCard = this.jobCard.nth(jobIndex);
    await expect(jobCard).toContainText(expectedTechnician);
  }

  async navigateCalendar(direction: 'prev' | 'next' | 'today') {
    const buttonMap = {
      prev: this.prevButton,
      next: this.nextButton,
      today: this.todayButton,
    };
    
    await buttonMap[direction].click();
    await this.page.waitForTimeout(500); // Wait for calendar update
  }

  async changeCalendarView(view: 'month' | 'week' | 'day') {
    const viewMap = {
      month: this.monthView,
      week: this.weekView,
      day: this.dayView,
    };
    
    await viewMap[view].click();
    await this.page.waitForTimeout(500); // Wait for view change
  }

  async verifyCalendarEvents() {
    await expect(this.calendarEvents).toBeVisible();
  }

  async verifyPolishLocalization() {
    const polishTexts = [
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
    
    for (const text of polishTexts) {
      await expect(this.page.locator(`text=${text}`)).toBeVisible();
    }
  }

  async verifyResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.plannerContainer).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.plannerContainer).toBeVisible();
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await expect(this.plannerContainer).toBeVisible();
  }

  async verifyJobPriorities() {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
    
    for (const priority of priorities) {
      await expect(this.page.locator(`text=${priority}`).or(this.page.locator(`.priority-${priority.toLowerCase()}`))).toBeVisible();
    }
  }

  async verifyJobStatuses() {
    const statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
    
    for (const status of statuses) {
      await expect(this.page.locator(`text=${status}`).or(this.page.locator(`.status-${status.toLowerCase()}`))).toBeVisible();
    }
  }

  async verifyTechnicianStatuses() {
    const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];
    
    for (const status of statuses) {
      await expect(this.page.locator(`text=${status}`).or(this.page.locator(`.technician-${status.toLowerCase()}`))).toBeVisible();
    }
  }
}
