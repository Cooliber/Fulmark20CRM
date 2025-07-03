name: "HVAC Dashboard Enhancement - SOTA++ Analytics & Polish Market Integration"
description: |

## Purpose
Enhance the existing HVAC dashboard with advanced analytics, real-time monitoring, and Polish market-specific features while maintaining perfect TwentyCRM integration and bundle size under 4.7MB.

## Core Principles
1. **"Piękna unifikacja w pełnym stylu twenty crm"** - Perfect TwentyCRM integration
2. **"Pasja rodzi profesjonalizm"** - Professional-grade HVAC functionality
3. **Polish market compliance** - VAT, regulations, local manufacturers
4. **Performance first** - Bundle optimization and 300ms response times
5. **Mobile-ready** - Technician-friendly mobile interface

---

## Goal
Transform the HVAC dashboard into a comprehensive control center that provides real-time system monitoring, predictive analytics, energy efficiency insights, and Polish market compliance features.

## Why
- **Business value**: Reduces HVAC maintenance costs by 30% through predictive analytics
- **Integration**: Seamless TwentyCRM experience for HVAC professionals
- **Polish market**: Compliance with Polish energy regulations and VAT requirements
- **Technician productivity**: Mobile-optimized interface for field workers

## What
A comprehensive HVAC dashboard featuring:
- Real-time system monitoring with live data streams
- Energy efficiency analytics with Polish energy provider integration
- Predictive maintenance alerts using AI algorithms
- Polish VAT calculations and compliance reporting
- Mobile-responsive design for technician field work
- Integration with Polish HVAC manufacturers (Vaillant, Viessmann, Bosch)

### Success Criteria
- [ ] Real-time data updates within 2 seconds
- [ ] Bundle size contribution under 800KB (hvac-dashboard package)
- [ ] 300ms search and filter response times
- [ ] 95% mobile usability score
- [ ] Polish VAT calculations with 100% accuracy
- [ ] Integration with 3+ Polish HVAC manufacturers
- [ ] Predictive maintenance accuracy > 85%

## All Needed Context

### Documentation & References
```yaml
# MUST READ - TwentyCRM Integration Patterns
- file: packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx
  why: Navigation integration patterns for HVAC modules
  
- file: packages/twenty-front/src/modules/ui/layout/page/PageBody.tsx
  why: Page layout patterns used throughout TwentyCRM
  
- file: packages/twenty-front/src/modules/ui/display/icon/index.ts
  why: Available icons from twenty-ui/display package

# HVAC-Specific Context
- file: packages/hvac-dashboard/src/components/HVACDashboard.tsx
  why: Current dashboard implementation to enhance
  
- file: packages/hvac-core/src/types/hvac.ts
  why: HVAC data models and type definitions
  
- file: packages/hvac-analytics/src/services/AnalyticsService.ts
  why: Analytics service patterns for integration

# Polish Market Requirements
- doc: https://www.gov.pl/web/klimat/efektywnosc-energetyczna
  section: Polish energy efficiency regulations
  critical: VAT rates and compliance requirements
```

### Current HVAC Dashboard Structure
```bash
packages/hvac-dashboard/
├── src/
│   ├── components/
│   │   ├── HVACDashboard.tsx           # Main dashboard component
│   │   ├── SystemOverview.tsx          # System status overview
│   │   ├── EnergyMetrics.tsx          # Energy consumption metrics
│   │   └── MaintenanceAlerts.tsx      # Maintenance notifications
│   ├── hooks/
│   │   ├── useHVACData.ts             # Data fetching hook
│   │   └── useRealTimeUpdates.ts      # WebSocket integration
│   ├── services/
│   │   └── HVACApiService.ts          # API communication
│   └── types/
│       └── dashboard.ts               # Dashboard-specific types
```

### Enhanced Dashboard Structure (Target)
```bash
packages/hvac-dashboard/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── HVACDashboard.tsx           # Enhanced main dashboard
│   │   │   ├── RealTimeMonitor.tsx         # Live system monitoring
│   │   │   ├── EnergyAnalytics.tsx         # Advanced energy analytics
│   │   │   ├── PredictiveMaintenance.tsx   # AI-powered predictions
│   │   │   └── PolishCompliance.tsx        # Polish market features
│   │   ├── widgets/
│   │   │   ├── SystemStatusWidget.tsx      # Real-time status widget
│   │   │   ├── EnergyEfficiencyWidget.tsx  # Energy metrics widget
│   │   │   ├── MaintenanceWidget.tsx       # Maintenance alerts widget
│   │   │   └── VATCalculatorWidget.tsx     # Polish VAT calculator
│   │   └── mobile/
│   │       ├── MobileDashboard.tsx         # Mobile-optimized view
│   │       └── TechnicianPanel.tsx         # Field technician interface
│   ├── hooks/
│   │   ├── useRealTimeHVAC.ts             # Enhanced real-time data
│   │   ├── usePredictiveAnalytics.ts      # AI predictions hook
│   │   ├── usePolishCompliance.ts         # Polish market hook
│   │   └── useMobileOptimization.ts       # Mobile-specific optimizations
│   ├── services/
│   │   ├── RealTimeService.ts             # WebSocket service
│   │   ├── AnalyticsService.ts            # Analytics processing
│   │   ├── PolishVATService.ts            # VAT calculations
│   │   └── ManufacturerIntegration.ts     # Polish manufacturer APIs
│   └── utils/
│       ├── polishFormatting.ts            # Polish number/currency formatting
│       ├── energyCalculations.ts          # Energy efficiency calculations
│       └── bundleOptimization.ts          # Lazy loading utilities
```

### Known Gotchas & Critical Requirements
```typescript
// CRITICAL: TwentyCRM Icon Usage
import { IconBuildingSkyscraper, IconChartCandle, IconApps } from 'twenty-ui/display';
// ❌ Don't use: IconBuilding, IconDashboard, IconGauge (not available)

// CRITICAL: Bundle Size Management
const LazyAnalyticsChart = lazy(() => import('./charts/AnalyticsChart'));
// Always use dynamic imports for heavy components

// CRITICAL: Polish VAT Rates (2024)
const POLISH_VAT_RATES = {
  standard: 0.23,    // 23% - standard rate
  reduced: 0.08,     // 8% - some services
  super_reduced: 0.05 // 5% - specific cases
};

// CRITICAL: TwentyCRM Component Patterns
export const HVACWidget = () => {
  // ✅ Use functional components with named exports
  // ✅ Follow TwentyCRM styling patterns
  // ✅ Implement proper error boundaries
};
```

## Implementation Blueprint

### Phase 1: Real-Time Monitoring Enhancement
```typescript
// Enhanced real-time data hook
export const useRealTimeHVAC = () => {
  const [systemData, setSystemData] = useState<HVACSystemData>();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_HVAC_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSystemData(data);
    };

    return () => ws.close();
  }, []);

  return { systemData, connectionStatus };
};
```

### Phase 2: Polish Market Integration
```typescript
// Polish VAT service implementation
export class PolishVATService {
  static calculateVAT(amount: number, serviceType: HVACServiceType): VATCalculation {
    const rate = this.getVATRate(serviceType);
    const vatAmount = amount * rate;
    const totalAmount = amount + vatAmount;

    return {
      netAmount: amount,
      vatRate: rate,
      vatAmount,
      totalAmount,
      formattedTotal: this.formatPolishCurrency(totalAmount)
    };
  }

  private static formatPolishCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  }
}
```

### Phase 3: Mobile Optimization
```typescript
// Mobile-responsive dashboard component
export const MobileDashboard = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { systemData } = useRealTimeHVAC();

  if (isMobile) {
    return (
      <MobileLayout>
        <SystemStatusWidget compact />
        <EnergyMetricsWidget mobile />
        <MaintenanceAlertsWidget priority="high" />
      </MobileLayout>
    );
  }

  return <DesktopDashboard />;
};
```

## Validation & Testing Strategy

### Performance Tests
```typescript
describe('HVAC Dashboard Performance', () => {
  it('should load dashboard within 300ms', async () => {
    const startTime = performance.now();
    render(<HVACDashboard />);
    await waitFor(() => screen.getByTestId('hvac-dashboard'));
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(300);
  });
});
```

### Polish Market Tests
```typescript
describe('Polish Market Compliance', () => {
  it('should calculate VAT correctly for HVAC services', () => {
    const result = PolishVATService.calculateVAT(1000, 'installation');
    expect(result.vatRate).toBe(0.23);
    expect(result.totalAmount).toBe(1230);
  });
});
```

## Success Metrics
- Bundle size under 800KB
- 300ms response times
- 95% mobile usability
- Polish VAT compliance

---
**"Kontrola Klimatu = Kontrola Sukcesu"** 🌟
