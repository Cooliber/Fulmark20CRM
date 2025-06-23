# HVAC Playwright Test Suite

**"Pasja rodzi profesjonalizm"** - Comprehensive end-to-end testing for Fulmark HVAC CRM

## 🎯 Overview

This test suite provides comprehensive Playwright-based end-to-end testing for all HVAC-specific components in the Fulmark20CRM system. The tests ensure that our HVAC CRM meets the highest quality standards with Polish localization, dark theme compliance, and professional user experience.

## 🏗️ Test Architecture

### Test Structure
```
tests/hvac/
├── hvac-dashboard.spec.ts           # Main dashboard functionality
├── hvac-semantic-search.spec.ts     # AI-powered search with Weaviate
├── hvac-service-planner.spec.ts     # Scheduling and planning features
├── hvac-dispatch-panel.spec.ts      # Real-time job dispatch
├── hvac-mobile-maintenance.spec.ts  # Mobile and maintenance features
├── hvac-error-handling.spec.ts      # Error boundaries and Sentry
└── README.md                        # This file
```

### Page Object Models
```
lib/pom/hvac/
├── HvacDashboardPage.ts             # Dashboard interactions
├── HvacSemanticSearchPage.ts        # Search functionality
├── HvacServicePlannerPage.ts        # Service planning
└── HvacDispatchPanelPage.ts         # Dispatch operations
```

### Test Fixtures
```
lib/fixtures/hvac/
└── hvac-test-fixture.ts             # Shared test data and utilities
```

## 🧪 Test Coverage

### 1. HVAC Dashboard Tests (`hvac-dashboard.spec.ts`)
- ✅ Dashboard loading and navigation
- ✅ Tab functionality (Overview, Search, Tickets, Equipment, Analytics)
- ✅ Polish localization verification
- ✅ Dark theme compliance
- ✅ Responsive design validation
- ✅ Error handling and Sentry integration
- ✅ Performance standards

### 2. Semantic Search Tests (`hvac-semantic-search.spec.ts`)
- ✅ Search interface and loading
- ✅ Weaviate integration testing
- ✅ Polish HVAC terminology support
- ✅ Search performance validation
- ✅ Error handling and retry mechanisms
- ✅ Advanced filtering capabilities

### 3. Service Planner Tests (`hvac-service-planner.spec.ts`)
- ✅ Scheduling dashboard functionality
- ✅ Calendar navigation and views
- ✅ Technician tracking and assignment
- ✅ Job management workflows
- ✅ Maintenance scheduling
- ✅ Mobile dashboard integration

### 4. Dispatch Panel Tests (`hvac-dispatch-panel.spec.ts`)
- ✅ Real-time job monitoring
- ✅ Emergency dispatch procedures
- ✅ Technician assignment workflows
- ✅ Customer communication features
- ✅ Filtering and search capabilities
- ✅ Polish localization for dispatch operations

### 5. Mobile & Maintenance Tests (`hvac-mobile-maintenance.spec.ts`)
- ✅ Mobile responsive design
- ✅ Touch interaction support
- ✅ Maintenance scheduling features
- ✅ Cross-device compatibility
- ✅ Performance on mobile networks

### 6. Error Handling Tests (`hvac-error-handling.spec.ts`)
- ✅ Error boundary functionality
- ✅ Sentry integration and monitoring
- ✅ Network failure handling
- ✅ Fault tolerance components
- ✅ Recovery mechanisms

## 🚀 Running Tests

### Prerequisites
Ensure the following services are running:
- **Frontend**: `http://localhost:3002` (Twenty CRM)
- **Backend**: `http://localhost:3001` (NestJS API)
- **HVAC API**: `http://localhost:8000` (Optional - will be mocked if not available)
- **Weaviate**: `http://localhost:8080` (Optional - will be mocked if not available)

### Quick Start
```bash
# Run complete HVAC test suite
npm run test:hvac

# Or using the script directly
./scripts/run-hvac-tests.sh
```

### Individual Test Suites
```bash
# Dashboard tests
npm run test:hvac:dashboard

# Semantic search tests
npm run test:hvac:search

# Service planner tests
npm run test:hvac:planner

# Dispatch panel tests
npm run test:hvac:dispatch

# Mobile and maintenance tests
npm run test:hvac:mobile

# Error handling tests
npm run test:hvac:errors
```

### Debug Mode
```bash
# Run with Playwright UI for debugging
npx playwright test tests/hvac/hvac-dashboard.spec.ts --ui

# Run in headed mode
npx playwright test tests/hvac/hvac-dashboard.spec.ts --headed
```

## 📊 Test Reports

After running tests, reports are generated in:
- **HTML Reports**: `playwright-report/`
- **Test Results**: `run_results/hvac-tests/`
- **Screenshots**: `run_results/` (on failures)
- **Videos**: `run_results/` (on failures)

## 🎨 Quality Standards

### "Pasja rodzi profesjonalizm" Compliance
Our tests ensure:
- ✅ **Polish Localization**: All UI text in Polish
- ✅ **Dark Theme**: Professional dark color scheme
- ✅ **PrimeReact/PrimeFlex**: Consistent component usage
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Performance**: Sub-5-second load times
- ✅ **Error Handling**: Graceful failure management
- ✅ **Accessibility**: WCAG compliance

### HVAC Domain Expertise
- ✅ **Polish HVAC Terminology**: Klimatyzacja, ogrzewanie, wentylacja
- ✅ **Business Compliance**: NIP, REGON validation
- ✅ **Professional Workflows**: Service planning, dispatch, maintenance
- ✅ **Real-time Operations**: Live job tracking and updates

## 🔧 Configuration

### Environment Variables
```bash
FRONTEND_BASE_URL=http://localhost:3002
BACKEND_BASE_URL=http://localhost:3001
HVAC_API_URL=http://localhost:8000
WEAVIATE_URL=http://localhost:8080
HVAC_TEST_USER=hvac@fulmark.pl
HVAC_TEST_PASSWORD=hvac123
```

### Playwright Configuration
Tests use the main `playwright.config.ts` with HVAC-specific fixtures and page objects.

## 🐛 Troubleshooting

### Common Issues

1. **Services Not Running**
   ```bash
   # Check service status
   curl http://localhost:3002  # Frontend
   curl http://localhost:3001  # Backend
   ```

2. **Test Failures**
   - Check console output for specific error messages
   - Review HTML reports for detailed failure information
   - Verify environment variables are set correctly

3. **Performance Issues**
   - Ensure adequate system resources
   - Check network connectivity for API calls
   - Verify database connections

### Debug Tips
- Use `--headed` flag to see browser interactions
- Add `await page.pause()` in tests for manual debugging
- Check browser console for JavaScript errors
- Review network tab for failed API calls

## 📈 Continuous Integration

### GitHub Actions Integration
Tests can be integrated into CI/CD pipelines:

```yaml
- name: Run HVAC Tests
  run: |
    cd packages/twenty-e2e-testing
    npm run test:hvac
```

### Test Parallelization
For faster execution in CI:
```bash
npx playwright test tests/hvac/ --workers=4
```

## 🤝 Contributing

### Adding New Tests
1. Create test file in `tests/hvac/`
2. Use existing page objects or create new ones
3. Follow Polish localization standards
4. Include error handling scenarios
5. Add responsive design validation

### Test Naming Convention
- Use descriptive test names in English
- Include Polish UI elements being tested
- Follow pattern: `should [action] [expected result]`

### Code Quality
- Use TypeScript for type safety
- Follow existing code patterns
- Include comprehensive assertions
- Add meaningful comments for complex interactions

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [PrimeReact Components](https://primereact.org/)
- [Twenty CRM Documentation](https://twenty.com/developers)
- [HVAC Integration Guide](../../HVAC_INTEGRATION_README.md)

---

**Fulmark HVAC CRM** - Professional heating, ventilation, and air conditioning management system for Polish businesses.

*"Pasja rodzi profesjonalizm"* 🏆
