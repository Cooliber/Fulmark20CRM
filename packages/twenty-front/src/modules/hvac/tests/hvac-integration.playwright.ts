/**
 * Zaawansowane Testy Integracyjne HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalne Testy E2E
 * 
 * Kompleksowe testy integracji modułów HVAC z TwentyCRM
 * Zgodnie z filozofią "piękna unifikacja w pełnym stylu twenty crm"
 */

import { test, expect, Page } from '@playwright/test';

// Konfiguracja testów
const HVAC_BASE_URL = '/hvac';
const TWENTY_BASE_URL = '/';
const TEST_TIMEOUT = 45000;

// Dane testowe dla polskiego rynku HVAC
const POLISH_HVAC_DATA = {
  customer: {
    name: 'Zakład Klimatyzacji Sp. z o.o.',
    nip: '1234567890',
    regon: '123456789',
    email: 'biuro@klimatyzacja.pl',
    phone: '+48 22 123 45 67',
    address: {
      street: 'ul. Klimatyczna 15',
      city: 'Warszawa',
      postalCode: '02-123',
      country: 'Polska'
    }
  },
  equipment: {
    name: 'Pompa Ciepła Vaillant aroTHERM plus',
    type: 'HEAT_PUMP',
    brand: 'Vaillant',
    model: 'VWL 125/6 A',
    serialNumber: 'VT2024001234',
    power: '12 kW',
    efficiency: 'A+++',
    refrigerant: 'R32'
  },
  serviceTicket: {
    title: 'Przegląd okresowy pompy ciepła',
    description: 'Przegląd zgodny z wymogami polskiej normy PN-EN 378',
    type: 'MAINTENANCE',
    priority: 'MEDIUM',
    estimatedDuration: 120 // minuty
  }
};

// Funkcje pomocnicze
async function authenticateHvacUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'hvac.technician@test.pl');
  await page.fill('[data-testid="password-input"]', 'TestHVAC2024!');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/');
  await page.waitForSelector('[data-testid="user-menu"]');
}

async function createTestCustomer(page: Page) {
  await page.goto(`${HVAC_BASE_URL}/customers`);
  await page.click('[data-testid="create-customer-button"]');
  
  // Wypełnienie formularza klienta
  await page.fill('[data-testid="customer-name-input"]', POLISH_HVAC_DATA.customer.name);
  await page.fill('[data-testid="customer-nip-input"]', POLISH_HVAC_DATA.customer.nip);
  await page.fill('[data-testid="customer-regon-input"]', POLISH_HVAC_DATA.customer.regon);
  await page.fill('[data-testid="customer-email-input"]', POLISH_HVAC_DATA.customer.email);
  await page.fill('[data-testid="customer-phone-input"]', POLISH_HVAC_DATA.customer.phone);
  
  // Adres
  await page.fill('[data-testid="customer-street-input"]', POLISH_HVAC_DATA.customer.address.street);
  await page.fill('[data-testid="customer-city-input"]', POLISH_HVAC_DATA.customer.address.city);
  await page.fill('[data-testid="customer-postal-code-input"]', POLISH_HVAC_DATA.customer.address.postalCode);
  
  await page.click('[data-testid="save-customer-button"]');
  await page.waitForSelector('[data-testid="customer-created-success"]');
  
  return await page.locator('[data-testid="customer-id"]').textContent();
}

// Główne testy integracyjne
test.describe('Integracja HVAC z TwentyCRM', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    await authenticateHvacUser(page);
  });

  test('pełny przepływ obsługi klienta HVAC', async ({ page }) => {
    // 1. Utworzenie klienta
    const customerId = await createTestCustomer(page);
    expect(customerId).toBeTruthy();
    
    // 2. Dodanie sprzętu dla klienta
    await page.goto(`${HVAC_BASE_URL}/customers/${customerId}`);
    await page.click('[data-testid="add-equipment-button"]');
    
    await page.fill('[data-testid="equipment-name-input"]', POLISH_HVAC_DATA.equipment.name);
    await page.selectOption('[data-testid="equipment-type-select"]', POLISH_HVAC_DATA.equipment.type);
    await page.fill('[data-testid="equipment-brand-input"]', POLISH_HVAC_DATA.equipment.brand);
    await page.fill('[data-testid="equipment-model-input"]', POLISH_HVAC_DATA.equipment.model);
    await page.fill('[data-testid="equipment-serial-input"]', POLISH_HVAC_DATA.equipment.serialNumber);
    
    await page.click('[data-testid="save-equipment-button"]');
    await page.waitForSelector('[data-testid="equipment-created-success"]');
    
    // 3. Utworzenie zlecenia serwisowego
    await page.click('[data-testid="create-service-ticket-button"]');
    
    await page.fill('[data-testid="ticket-title-input"]', POLISH_HVAC_DATA.serviceTicket.title);
    await page.fill('[data-testid="ticket-description-textarea"]', POLISH_HVAC_DATA.serviceTicket.description);
    await page.selectOption('[data-testid="ticket-type-select"]', POLISH_HVAC_DATA.serviceTicket.type);
    await page.selectOption('[data-testid="ticket-priority-select"]', POLISH_HVAC_DATA.serviceTicket.priority);
    
    await page.click('[data-testid="save-ticket-button"]');
    await page.waitForSelector('[data-testid="ticket-created-success"]');
    
    // 4. Weryfikacja integracji z TwentyCRM
    await page.goto('/');
    await page.click('[data-testid="recent-activities"]');
    
    const recentActivity = await page.locator('[data-testid="activity-item"]').first();
    await expect(recentActivity).toContainText('HVAC');
  });

  test('integracja z systemem nawigacji TwentyCRM', async ({ page }) => {
    // Sprawdzenie obecności HVAC w głównej nawigacji
    await page.goto('/');
    
    const hvacNavItem = await page.locator('[data-testid="hvac-navigation-item"]');
    await expect(hvacNavItem).toBeVisible();
    await expect(hvacNavItem).toContainText('HVAC');
    
    // Kliknięcie i sprawdzenie nawigacji
    await hvacNavItem.click();
    await page.waitForURL(/\/hvac/);
    
    // Sprawdzenie breadcrumbs
    const breadcrumbs = await page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toContainText('HVAC');
    
    // Sprawdzenie submenu HVAC
    const hvacSubmenu = await page.locator('[data-testid="hvac-submenu"]');
    await expect(hvacSubmenu).toBeVisible();
    
    const submenuItems = await hvacSubmenu.locator('[data-testid="submenu-item"]');
    await expect(submenuItems).toHaveCountGreaterThan(5);
  });

  test('integracja z systemem uprawnień TwentyCRM', async ({ page }) => {
    // Test dostępu do różnych sekcji HVAC
    const protectedSections = [
      { path: '/hvac/customers', testId: 'hvac-customers-section' },
      { path: '/hvac/service-tickets', testId: 'hvac-tickets-section' },
      { path: '/hvac/equipment', testId: 'hvac-equipment-section' },
      { path: '/hvac/analytics', testId: 'hvac-analytics-section' }
    ];
    
    for (const section of protectedSections) {
      await page.goto(section.path);
      
      // Sprawdzenie czy sekcja jest dostępna (nie ma komunikatu o braku uprawnień)
      const unauthorizedMessage = await page.locator('[data-testid="unauthorized-access"]');
      await expect(unauthorizedMessage).not.toBeVisible();
      
      // Sprawdzenie czy zawartość sekcji się ładuje
      const sectionContent = await page.locator(`[data-testid="${section.testId}"]`);
      await expect(sectionContent).toBeVisible();
    }
  });

  test('integracja z systemem wyszukiwania semantycznego', async ({ page }) => {
    await page.goto(`${HVAC_BASE_URL}/search`);
    
    // Test wyszukiwania w języku polskim
    const searchQueries = [
      'pompa ciepła',
      'klimatyzacja',
      'wentylacja',
      'przegląd okresowy',
      'awaria systemu'
    ];
    
    for (const query of searchQueries) {
      await page.fill('[data-testid="semantic-search-input"]', query);
      await page.keyboard.press('Enter');
      
      await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
      
      const results = await page.locator('[data-testid="search-result-item"]');
      const resultCount = await results.count();
      
      if (resultCount > 0) {
        // Sprawdzenie jakości wyników
        const firstResult = results.first();
        await expect(firstResult).toBeVisible();
        
        const resultTitle = await firstResult.locator('[data-testid="result-title"]');
        const resultContent = await firstResult.locator('[data-testid="result-content"]');
        
        await expect(resultTitle).toBeVisible();
        await expect(resultContent).toBeVisible();
      }
      
      // Wyczyść wyszukiwanie
      await page.fill('[data-testid="semantic-search-input"]', '');
    }
  });

  test('integracja z polskimi standardami i przepisami', async ({ page }) => {
    await page.goto(`${HVAC_BASE_URL}/compliance`);
    
    // Sprawdzenie walidacji NIP
    const nipValidator = await page.locator('[data-testid="nip-validator"]');
    if (await nipValidator.isVisible()) {
      await page.fill('[data-testid="nip-input"]', POLISH_HVAC_DATA.customer.nip);
      await page.click('[data-testid="validate-nip-button"]');
      
      await page.waitForSelector('[data-testid="nip-validation-result"]');
      const validationResult = await page.locator('[data-testid="nip-validation-result"]');
      await expect(validationResult).toBeVisible();
    }
    
    // Sprawdzenie walidacji REGON
    const regonValidator = await page.locator('[data-testid="regon-validator"]');
    if (await regonValidator.isVisible()) {
      await page.fill('[data-testid="regon-input"]', POLISH_HVAC_DATA.customer.regon);
      await page.click('[data-testid="validate-regon-button"]');
      
      await page.waitForSelector('[data-testid="regon-validation-result"]');
      const validationResult = await page.locator('[data-testid="regon-validation-result"]');
      await expect(validationResult).toBeVisible();
    }
    
    // Sprawdzenie zgodności z polskimi normami
    const complianceChecks = await page.locator('[data-testid="compliance-check"]');
    if (await complianceChecks.count() > 0) {
      const polishStandards = [
        'PN-EN 378', // Systemy chłodnicze
        'PN-EN 14511', // Pompy ciepła
        'PN-EN 12831', // Obliczanie obciążenia cieplnego
        'PN-EN 15603' // Charakterystyka energetyczna budynków
      ];
      
      for (const standard of polishStandards) {
        const standardCheck = await page.locator(`[data-testid="standard-${standard.replace(/[^a-zA-Z0-9]/g, '-')}"]`);
        if (await standardCheck.isVisible()) {
          await expect(standardCheck).toContainText(standard);
        }
      }
    }
  });

  test('wydajność i optymalizacja bundle size', async ({ page }) => {
    // Monitorowanie żądań sieciowych
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('hvac')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      }
    });
    
    const startTime = Date.now();
    
    // Nawigacja do dashboardu HVAC
    await page.goto(`${HVAC_BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="hvac-dashboard"]');
    
    const loadTime = Date.now() - startTime;
    
    // Sprawdzenie czasu ładowania (powinien być < 3 sekundy)
    expect(loadTime).toBeLessThan(3000);
    
    // Sprawdzenie liczby żądań (optymalizacja bundli)
    const scriptRequests = networkRequests.filter(req => req.resourceType === 'script');
    expect(scriptRequests.length).toBeLessThan(8); // Maksymalnie 8 plików JS dla HVAC
    
    // Test lazy loading
    await page.click('[data-testid="hvac-tab-analytics"]');
    await page.waitForSelector('[data-testid="hvac-analytics-content"]');
    
    // Sprawdzenie czy komponenty analityczne ładują się na żądanie
    const analyticsRequests = networkRequests.filter(req => 
      req.url().includes('analytics') || req.url().includes('chart')
    );
    expect(analyticsRequests.length).toBeGreaterThan(0);
  });

  test('responsywność i dostępność', async ({ page }) => {
    // Test różnych rozmiarów ekranu
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${HVAC_BASE_URL}/dashboard`);
      
      // Sprawdzenie czy dashboard jest widoczny
      const dashboard = await page.locator('[data-testid="hvac-dashboard"]');
      await expect(dashboard).toBeVisible();
      
      // Sprawdzenie nawigacji na urządzeniach mobilnych
      if (viewport.width < 768) {
        const mobileMenu = await page.locator('[data-testid="mobile-menu-toggle"]');
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          const mobileNav = await page.locator('[data-testid="mobile-navigation"]');
          await expect(mobileNav).toBeVisible();
        }
      }
    }
    
    // Test dostępności (accessibility)
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`${HVAC_BASE_URL}/dashboard`);
    
    // Sprawdzenie elementów dostępności
    const accessibleElements = await page.locator('[aria-label], [role], [tabindex]');
    await expect(accessibleElements).toHaveCountGreaterThan(10);
    
    // Test nawigacji klawiaturą
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
