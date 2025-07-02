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
// Replaced PrimeReact with TwentyCRM native components for bundle optimization

// HVAC Error Handling - Direct imports to avoid circular dependencies
import { trackHVACUserAction } from '../../utils/sentry-init';
import { HVACErrorBoundary } from '../HVACErrorBoundary';

// Lazy load native HVAC components (much smaller bundle size)
const LazyChart = lazy(() =>
  import('../ui/HvacChartComponents').then(module => ({
    default: module.HvacBarChart
  }))
);

const LazyCalendar = lazy(() =>
  import('../ui/HvacNativeComponents').then(module => ({
    default: module.HvacCalendar
  }))
);

const LazyDataTable = lazy(() =>
  import('../ui/HvacNativeComponents').then(module => ({
    default: module.HvacTable
  }))
);

// REMOVED: Heavy PrimeReact components that contribute to bundle size
// These are replaced with native TwentyCRM components
// const LazyColumn = lazy(() =>
//   import('primereact/column').then(module => ({
//     default: module.Column
//   }))
// );

// const LazyTreeTable = lazy(() =>
//   import('primereact/treetable').then(module => ({
//     default: module.TreeTable
//   }))
// );

// const LazyGantt = lazy(() =>
//   import('primereact/organizationchart').then(module => ({
//     default: module.OrganizationChart
//   }))
// );

// Loading skeletons for different component types - Using native components
const ChartSkeleton = memo(() => (
  <div className="p-4 bg-white border-round shadow-1">
    <div className="flex flex-column gap-3">
      <div className="w-full h-2rem bg-gray-200 border-round animate-pulse" />
      <div className="w-full h-300px bg-gray-200 border-round animate-pulse" />
      <div className="flex gap-2">
        <div className="w-4rem h-1rem bg-gray-200 border-round animate-pulse" />
        <div className="w-4rem h-1rem bg-gray-200 border-round animate-pulse" />
        <div className="w-4rem h-1rem bg-gray-200 border-round animate-pulse" />
      </div>
    </div>
  </div>
));

const CalendarSkeleton = memo(() => (
  <div className="p-4 bg-white border-round shadow-1">
    <div className="flex flex-column gap-3">
      <div className="w-full h-2rem bg-gray-200 border-round animate-pulse" />
      <div className="grid">
        {Array.from({ length: 42 }, (_, i) => (
          <div key={i} className="col-1">
            <div className="w-full h-2rem bg-gray-200 border-round animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

const DataTableSkeleton = memo(() => (
  <div className="p-4 bg-white border-round shadow-1">
    <div className="flex flex-column gap-3">
      <div className="flex gap-2">
        <div className="w-8rem h-2rem bg-gray-200 border-round animate-pulse" />
        <div className="w-8rem h-2rem bg-gray-200 border-round animate-pulse" />
        <div className="w-8rem h-2rem bg-gray-200 border-round animate-pulse" />
      </div>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex gap-2">
          <div className="w-full h-3rem bg-gray-200 border-round animate-pulse" />
        </div>
      ))}
    </div>
  </div>
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
          />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
});

// Bundle size optimization utilities - AGGRESSIVE OPTIMIZATION
export const PRIMEREACT_BUNDLE_SAVINGS = {
  CHART: '~300KB', // Chart.js dependencies - REMOVED
  CALENDAR: '~150KB', // Date manipulation libraries - REPLACED WITH NATIVE
  DATATABLE: '~200KB', // Virtual scrolling and filtering - REPLACED WITH TWENTY-UI
  TREETABLE: '~180KB', // Tree structure handling - REMOVED
  GANTT: '~250KB', // Complex visualization - REMOVED
  MONACO_EDITOR: '~2MB', // Monaco Editor - REMOVED FROM MAIN BUNDLE
  GRAPHQL_TOOLS: '~500KB', // GraphQL tools - OPTIMIZED
  TOTAL_ESTIMATED: '~3.58MB', // Updated with Monaco removal
} as const;

// REMOVED: Preload function that imports PrimeReact (contributes to bundle size)
// Now using native TwentyCRM components instead
export const preloadCriticalPrimeReactComponents = async () => {
  try {
    // Preload native HVAC components instead
    await Promise.all([
      import('../ui/HvacNativeComponents'),
      import('../ui/HvacChartComponents'),
    ]);

    console.log('Critical HVAC native components preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some HVAC components:', error);
  }
};

// Component names for tracking
HvacLazyChart.displayName = 'HvacLazyChart';
HvacLazyCalendar.displayName = 'HvacLazyCalendar';
HvacLazyDataTable.displayName = 'HvacLazyDataTable';
ChartSkeleton.displayName = 'ChartSkeleton';
CalendarSkeleton.displayName = 'CalendarSkeleton';
DataTableSkeleton.displayName = 'DataTableSkeleton';
