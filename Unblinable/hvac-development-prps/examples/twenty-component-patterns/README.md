# TwentyCRM Component Patterns for HVAC Development

Wzorce komponentów TwentyCRM do wykorzystania w rozwoju modułów HVAC. Każdy przykład pokazuje prawidłowe implementacje zgodne z architekturą TwentyCRM.

## 🎯 Kluczowe Zasady

### 1. **Functional Components Only**
```typescript
// ✅ Correct - Functional component with named export
export const HVACDashboard = () => {
  return <div>HVAC Dashboard</div>;
};

// ❌ Incorrect - Class component
export class HVACDashboard extends React.Component {
  render() {
    return <div>HVAC Dashboard</div>;
  }
}
```

### 2. **Named Exports Only**
```typescript
// ✅ Correct - Named export
export const HVACComponent = () => {
  return <div>Component</div>;
};

// ❌ Incorrect - Default export
const HVACComponent = () => {
  return <div>Component</div>;
};
export default HVACComponent;
```

### 3. **Types Over Interfaces**
```typescript
// ✅ Correct - Type declaration
export type HVACSystemData = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  temperature: number;
  efficiency: number;
};

// ❌ Incorrect - Interface declaration
export interface HVACSystemData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
}
```

### 4. **Specific Twenty-UI Imports**
```typescript
// ✅ Correct - Specific imports
import { IconBuildingSkyscraper, IconChartCandle } from 'twenty-ui/display';
import { Button, Input } from 'twenty-ui/input';
import { Card, Section } from 'twenty-ui/layout';

// ❌ Incorrect - Generic import
import { IconBuildingSkyscraper, Button, Card } from 'twenty-ui';
```

### 5. **Event Handlers Over useEffect**
```typescript
// ✅ Correct - Event handler approach
export const HVACControl = () => {
  const handleTemperatureChange = (temperature: number) => {
    updateHVACTemperature(temperature);
  };

  return (
    <Input 
      onChange={handleTemperatureChange}
      placeholder="Temperature"
    />
  );
};

// ❌ Less preferred - useEffect approach
export const HVACControl = () => {
  const [temperature, setTemperature] = useState(20);

  useEffect(() => {
    updateHVACTemperature(temperature);
  }, [temperature]);

  return (
    <Input 
      value={temperature}
      onChange={setTemperature}
    />
  );
};
```

## 📋 Component Structure Examples

### Basic HVAC Component
```typescript
import { useState, useCallback } from 'react';
import { IconBuildingSkyscraper } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Card } from 'twenty-ui/layout';

export type HVACSystemProps = {
  systemId: string;
  onStatusChange?: (status: string) => void;
};

export const HVACSystemCard = ({ 
  systemId, 
  onStatusChange 
}: HVACSystemProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusToggle = useCallback(async () => {
    setIsLoading(true);
    try {
      const newStatus = await toggleSystemStatus(systemId);
      onStatusChange?.(newStatus);
    } finally {
      setIsLoading(false);
    }
  }, [systemId, onStatusChange]);

  return (
    <Card>
      <IconBuildingSkyscraper size="md" />
      <Button 
        onClick={handleStatusToggle}
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Toggle Status'}
      </Button>
    </Card>
  );
};
```

### HVAC Dashboard Layout
```typescript
import { Suspense, lazy } from 'react';
import { PageBody, PageContainer } from 'twenty-ui/layout';
import { LoadingSpinner } from 'twenty-ui/display';

// Lazy loading for performance
const HVACMetrics = lazy(() => import('./HVACMetrics'));
const HVACAlerts = lazy(() => import('./HVACAlerts'));

export const HVACDashboard = () => {
  return (
    <PageContainer>
      <PageBody>
        <Suspense fallback={<LoadingSpinner />}>
          <HVACMetrics />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <HVACAlerts />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
};
```

### HVAC Form Component
```typescript
import { useState } from 'react';
import { Input, Button, Select } from 'twenty-ui/input';
import { Card, Section } from 'twenty-ui/layout';

export type HVACServiceOrderForm = {
  customerId: string;
  serviceType: 'maintenance' | 'repair' | 'installation';
  priority: 'low' | 'medium' | 'high';
  description: string;
};

export const HVACServiceOrderForm = () => {
  const [formData, setFormData] = useState<HVACServiceOrderForm>({
    customerId: '',
    serviceType: 'maintenance',
    priority: 'medium',
    description: ''
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitServiceOrder(formData);
  };

  const handleFieldChange = (field: keyof HVACServiceOrderForm) => 
    (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

  return (
    <Card>
      <Section title="New Service Order">
        <form onSubmit={handleSubmit}>
          <Input
            label="Customer ID"
            value={formData.customerId}
            onChange={handleFieldChange('customerId')}
            required
          />
          <Select
            label="Service Type"
            value={formData.serviceType}
            onChange={handleFieldChange('serviceType')}
            options={[
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'repair', label: 'Repair' },
              { value: 'installation', label: 'Installation' }
            ]}
          />
          <Select
            label="Priority"
            value={formData.priority}
            onChange={handleFieldChange('priority')}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={handleFieldChange('description')}
            multiline
            rows={4}
          />
          <Button type="submit">
            Create Service Order
          </Button>
        </form>
      </Section>
    </Card>
  );
};
```

## 🎨 Styling Patterns

### TwentyCRM Theme Usage
```typescript
import { useTheme } from 'twenty-ui/theme';

export const HVACStatusIndicator = ({ status }: { status: string }) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'active': return theme.color.green;
      case 'warning': return theme.color.orange;
      case 'error': return theme.color.red;
      default: return theme.color.gray;
    }
  };

  return (
    <div style={{ 
      backgroundColor: getStatusColor(),
      padding: theme.spacing(2),
      borderRadius: theme.border.radius.sm
    }}>
      Status: {status}
    </div>
  );
};
```

### Responsive Design
```typescript
import { useIsMobile } from 'twenty-ui/utilities';

export const HVACEquipmentList = () => {
  const isMobile = useIsMobile();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px'
    }}>
      {/* Equipment cards */}
    </div>
  );
};
```

## 🔧 Performance Patterns

### Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HVACAnalyticsChart = lazy(() => import('./HVACAnalyticsChart'));

export const HVACAnalytics = () => {
  return (
    <Suspense fallback={<div>Loading analytics...</div>}>
      <HVACAnalyticsChart />
    </Suspense>
  );
};
```

### Memoization
```typescript
import { memo, useMemo } from 'react';

export const HVACMetricsCard = memo(({ data }: { data: HVACData[] }) => {
  const processedMetrics = useMemo(() => {
    return data.map(item => ({
      ...item,
      efficiency: calculateEfficiency(item)
    }));
  }, [data]);

  return (
    <Card>
      {processedMetrics.map(metric => (
        <div key={metric.id}>{metric.efficiency}%</div>
      ))}
    </Card>
  );
});
```

## 📱 Mobile Patterns

### Touch-Friendly Controls
```typescript
export const HVACMobileControl = () => {
  return (
    <Button
      style={{
        minHeight: '44px', // Touch-friendly minimum
        fontSize: '16px',   // Prevent zoom on iOS
        padding: '12px 24px'
      }}
    >
      Control HVAC
    </Button>
  );
};
```

---

**"Piękna unifikacja w pełnym stylu twenty crm"** 🌟
**Perfect component patterns for HVAC excellence** 🚀
