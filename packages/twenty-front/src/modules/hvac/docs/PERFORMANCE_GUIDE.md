# ⚡ HVAC Performance Optimization Guide

**"Pasja rodzi profesjonalizm"** - Complete performance optimization for HVAC CRM

## 📋 Overview

This guide provides comprehensive performance optimization strategies for the HVAC CRM module, ensuring optimal user experience and system efficiency.

## 🎯 Performance Targets

### Twenty CRM Standards
- **Bundle Size**: < 4.7MB (Twenty CRM limit)
- **Search Response**: < 300ms (debounced)
- **Component Load**: < 300ms
- **Memory Usage**: < 100MB
- **Cache Hit Rate**: > 70%

### HVAC-Specific Targets
- **Dashboard Load**: < 2 seconds
- **Search Results**: < 500ms
- **Real-time Updates**: < 100ms latency
- **Mobile Performance**: < 3 seconds on 3G

## 🚀 Bundle Optimization

### Code Splitting Strategy

#### 1. Route-Based Splitting
```typescript
// Lazy load HVAC pages
const HvacDashboardPage = lazy(() => import('../pages/HvacDashboardPage'));
const HvacAnalyticsPage = lazy(() => import('../pages/HvacAnalyticsPage'));

// Router configuration
{
  path: '/hvac/dashboard',
  element: (
    <Suspense fallback={<DashboardSkeleton />}>
      <HvacDashboardPage />
    </Suspense>
  )
}
```

#### 2. Component-Based Splitting
```typescript
// Heavy components with lazy loading
const LazyAnalyticsDashboard = lazy(() => 
  import('../components/lazy/LazyAnalyticsDashboard')
);

const LazyKanbanBoard = lazy(() => 
  import('../components/lazy/LazyKanbanBoard')
);

// Usage with preloading
const preloadAnalytics = () => {
  import('../components/lazy/LazyAnalyticsDashboard');
};

// Preload on hover or idle
<button 
  onMouseEnter={preloadAnalytics}
  onClick={() => setShowAnalytics(true)}
>
  Show Analytics
</button>
```

#### 3. Vendor Splitting
```typescript
// webpack.config.js optimization
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      hvacVendor: {
        test: /[\\/]node_modules[\\/](chart\.js|d3|primereact)[\\/]/,
        name: 'hvac-vendor',
        chunks: 'all',
      },
      hvacCommon: {
        test: /[\\/]src[\\/]modules[\\/]hvac[\\/]/,
        name: 'hvac-common',
        chunks: 'all',
        minChunks: 2,
      }
    }
  }
}
```

### Bundle Size Analysis

#### Current Bundle Breakdown
- **Core HVAC**: ~1.2MB
- **Chart.js Dependencies**: ~500KB
- **PrimeReact Components**: ~300KB
- **D3.js Visualizations**: ~400KB
- **Mobile Components**: ~200KB

#### Optimization Savings
- **Lazy Loading**: -30% (~1.4MB saved)
- **Tree Shaking**: -15% (~700KB saved)
- **Compression**: -20% (~900KB saved)
- **Total Potential**: -65% (~3MB saved)

## 🔍 Search Performance

### Debouncing Implementation

```typescript
import { useHVACDebouncedPerformance } from '../hooks/useHVACDebouncedPerformance';

const SearchComponent = () => {
  const { debouncedSearch } = useHVACDebouncedPerformance({
    debounceDelay: 300, // Twenty CRM standard
    enableCaching: true,
    enableMetrics: true
  });

  const handleSearch = useCallback((query: string) => {
    debouncedSearch(
      () => performSemanticSearch(query),
      `search:${query}`
    );
  }, [debouncedSearch]);

  return (
    <SearchInput
      onChange={handleSearch}
      placeholder="Szukaj w systemie HVAC..."
    />
  );
};
```

### Search Optimization Strategies

#### 1. Caching Strategy
```typescript
// Multi-tier caching
const searchCache = {
  L1: new Map(), // Memory cache (5 minutes)
  L2: sessionStorage, // Session cache (10 minutes)
  L3: indexedDB // Persistent cache (1 hour)
};

const getCachedSearch = async (query: string) => {
  // Try L1 first
  if (searchCache.L1.has(query)) {
    return searchCache.L1.get(query);
  }
  
  // Try L2
  const sessionResult = sessionStorage.getItem(`search:${query}`);
  if (sessionResult) {
    const parsed = JSON.parse(sessionResult);
    if (Date.now() - parsed.timestamp < 600000) { // 10 minutes
      searchCache.L1.set(query, parsed.data);
      return parsed.data;
    }
  }
  
  // Try L3 (IndexedDB)
  const persistentResult = await getFromIndexedDB(`search:${query}`);
  if (persistentResult && Date.now() - persistentResult.timestamp < 3600000) {
    return persistentResult.data;
  }
  
  return null;
};
```

#### 2. Query Optimization
```typescript
// Optimize search queries
const optimizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\sąćęłńóśźż]/g, '') // Keep Polish characters
    .substring(0, 100); // Limit query length
};

// Batch search requests
const batchSearchRequests = (queries: string[]) => {
  return Promise.all(
    queries.map(query => performSearch(query))
  );
};
```

## 💾 Caching Strategies

### Redis Integration

```typescript
// Server-side Redis caching
@Injectable()
export class HvacCacheService {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Client-Side Caching

```typescript
// React Query integration
import { useQuery } from '@tanstack/react-query';

const useHvacServiceTickets = (filters: TicketFilters) => {
  return useQuery({
    queryKey: ['hvac-tickets', filters],
    queryFn: () => fetchServiceTickets(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
```

## 🖥️ Component Performance

### React.memo Optimization

```typescript
// Memoize expensive components
const HvacServiceTicketCard = React.memo<ServiceTicketCardProps>(
  ({ ticket, onStatusChange, onEdit }) => {
    const handleStatusChange = useCallback(
      (status: TicketStatus) => onStatusChange(ticket.id, status),
      [ticket.id, onStatusChange]
    );

    return (
      <Card>
        <TicketHeader ticket={ticket} />
        <TicketActions 
          onStatusChange={handleStatusChange}
          onEdit={() => onEdit(ticket.id)}
        />
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.ticket.id === nextProps.ticket.id &&
      prevProps.ticket.status === nextProps.ticket.status &&
      prevProps.ticket.updatedAt === nextProps.ticket.updatedAt
    );
  }
);
```

### Virtual Scrolling

```typescript
// Large list optimization
import { FixedSizeList as List } from 'react-window';

const VirtualizedTicketList = ({ tickets }: { tickets: ServiceTicket[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <HvacServiceTicketCard ticket={tickets[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tickets.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 📱 Mobile Performance

### Progressive Web App Features

```typescript
// Service Worker for caching
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/hvac/')) {
    event.respondWith(
      caches.open('hvac-api-cache').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Serve from cache
            fetch(event.request).then(fetchResponse => {
              cache.put(event.request, fetchResponse.clone());
            });
            return response;
          }
          // Fetch and cache
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

### Image Optimization

```typescript
// Responsive images with lazy loading
const OptimizedImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      {...props}
    />
  );
};
```

## 📊 Performance Monitoring

### Real-time Metrics

```typescript
// Performance monitoring hook
const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bundleSize: 0,
    loadTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          setMetrics(prev => ({
            ...prev,
            loadTime: entry.loadEventEnd - entry.loadEventStart
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
};
```

### Performance Alerts

```typescript
// Automated performance alerts
const performanceThresholds = {
  bundleSize: 4.7 * 1024 * 1024, // 4.7MB
  loadTime: 3000, // 3 seconds
  memoryUsage: 100 * 1024 * 1024, // 100MB
  cacheHitRate: 0.7 // 70%
};

const checkPerformance = (metrics: PerformanceMetrics) => {
  Object.entries(performanceThresholds).forEach(([key, threshold]) => {
    const value = metrics[key as keyof PerformanceMetrics];
    
    if (typeof value === 'number' && value > threshold) {
      trackHVACUserAction('performance_threshold_exceeded', 'PERFORMANCE', {
        metric: key,
        value,
        threshold,
        severity: value > threshold * 1.5 ? 'critical' : 'warning'
      });
    }
  });
};
```

## 🔧 Development Tools

### Bundle Analyzer

```bash
# Analyze bundle size
npm run build:analyze

# Generate performance report
npm run performance:report

# Run performance tests
npm run test:performance
```

### Performance Testing

```typescript
// Performance test example
describe('HVAC Performance Tests', () => {
  it('should load dashboard within 2 seconds', async () => {
    const startTime = performance.now();
    
    render(<HvacDashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  it('should handle 1000 search results efficiently', async () => {
    const largeDataset = generateMockTickets(1000);
    
    const startTime = performance.now();
    render(<HvacServiceTicketList tickets={largeDataset} />);
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
});
```

## 📈 Performance Checklist

### Pre-deployment Checklist

- [ ] Bundle size < 4.7MB
- [ ] Search response < 300ms
- [ ] Component load < 300ms
- [ ] Memory usage < 100MB
- [ ] Cache hit rate > 70%
- [ ] Mobile performance < 3s on 3G
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] Error rate < 1%
- [ ] Performance monitoring enabled

### Monitoring Setup

- [ ] Sentry performance monitoring
- [ ] Real User Monitoring (RUM)
- [ ] Bundle size tracking
- [ ] Cache performance metrics
- [ ] Database query optimization
- [ ] CDN performance monitoring

## 📚 Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Setup Guide](./SETUP_GUIDE.md)

---

**Fulmark HVAC CRM** - Optimized performance for Polish HVAC businesses
*"Pasja rodzi profesjonalizm"* 🏆
