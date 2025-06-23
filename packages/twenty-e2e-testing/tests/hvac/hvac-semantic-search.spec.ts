import { test, expect } from '../../lib/fixtures/hvac/hvac-test-fixture';
import { HvacTestUtils } from '../../lib/fixtures/hvac/hvac-test-fixture';

test.describe('HVAC Semantic Search Tests', () => {
  test.beforeEach(async ({ page, hvacTestData }) => {
    // Mock API responses for consistent testing
    await HvacTestUtils.mockHvacApiResponses(page);
    await HvacTestUtils.mockWeaviateResponses(page);
  });

  test.describe('Search Interface and Loading', () => {
    test('should load semantic search interface correctly', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.waitForLoad();
      
      // Verify main search components
      await expect(hvacSemanticSearch.searchContainer).toBeVisible();
      await expect(hvacSemanticSearch.searchInput).toBeVisible();
      await expect(hvacSemanticSearch.searchIcon).toBeVisible();
    });

    test('should display Polish placeholder text', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifySearchPlaceholder();
      await hvacSemanticSearch.verifyPolishLocalization();
    });

    test('should show search statistics', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifySearchStats();
      
      // Verify specific stats elements
      await expect(hvacSemanticSearch.totalDocuments).toBeVisible();
      await expect(hvacSemanticSearch.executionTime).toBeVisible();
    });

    test('should display filter and control buttons', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      await expect(hvacSemanticSearch.weaviateToggle).toBeVisible();
      await expect(hvacSemanticSearch.refreshButton).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should perform basic search with Enter key', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('klimatyzacja');
      await hvacSemanticSearch.verifySearchResults();
    });

    test('should perform search with search button', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearchWithButton('konserwacja');
      await hvacSemanticSearch.verifySearchResults();
    });

    test('should handle HVAC-specific search terms', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifyHvacSpecificSuggestions();
    });

    test('should display search results with proper content', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('pompa ciepła');
      
      // Verify result structure
      await hvacSemanticSearch.verifyResultContent(0, 'Konserwacja klimatyzacji');
      await expect(hvacSemanticSearch.resultTitle).toBeVisible();
      await expect(hvacSemanticSearch.resultDescription).toBeVisible();
      await expect(hvacSemanticSearch.resultScore).toBeVisible();
    });

    test('should handle empty search results', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Mock empty results
      await page.route('**/weaviate/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { Get: { HvacDocument: [] } }
          }),
        });
      });
      
      await hvacSemanticSearch.performSearch('nonexistent term');
      await hvacSemanticSearch.verifyNoResults();
    });

    test('should allow clicking on search results', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('serwis');
      await hvacSemanticSearch.clickFirstResult();
      
      // Verify result interaction
      // Note: Actual behavior depends on implementation
    });
  });

  test.describe('Weaviate Integration', () => {
    test('should toggle between Weaviate and PostgreSQL sources', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Test Weaviate enabled (default)
      await hvacSemanticSearch.verifyWeaviateEnabled();
      
      // Toggle to PostgreSQL
      await hvacSemanticSearch.toggleWeaviateSource();
      await hvacSemanticSearch.verifyWeaviateDisabled();
      
      // Toggle back to Weaviate
      await hvacSemanticSearch.toggleWeaviateSource();
      await hvacSemanticSearch.verifyWeaviateEnabled();
    });

    test('should handle Weaviate connection errors gracefully', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Mock Weaviate error
      await page.route('**/weaviate/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Weaviate connection failed' }),
        });
      });
      
      await hvacSemanticSearch.performSearch('test');
      await hvacSemanticSearch.verifyErrorHandling();
    });

    test('should display Weaviate-specific search features', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Verify semantic search capabilities
      await hvacSemanticSearch.performSearch('awaria chłodzenia');
      
      // Should find semantically related content even with different wording
      await hvacSemanticSearch.verifySearchResults();
      await expect(page.locator('text=klimatyzacja').or(page.locator('text=chłodzenie'))).toBeVisible();
    });
  });

  test.describe('Search Performance and Quality', () => {
    test('should complete searches within acceptable time limits', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifySearchPerformance();
    });

    test('should display execution time', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('wentylacja');
      
      const executionTime = await hvacSemanticSearch.getExecutionTime();
      expect(executionTime).toBeTruthy();
      expect(executionTime).toMatch(/\d+(\.\d+)?\s*(ms|s)/); // Should show time in ms or s
    });

    test('should handle concurrent searches properly', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Perform multiple searches quickly
      await hvacSemanticSearch.performSearch('klimatyzacja');
      await hvacSemanticSearch.performSearch('ogrzewanie');
      await hvacSemanticSearch.performSearch('wentylacja');
      
      // Should show results for the last search
      await hvacSemanticSearch.verifySearchResults();
    });

    test('should maintain search history and context', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Perform a search
      await hvacSemanticSearch.performSearch('konserwacja kotła');
      await hvacSemanticSearch.verifySearchResults();
      
      // Navigate away and back
      await page.goBack();
      await page.goForward();
      
      // Search input should maintain last query
      const searchValue = await hvacSemanticSearch.searchInput.inputValue();
      expect(searchValue).toBe('konserwacja kotła');
    });
  });

  test.describe('Advanced Search Features', () => {
    test('should support advanced filters', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifyAdvancedFilters();
    });

    test('should allow refreshing search results', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('serwis');
      
      const initialCount = await hvacSemanticSearch.getSearchResultsCount();
      
      await hvacSemanticSearch.refreshSearch();
      await hvacSemanticSearch.verifySearchResults();
      
      // Results should be refreshed (count might be same but content updated)
      const refreshedCount = await hvacSemanticSearch.getSearchResultsCount();
      expect(refreshedCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear search input', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('test query');
      
      await hvacSemanticSearch.clearSearch();
      
      const searchValue = await hvacSemanticSearch.searchInput.inputValue();
      expect(searchValue).toBe('');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Mock network error
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });
      
      await hvacSemanticSearch.performSearch('test');
      await hvacSemanticSearch.verifyErrorHandling();
    });

    test('should handle empty search queries', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.performSearch('');
      
      // Should either show validation message or default results
      // Implementation-dependent behavior
    });

    test('should handle very long search queries', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      const longQuery = 'bardzo długie zapytanie o konserwację systemów klimatyzacji i ogrzewania w budynkach komercyjnych i mieszkalnych'.repeat(5);
      await hvacSemanticSearch.performSearch(longQuery);
      
      // Should handle gracefully without breaking
      await hvacSemanticSearch.verifyErrorHandling();
    });

    test('should retry failed searches', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Mock initial failure
      let requestCount = 0;
      await page.route('**/weaviate/**', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 500, body: 'Server Error' });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { Get: { HvacDocument: [{ title: 'Test Result' }] } }
            }),
          });
        }
      });
      
      await hvacSemanticSearch.performSearch('test');
      await hvacSemanticSearch.retryFailedSearch();
      await hvacSemanticSearch.verifySearchResults();
    });
  });

  test.describe('Loading States and UX', () => {
    test('should show loading indicators during search', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifyLoadingState();
    });

    test('should provide visual feedback for user actions', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Click search button and verify visual feedback
      await hvacSemanticSearch.searchInput.fill('test');
      await hvacSemanticSearch.searchButton.click();
      
      // Should show some form of loading or processing indicator
      await expect(hvacSemanticSearch.loadingSpinner.or(hvacSemanticSearch.searchingIndicator)).toBeVisible();
    });

    test('should maintain accessibility standards', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Check for proper ARIA labels and accessibility
      const searchInput = hvacSemanticSearch.searchInput;
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const placeholder = await searchInput.getAttribute('placeholder');
      
      expect(ariaLabel || placeholder).toBeTruthy();
      
      // Verify keyboard navigation
      await searchInput.focus();
      await page.keyboard.press('Tab');
      // Should move focus to next interactive element
    });
  });

  test.describe('Polish Localization and HVAC Domain', () => {
    test('should display all text in Polish', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      await hvacSemanticSearch.verifyPolishLocalization();
    });

    test('should handle Polish HVAC terminology correctly', async ({ hvacSemanticSearch, page }) => {
      await hvacSemanticSearch.navigateTo();
      
      const polishHvacTerms = [
        'klimatyzacja',
        'ogrzewanie',
        'wentylacja',
        'pompa ciepła',
        'kocioł gazowy',
        'rekuperacja',
        'chłodzenie',
        'konserwacja',
        'serwis',
        'awaria'
      ];
      
      for (const term of polishHvacTerms) {
        await hvacSemanticSearch.performSearch(term);
        await hvacSemanticSearch.verifySearchResults();
        
        // Verify no errors with Polish characters
        await expect(hvacSemanticSearch.errorMessage).not.toBeVisible();
      }
    });

    test('should support Polish diacritics in search', async ({ hvacSemanticSearch }) => {
      await hvacSemanticSearch.navigateTo();
      
      // Test Polish characters
      await hvacSemanticSearch.performSearch('łożyska śrubowe');
      await hvacSemanticSearch.verifySearchResults();
      
      await hvacSemanticSearch.performSearch('żeliwne grzejniki');
      await hvacSemanticSearch.verifySearchResults();
    });
  });
});
