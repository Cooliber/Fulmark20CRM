name: "TwentyCRM Navigation Integration - Perfect HVAC Module Visibility"
description: |

## Purpose
Achieve perfect integration of HVAC modules into TwentyCRM's navigation system, ensuring seamless user experience and maintaining the "piękna unifikacja w pełnym stylu twenty crm" philosophy.

## Core Principles
1. **Perfect TwentyCRM Integration** - Follow exact navigation patterns
2. **User Experience Excellence** - Intuitive HVAC module access
3. **Performance Optimization** - Fast navigation with lazy loading
4. **Mobile Responsiveness** - Consistent experience across devices
5. **Polish Market Context** - HVAC-specific Polish terminology

---

## Goal
Integrate HVAC modules seamlessly into TwentyCRM's navigation system, making them feel like native TwentyCRM features while maintaining optimal performance and user experience.

## Why
- **User Experience**: HVAC professionals need intuitive access to all modules
- **Business Value**: Reduces training time and increases adoption
- **Technical Excellence**: Demonstrates perfect TwentyCRM integration
- **Market Positioning**: Professional HVAC solution within familiar CRM interface

## What
Complete navigation integration featuring:
- HVAC section in main navigation drawer
- Contextual navigation for HVAC workflows
- Breadcrumb integration for HVAC pages
- Search integration for HVAC entities
- Mobile navigation optimization
- Polish language support

### Success Criteria
- [ ] HVAC modules visible in main navigation
- [ ] Navigation loads within 100ms
- [ ] Perfect visual consistency with TwentyCRM
- [ ] Mobile navigation works flawlessly
- [ ] Polish translations implemented
- [ ] Search integration functional
- [ ] Breadcrumb navigation complete

## All Needed Context

### Documentation & References
```yaml
# MUST READ - TwentyCRM Navigation Patterns
- file: packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx
  why: Main navigation structure and patterns
  critical: How to add new navigation sections
  
- file: packages/twenty-front/src/modules/navigation/components/NavigationDrawerItem.tsx
  why: Individual navigation item patterns
  critical: Icon usage and styling patterns
  
- file: packages/twenty-front/src/modules/navigation/components/NavigationDrawerSection.tsx
  why: Navigation section grouping patterns
  critical: How to create cohesive module sections

# HVAC Navigation Components
- file: packages/twenty-front/src/modules/hvac/components/navigation/HvacNavigationSection.tsx
  why: Current HVAC navigation implementation
  critical: Existing patterns to enhance
  
- file: packages/twenty-front/src/modules/hvac/components/navigation/index.ts
  why: HVAC navigation exports
  critical: Available navigation components

# TwentyCRM UI Patterns
- file: packages/twenty-front/src/modules/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableItemsContainer.tsx
  why: Container patterns for navigation items
  critical: Proper component structure
```

### Current Navigation Structure Analysis
```typescript
// Current TwentyCRM Navigation Pattern
export const MainNavigationDrawerScrollableItems = () => {
  return (
    <NavigationDrawerScrollableItemsContainer>
      <NavigationDrawerSection>
        <NavigationDrawerItem 
          label="People" 
          Icon={IconUser} 
          to="/people" 
        />
        <NavigationDrawerItem 
          label="Companies" 
          Icon={IconBuildingSkyscraper} 
          to="/companies" 
        />
        {/* Other CRM modules */}
      </NavigationDrawerSection>
      
      {/* HVAC Integration Point */}
      <HvacNavigationSection />
    </NavigationDrawerScrollableItemsContainer>
  );
};
```

### Target HVAC Navigation Structure
```typescript
// Enhanced HVAC Navigation Integration
export const HvacNavigationSection = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  return (
    <NavigationDrawerSection title={t('hvac.navigation.title')}>
      <NavigationDrawerItem
        label={t('hvac.dashboard.title')}
        Icon={IconApps}
        to="/hvac/dashboard"
        soon={false}
      />
      <NavigationDrawerItem
        label={t('hvac.equipment.title')}
        Icon={IconBuildingSkyscraper}
        to="/hvac/equipment"
        soon={false}
      />
      <NavigationDrawerItem
        label={t('hvac.service-orders.title')}
        Icon={IconClockHour8}
        to="/hvac/service-orders"
        soon={false}
      />
      <NavigationDrawerItem
        label={t('hvac.analytics.title')}
        Icon={IconChartCandle}
        to="/hvac/analytics"
        soon={false}
      />
      {!isMobile && (
        <NavigationDrawerItem
          label={t('hvac.reports.title')}
          Icon={IconFileText}
          to="/hvac/reports"
          soon={false}
        />
      )}
    </NavigationDrawerSection>
  );
};
```

### Polish Translations Integration
```typescript
// HVAC Polish translations
export const hvacTranslations = {
  pl: {
    hvac: {
      navigation: {
        title: 'HVAC',
      },
      dashboard: {
        title: 'Panel HVAC',
        description: 'Przegląd systemów klimatyzacji'
      },
      equipment: {
        title: 'Sprzęt',
        description: 'Zarządzanie urządzeniami HVAC'
      },
      'service-orders': {
        title: 'Zlecenia Serwisowe',
        description: 'Zarządzanie zleceniami serwisowymi'
      },
      analytics: {
        title: 'Analityka',
        description: 'Raporty i analizy HVAC'
      },
      reports: {
        title: 'Raporty',
        description: 'Szczegółowe raporty systemów'
      }
    }
  },
  en: {
    hvac: {
      navigation: {
        title: 'HVAC',
      },
      dashboard: {
        title: 'HVAC Dashboard',
        description: 'HVAC systems overview'
      },
      equipment: {
        title: 'Equipment',
        description: 'HVAC equipment management'
      },
      'service-orders': {
        title: 'Service Orders',
        description: 'Service order management'
      },
      analytics: {
        title: 'Analytics',
        description: 'HVAC reports and analytics'
      },
      reports: {
        title: 'Reports',
        description: 'Detailed system reports'
      }
    }
  }
};
```

## Implementation Blueprint

### Phase 1: Navigation Component Enhancement
```typescript
// Enhanced HVAC Navigation with Performance Optimization
export const HvacNavigationSection = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { isFeatureEnabled } = useFeatureFlags();
  
  // Lazy load navigation items for better performance
  const navigationItems = useMemo(() => [
    {
      label: t('hvac.dashboard.title'),
      Icon: IconApps,
      to: '/hvac/dashboard',
      enabled: true
    },
    {
      label: t('hvac.equipment.title'),
      Icon: IconBuildingSkyscraper,
      to: '/hvac/equipment',
      enabled: isFeatureEnabled('hvac-equipment')
    },
    {
      label: t('hvac.service-orders.title'),
      Icon: IconClockHour8,
      to: '/hvac/service-orders',
      enabled: isFeatureEnabled('hvac-service-orders')
    },
    {
      label: t('hvac.analytics.title'),
      Icon: IconChartCandle,
      to: '/hvac/analytics',
      enabled: isFeatureEnabled('hvac-analytics')
    }
  ], [t, isFeatureEnabled]);
  
  return (
    <NavigationDrawerSection title={t('hvac.navigation.title')}>
      {navigationItems
        .filter(item => item.enabled)
        .map(item => (
          <NavigationDrawerItem
            key={item.to}
            label={item.label}
            Icon={item.Icon}
            to={item.to}
            soon={false}
          />
        ))}
    </NavigationDrawerSection>
  );
};
```

### Phase 2: Breadcrumb Integration
```typescript
// HVAC Breadcrumb Integration
export const HvacBreadcrumb = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const getBreadcrumbItems = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments[0] !== 'hvac') return [];
    
    const breadcrumbs = [
      { label: t('hvac.navigation.title'), to: '/hvac' }
    ];
    
    if (pathSegments[1]) {
      breadcrumbs.push({
        label: t(`hvac.${pathSegments[1]}.title`),
        to: `/hvac/${pathSegments[1]}`
      });
    }
    
    return breadcrumbs;
  }, [location.pathname, t]);
  
  return <Breadcrumb items={getBreadcrumbItems()} />;
};
```

### Phase 3: Search Integration
```typescript
// HVAC Search Integration
export const useHvacSearch = () => {
  const { searchQuery } = useGlobalSearch();
  
  const searchHvacEntities = useCallback(async (query: string) => {
    const results = await Promise.all([
      searchHvacEquipment(query),
      searchHvacServiceOrders(query),
      searchHvacCustomers(query)
    ]);
    
    return results.flat();
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      searchHvacEntities(searchQuery);
    }
  }, [searchQuery, searchHvacEntities]);
};
```

## Validation & Testing Strategy

### Navigation Tests
```typescript
describe('HVAC Navigation Integration', () => {
  it('should render HVAC navigation section', () => {
    render(<HvacNavigationSection />);
    expect(screen.getByText('HVAC')).toBeInTheDocument();
  });
  
  it('should navigate to HVAC dashboard', async () => {
    render(<HvacNavigationSection />);
    fireEvent.click(screen.getByText('Panel HVAC'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/hvac/dashboard');
    });
  });
  
  it('should load navigation within 100ms', async () => {
    const startTime = performance.now();
    render(<HvacNavigationSection />);
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(100);
  });
});
```

### Mobile Navigation Tests
```typescript
describe('Mobile HVAC Navigation', () => {
  it('should render mobile-optimized navigation', () => {
    mockIsMobile(true);
    render(<HvacNavigationSection />);
    expect(screen.queryByText('Raporty')).not.toBeInTheDocument();
  });
});
```

## Integration Points

### Main Navigation Integration
```typescript
// Update MainNavigationDrawerScrollableItems.tsx
import { HvacNavigationSection } from '@/hvac/components/navigation';

export const MainNavigationDrawerScrollableItems = () => {
  return (
    <NavigationDrawerScrollableItemsContainer>
      {/* Existing CRM navigation */}
      <NavigationDrawerSection>
        <NavigationDrawerItem label="People" Icon={IconUser} to="/people" />
        <NavigationDrawerItem label="Companies" Icon={IconBuildingSkyscraper} to="/companies" />
      </NavigationDrawerSection>
      
      {/* HVAC Navigation Integration */}
      <HvacNavigationSection />
    </NavigationDrawerScrollableItemsContainer>
  );
};
```

### Route Configuration
```typescript
// HVAC Routes Integration
export const hvacRoutes = [
  {
    path: '/hvac/dashboard',
    element: <HvacDashboard />,
    breadcrumb: 'hvac.dashboard.title'
  },
  {
    path: '/hvac/equipment',
    element: <HvacEquipment />,
    breadcrumb: 'hvac.equipment.title'
  },
  {
    path: '/hvac/service-orders',
    element: <HvacServiceOrders />,
    breadcrumb: 'hvac.service-orders.title'
  }
];
```

## Success Metrics

### Performance Metrics
- Navigation load time < 100ms
- Search response time < 200ms
- Mobile navigation responsiveness

### User Experience Metrics
- Navigation discoverability score
- User task completion rate
- Mobile usability score

### Technical Metrics
- Bundle size impact
- Memory usage optimization
- Accessibility compliance

---

**"Piękna unifikacja w pełnym stylu twenty crm"** 🌟
**Perfect navigation integration for HVAC excellence** 🚀
