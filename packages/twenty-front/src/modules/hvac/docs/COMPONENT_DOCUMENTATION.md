# 🧩 HVAC Components Documentation

**"Pasja rodzi profesjonalizm"** - Complete component reference for HVAC CRM

## 📋 Overview

This document provides comprehensive documentation for all HVAC CRM components, following Twenty CRM design patterns and Polish business requirements.

## 🏗️ Component Architecture

### Component Categories

1. **Dashboard Components** - Main dashboard and overview
2. **Search Components** - Semantic search functionality
3. **Service Components** - Service ticket management
4. **Equipment Components** - Equipment tracking and maintenance
5. **Customer Components** - Customer 360 views
6. **Analytics Components** - Performance and business analytics
7. **Mobile Components** - Mobile-optimized interfaces
8. **Lazy Components** - Performance-optimized lazy loading

## 📊 Dashboard Components

### HvacDashboard

Main dashboard component providing overview of HVAC operations.

**Location:** `src/modules/hvac/components/HvacDashboard.tsx`

**Props:**
```typescript
interface HvacDashboardProps {
  className?: string;
  onTabChange?: (tab: string) => void;
  initialTab?: 'overview' | 'search' | 'tickets' | 'equipment' | 'analytics';
  showWelcome?: boolean;
}
```

**Usage:**
```tsx
import { HvacDashboard } from '@/modules/hvac';

<HvacDashboard
  initialTab="overview"
  onTabChange={(tab) => console.log('Tab changed:', tab)}
  showWelcome={true}
/>
```

**Features:**
- ✅ Polish localization
- ✅ Dark theme support
- ✅ Responsive design
- ✅ Performance monitoring
- ✅ Error boundaries

### HvacDashboardStats

Statistics cards for dashboard overview.

**Props:**
```typescript
interface HvacDashboardStatsProps {
  stats: {
    activeTickets: number;
    completedToday: number;
    techniciansActive: number;
    equipmentAlerts: number;
  };
  loading?: boolean;
  onStatClick?: (statType: string) => void;
}
```

**Usage:**
```tsx
<HvacDashboardStats
  stats={{
    activeTickets: 25,
    completedToday: 8,
    techniciansActive: 12,
    equipmentAlerts: 3
  }}
  onStatClick={(type) => navigateToDetail(type)}
/>
```

## 🔍 Search Components

### HvacSemanticSearch

AI-powered semantic search component with Weaviate integration.

**Location:** `src/modules/hvac/components/HvacSemanticSearch.tsx`

**Props:**
```typescript
interface HvacSemanticSearchProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string, results: SearchResult[]) => void;
  onError?: (error: Error) => void;
  filters?: SearchFilters;
  debounceDelay?: number; // Default: 300ms
}
```

**Usage:**
```tsx
import { HvacSemanticSearch } from '@/modules/hvac';

<HvacSemanticSearch
  placeholder="Szukaj w systemie HVAC..."
  onSearch={(query, results) => {
    console.log(`Found ${results.length} results for: ${query}`);
  }}
  filters={{
    types: ['service_tickets', 'equipment'],
    dateRange: { start: '2024-01-01', end: '2024-12-31' }
  }}
  debounceDelay={300}
/>
```

**Features:**
- ✅ 300ms debounced search (Twenty CRM standard)
- ✅ Polish HVAC terminology support
- ✅ Advanced filtering
- ✅ Search suggestions
- ✅ Performance monitoring

### SearchResults

Display search results with highlighting and pagination.

**Props:**
```typescript
interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  highlightQuery?: string;
  pagination?: PaginationConfig;
}
```

## 🎫 Service Ticket Components

### HvacServiceTicketList

List view for service tickets with filtering and sorting.

**Props:**
```typescript
interface HvacServiceTicketListProps {
  tickets?: ServiceTicket[];
  loading?: boolean;
  onTicketClick?: (ticket: ServiceTicket) => void;
  onStatusChange?: (ticketId: string, status: TicketStatus) => void;
  filters?: TicketFilters;
  sortBy?: TicketSortField;
  sortOrder?: 'asc' | 'desc';
}
```

**Usage:**
```tsx
<HvacServiceTicketList
  tickets={tickets}
  onTicketClick={(ticket) => openTicketDetail(ticket.id)}
  onStatusChange={(id, status) => updateTicketStatus(id, status)}
  filters={{ status: 'open', priority: 'high' }}
  sortBy="scheduledDate"
  sortOrder="asc"
/>
```

### ServiceTicketCard

Individual service ticket card component.

**Props:**
```typescript
interface ServiceTicketCardProps {
  ticket: ServiceTicket;
  onClick?: () => void;
  onStatusChange?: (status: TicketStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}
```

## 🔧 Equipment Components

### HvacEquipmentTracker

Equipment tracking and maintenance overview.

**Props:**
```typescript
interface HvacEquipmentTrackerProps {
  equipment: Equipment[];
  onEquipmentClick?: (equipment: Equipment) => void;
  onMaintenanceSchedule?: (equipmentId: string) => void;
  filters?: EquipmentFilters;
  viewMode?: 'list' | 'grid' | 'map';
}
```

**Features:**
- Equipment status monitoring
- Maintenance scheduling
- Location tracking
- Performance metrics

## 👥 Customer Components

### Customer360Container

Complete customer 360-degree view with lazy loading.

**Props:**
```typescript
interface Customer360ContainerProps {
  customerId: string;
  initialTab?: 'profile' | 'equipment' | 'tickets' | 'analytics' | 'communication';
  onTabChange?: (tab: string) => void;
  onError?: (error: Error) => void;
}
```

**Usage:**
```tsx
<Customer360Container
  customerId="customer-uuid"
  initialTab="profile"
  onTabChange={(tab) => trackTabChange(tab)}
  onError={(error) => reportError(error)}
/>
```

**Lazy Loaded Tabs:**
- Profile information
- Equipment list
- Service history
- Analytics dashboard
- Communication history

## 📱 Mobile Components

### HvacMobileDashboard

Mobile-optimized dashboard for technicians.

**Props:**
```typescript
interface HvacMobileDashboardProps {
  technicianId: string;
  onJobSelect?: (job: ServiceTicket) => void;
  onLocationUpdate?: (location: GeoLocation) => void;
  showNavigation?: boolean;
}
```

**Features:**
- GPS location tracking
- Offline capability
- Touch-optimized interface
- Real-time job updates

### HvacMobileJobCard

Mobile job card for technicians.

**Props:**
```typescript
interface HvacMobileJobCardProps {
  job: ServiceTicket;
  onStatusUpdate?: (status: TicketStatus) => void;
  onNavigate?: () => void;
  onCall?: () => void;
  showActions?: boolean;
}
```

## 🚀 Lazy Loading Components

### LazyAnalyticsDashboard

Lazy-loaded analytics dashboard with Chart.js integration.

**Bundle Size:** ~500KB (Chart.js + D3.js dependencies)

**Props:**
```typescript
interface LazyAnalyticsDashboardProps {
  dateRange?: DateRange;
  metrics?: AnalyticsMetrics[];
  onRefresh?: () => void;
  onError?: (error: Error) => void;
}
```

**Usage:**
```tsx
import { LazyAnalyticsDashboard } from '@/modules/hvac/components/lazy';

<Suspense fallback={<AnalyticsLoadingSkeleton />}>
  <LazyAnalyticsDashboard
    dateRange={{ start: '2024-01-01', end: '2024-12-31' }}
    metrics={['revenue', 'tickets', 'satisfaction']}
    onRefresh={() => refetchData()}
  />
</Suspense>
```

### LazyKanbanBoard

Lazy-loaded Kanban board for service ticket management.

**Bundle Size:** ~200KB (Drag-and-drop libraries)

**Props:**
```typescript
interface LazyKanbanBoardProps {
  boardId?: string;
  onCardClick?: (card: ServiceTicket) => void;
  onCardMove?: (cardId: string, newStatus: string) => void;
  onCardCreate?: (card: Partial<ServiceTicket>) => void;
}
```

## 🎨 Styling Guidelines

### Theme Integration

All components follow Twenty CRM theming:

```tsx
import { useTheme } from '@/modules/ui/theme/hooks/useTheme';

const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <div style={{
      backgroundColor: theme.background.primary,
      color: theme.font.color.primary,
      borderRadius: theme.border.radius.md,
    }}>
      Content
    </div>
  );
};
```

### Polish Localization

Use the translation system for all text:

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('hvac');
  
  return (
    <h1>{t('dashboard.title')}</h1>
  );
};
```

## 🔧 Performance Optimization

### Debouncing

All search and filter components use 300ms debouncing:

```tsx
import { useHVACDebouncedPerformance } from '@/modules/hvac/hooks';

const SearchComponent = () => {
  const { debouncedSearch } = useHVACDebouncedPerformance({
    debounceDelay: 300
  });
  
  const handleSearch = (query: string) => {
    debouncedSearch(() => performSearch(query));
  };
};
```

### Lazy Loading

Use React.lazy for heavy components:

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const ParentComponent = () => (
  <Suspense fallback={<LoadingSkeleton />}>
    <HeavyComponent />
  </Suspense>
);
```

## 🧪 Testing

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { HvacDashboard } from '../HvacDashboard';

describe('HvacDashboard', () => {
  it('renders dashboard with correct initial tab', () => {
    render(<HvacDashboard initialTab="overview" />);
    
    expect(screen.getByText('Przegląd')).toBeInTheDocument();
  });
  
  it('handles tab changes correctly', () => {
    const onTabChange = jest.fn();
    render(<HvacDashboard onTabChange={onTabChange} />);
    
    fireEvent.click(screen.getByText('Wyszukiwanie'));
    expect(onTabChange).toHaveBeenCalledWith('search');
  });
});
```

## 📚 Best Practices

### Component Structure

1. **Functional Components Only** - No class components
2. **Named Exports** - Always use named exports
3. **TypeScript** - Full type safety
4. **Props Interface** - Define clear prop interfaces
5. **Error Boundaries** - Wrap components in error boundaries
6. **Performance** - Use React.memo for expensive components

### Event Handling

Prefer event handlers over useEffect:

```tsx
// ✅ Good
const handleClick = useCallback(() => {
  // Handle click
}, []);

// ❌ Avoid
useEffect(() => {
  // Side effect
}, [dependency]);
```

### File Organization

```
components/
├── ComponentName/
│   ├── ComponentName.tsx
│   ├── ComponentName.test.tsx
│   ├── ComponentName.stories.tsx
│   └── index.ts
```

## 🔗 Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)

---

**Fulmark HVAC CRM** - Professional components for Polish HVAC businesses
*"Pasja rodzi profesjonalizm"* 🏆
