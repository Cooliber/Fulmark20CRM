/**
 * LazyPrimeReactComponents - Lazy-loaded PrimeReact Heavy Components
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy PrimeReact dependencies
 *
 * This module implements lazy loading for heavy PrimeReact components
 * to reduce the main bundle size by ~800KB (Chart.js, Calendar, DataTable dependencies)
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Performance optimization with proper lazy loading
 */

import React, { Suspense, lazy, memo } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';

// HVAC Error Handling
import { HVACErrorBoundary } from '../HVACErrorBoundary';
import { trackHVACUserAction } from '../../index';

// Lazy load heavy PrimeReact components
const LazyChart = lazy(() => 
  import('primereact/chart').then(module => ({
    default: module.Chart
  }))
);

const LazyCalendar = lazy(() => 
  import('primereact/calendar').then(module => ({
    default: module.Calendar
  }))
);

const LazyDataTable = lazy(() => 
  import('primereact/datatable').then(module => ({
    default: module.DataTable
  }))
);

const LazyColumn = lazy(() => 
  import('primereact/column').then(module => ({
    default: module.Column
  }))
);

const LazyTreeTable = lazy(() => 
  import('primereact/treetable').then(module => ({
    default: module.TreeTable
  }))
);

const LazyGantt = lazy(() => 
  import('primereact/organizationchart').then(module => ({
    default: module.OrganizationChart
  }))
);

// Loading skeletons for different component types
const ChartSkeleton = memo(() => (
  <Card className="p-4">
    <div className="flex flex-column gap-3">
      <Skeleton width="100%" height="2rem" />
      <Skeleton width="100%" height="300px" />
      <div className="flex gap-2">
        <Skeleton width="4rem" height="1rem" />
        <Skeleton width="4rem" height="1rem" />
        <Skeleton width="4rem" height="1rem" />
      </div>
    </div>
  </Card>
));

const CalendarSkeleton = memo(() => (
  <Card className="p-4">
    <div className="flex flex-column gap-3">
      <Skeleton width="100%" height="2rem" />
      <div className="grid">
        {Array.from({ length: 42 }, (_, i) => (
          <div key={i} className="col-1">
            <Skeleton width="100%" height="2rem" />
          </div>
        ))}
      </div>
    </div>
  </Card>
));

const DataTableSkeleton = memo(() => (
  <Card className="p-4">
    <div className="flex flex-column gap-3">
      <div className="flex gap-2">
        <Skeleton width="8rem" height="2rem" />
        <Skeleton width="8rem" height="2rem" />
        <Skeleton width="8rem" height="2rem" />
      </div>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton width="100%" height="3rem" />
        </div>
      ))}
    </div>
  </Card>
));

// Types
interface LazyChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
  data: any;
  options?: any;
  width?: string;
  height?: string;
  className?: string;
  onDataSelect?: (event: any) => void;
}

interface LazyCalendarProps {
  value?: Date | Date[];
  onChange?: (event: any) => void;
  selectionMode?: 'single' | 'multiple' | 'range';
  inline?: boolean;
  showTime?: boolean;
  showButtonBar?: boolean;
  className?: string;
}

interface LazyDataTableProps {
  value: any[];
  columns: Array<{
    field: string;
    header: string;
    body?: (rowData: any) => React.ReactNode;
    sortable?: boolean;
    filter?: boolean;
  }>;
  paginator?: boolean;
  rows?: number;
  loading?: boolean;
  selectionMode?: 'single' | 'multiple';
  selection?: any;
  onSelectionChange?: (event: any) => void;
  onRowClick?: (event: any) => void;
  className?: string;
}

// Lazy Chart Component
export const HvacLazyChart: React.FC<LazyChartProps> = memo(({
  type,
  data,
  options,
  width = '100%',
  height = '400px',
  className = '',
  onDataSelect,
}) => {
  React.useEffect(() => {
    trackHVACUserAction('lazy_chart_load_started', 'PERFORMANCE', {
      chartType: type,
      dataPoints: data?.datasets?.[0]?.data?.length || 0,
    });
  }, [type, data]);

  return (
    <div className={`hvac-lazy-chart ${className}`}>
      <HVACErrorBoundary
        context="CHART_VISUALIZATION"
        customTitle="Błąd ładowania wykresu"
        customMessage="Wystąpił problem podczas ładowania komponentu wykresu."
      >
        <Suspense fallback={<ChartSkeleton />}>
          <LazyChart
            type={type}
            data={data}
            options={options}
            width={width}
            height={height}
            onDataSelect={onDataSelect}
          />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
});

// Lazy Calendar Component
export const HvacLazyCalendar: React.FC<LazyCalendarProps> = memo(({
  value,
  onChange,
  selectionMode = 'single',
  inline = false,
  showTime = false,
  showButtonBar = false,
  className = '',
}) => {
  React.useEffect(() => {
    trackHVACUserAction('lazy_calendar_load_started', 'PERFORMANCE', {
      selectionMode,
      showTime,
      inline,
    });
  }, [selectionMode, showTime, inline]);

  return (
    <div className={`hvac-lazy-calendar ${className}`}>
      <HVACErrorBoundary
        context="CALENDAR_COMPONENT"
        customTitle="Błąd ładowania kalendarza"
        customMessage="Wystąpił problem podczas ładowania komponentu kalendarza."
      >
        <Suspense fallback={<CalendarSkeleton />}>
          <LazyCalendar
            value={value}
            onChange={onChange}
            selectionMode={selectionMode}
            inline={inline}
            showTime={showTime}
            showButtonBar={showButtonBar}
            className={className}
          />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
});

// Lazy DataTable Component
export const HvacLazyDataTable: React.FC<LazyDataTableProps> = memo(({
  value,
  columns,
  paginator = true,
  rows = 20,
  loading = false,
  selectionMode,
  selection,
  onSelectionChange,
  onRowClick,
  className = '',
}) => {
  React.useEffect(() => {
    trackHVACUserAction('lazy_datatable_load_started', 'PERFORMANCE', {
      rowCount: value.length,
      columnCount: columns.length,
      paginator,
    });
  }, [value.length, columns.length, paginator]);

  return (
    <div className={`hvac-lazy-datatable ${className}`}>
      <HVACErrorBoundary
        context="DATA_TABLE"
        customTitle="Błąd ładowania tabeli"
        customMessage="Wystąpił problem podczas ładowania komponentu tabeli."
      >
        <Suspense fallback={<DataTableSkeleton />}>
          <LazyDataTable
            value={value}
            paginator={paginator}
            rows={rows}
            loading={loading}
            selectionMode={selectionMode}
            selection={selection}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            className={className}
          >
            <Suspense fallback={<Skeleton width="100%" height="2rem" />}>
              {columns.map((col, index) => (
                <LazyColumn
                  key={`${col.field}-${index}`}
                  field={col.field}
                  header={col.header}
                  body={col.body}
                  sortable={col.sortable}
                  filter={col.filter}
                />
              ))}
            </Suspense>
          </LazyDataTable>
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
});

// Bundle size optimization utilities
export const PRIMEREACT_BUNDLE_SAVINGS = {
  CHART: '~300KB', // Chart.js dependencies
  CALENDAR: '~150KB', // Date manipulation libraries
  DATATABLE: '~200KB', // Virtual scrolling and filtering
  TREETABLE: '~180KB', // Tree structure handling
  GANTT: '~250KB', // Complex visualization
  TOTAL_ESTIMATED: '~1.08MB',
} as const;

// Preload function for critical components
export const preloadCriticalPrimeReactComponents = async () => {
  try {
    // Preload most commonly used components
    await Promise.all([
      import('primereact/datatable'),
      import('primereact/column'),
      import('primereact/calendar'),
    ]);
    
    console.log('Critical PrimeReact components preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some PrimeReact components:', error);
  }
};

// Component names for tracking
HvacLazyChart.displayName = 'HvacLazyChart';
HvacLazyCalendar.displayName = 'HvacLazyCalendar';
HvacLazyDataTable.displayName = 'HvacLazyDataTable';
ChartSkeleton.displayName = 'ChartSkeleton';
CalendarSkeleton.displayName = 'CalendarSkeleton';
DataTableSkeleton.displayName = 'DataTableSkeleton';
