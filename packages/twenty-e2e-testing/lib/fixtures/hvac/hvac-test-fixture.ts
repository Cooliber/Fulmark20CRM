import { test as base, expect } from '@playwright/test';
import { HvacDashboardPage } from '../../pom/hvac/HvacDashboardPage';
import { HvacSemanticSearchPage } from '../../pom/hvac/HvacSemanticSearchPage';
import { HvacServicePlannerPage } from '../../pom/hvac/HvacServicePlannerPage';
import { HvacDispatchPanelPage } from '../../pom/hvac/HvacDispatchPanelPage';

// HVAC Test Data
export interface HvacTestData {
  customer: {
    name: string;
    nip: string;
    regon: string;
    address: string;
    phone: string;
    email: string;
  };
  serviceTicket: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
    type: 'MAINTENANCE' | 'REPAIR' | 'INSTALLATION' | 'INSPECTION';
  };
  equipment: {
    name: string;
    type: 'HEATING' | 'COOLING' | 'VENTILATION' | 'AIR_CONDITIONING';
    manufacturer: string;
    model: string;
    serialNumber: string;
  };
  technician: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    certifications: string[];
  };
}

export const hvacTestData: HvacTestData = {
  customer: {
    name: 'Fulmark HVAC Test Sp. z o.o.',
    nip: '1234567890',
    regon: '123456789',
    address: 'ul. Testowa 123, 00-001 Warszawa',
    phone: '+48 123 456 789',
    email: 'test@fulmark.pl',
  },
  serviceTicket: {
    title: 'Konserwacja klimatyzacji biurowej',
    description: 'Rutynowa konserwacja systemu klimatyzacji w biurze głównym. Wymiana filtrów, sprawdzenie poziomu czynnika chłodniczego.',
    priority: 'MEDIUM',
    type: 'MAINTENANCE',
  },
  equipment: {
    name: 'Klimatyzacja Główna - Biuro',
    type: 'AIR_CONDITIONING',
    manufacturer: 'Daikin',
    model: 'VRV IV-S',
    serialNumber: 'DAI-2024-001',
  },
  technician: {
    name: 'Jan Kowalski',
    email: 'jan.kowalski@fulmark.pl',
    phone: '+48 987 654 321',
    skills: ['MAINTENANCE', 'AIR_CONDITIONING', 'HEATING'],
    certifications: ['EPA_CERTIFIED', 'HVAC_EXCELLENCE'],
  },
};

// Extended test fixture with HVAC page objects
type HvacTestFixtures = {
  hvacDashboard: HvacDashboardPage;
  hvacSemanticSearch: HvacSemanticSearchPage;
  hvacServicePlanner: HvacServicePlannerPage;
  hvacDispatchPanel: HvacDispatchPanelPage;
  hvacTestData: HvacTestData;
};

export const test = base.extend<HvacTestFixtures>({
  hvacDashboard: async ({ page }, use) => {
    const hvacDashboard = new HvacDashboardPage(page);
    await use(hvacDashboard);
  },

  hvacSemanticSearch: async ({ page }, use) => {
    const hvacSemanticSearch = new HvacSemanticSearchPage(page);
    await use(hvacSemanticSearch);
  },

  hvacServicePlanner: async ({ page }, use) => {
    const hvacServicePlanner = new HvacServicePlannerPage(page);
    await use(hvacServicePlanner);
  },

  hvacDispatchPanel: async ({ page }, use) => {
    const hvacDispatchPanel = new HvacDispatchPanelPage(page);
    await use(hvacDispatchPanel);
  },

  hvacTestData: async ({}, use) => {
    await use(hvacTestData);
  },
});

export { expect };

// HVAC-specific test utilities
export class HvacTestUtils {
  static async waitForHvacComponentLoad(page: any, componentSelector: string, timeout = 10000) {
    await page.waitForSelector(componentSelector, { timeout });
    await page.waitForLoadState('networkidle');
  }

  static async verifyPolishLocalization(page: any, expectedTexts: string[]) {
    for (const text of expectedTexts) {
      await expect(page.locator(`text=${text}`)).toBeVisible();
    }
  }

  static async verifyDarkTheme(page: any) {
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Verify dark theme colors (should be dark)
    expect(backgroundColor).toMatch(/rgb\(18, 18, 18\)|rgb\(30, 30, 30\)|#121212|#1e1e1e/);
  }

  static async verifyPrimeReactComponents(page: any, componentSelectors: string[]) {
    for (const selector of componentSelectors) {
      await expect(page.locator(selector)).toBeVisible();
    }
  }

  static generateTestNIP(): string {
    // Generate a valid test NIP (Polish tax number)
    return '1234567890';
  }

  static generateTestREGON(): string {
    // Generate a valid test REGON (Polish business registry number)
    return '123456789';
  }

  static async mockHvacApiResponses(page: any) {
    // Mock HVAC API responses for testing
    await page.route('**/api/hvac/**', (route) => {
      const url = route.request().url();
      
      if (url.includes('/customers')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            customers: [hvacTestData.customer],
            total: 1,
          }),
        });
      } else if (url.includes('/tickets')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tickets: [hvacTestData.serviceTicket],
            total: 1,
          }),
        });
      } else if (url.includes('/equipment')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            equipment: [hvacTestData.equipment],
            total: 1,
          }),
        });
      } else {
        route.continue();
      }
    });
  }

  static async mockWeaviateResponses(page: any) {
    // Mock Weaviate semantic search responses
    await page.route('**/weaviate/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            Get: {
              HvacDocument: [
                {
                  title: 'Konserwacja klimatyzacji',
                  content: 'Instrukcja konserwacji systemu klimatyzacji',
                  type: 'maintenance',
                  _additional: {
                    certainty: 0.95,
                  },
                },
              ],
            },
          },
        }),
      });
    });
  }
}
