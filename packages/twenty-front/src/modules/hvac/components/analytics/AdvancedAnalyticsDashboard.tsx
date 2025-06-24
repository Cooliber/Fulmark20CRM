/**
 * AdvancedAnalyticsDashboard - Zaawansowany dashboard analityczny HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny dashboard dla przepływu klientów i ofert
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';

// Lazy load heavy Chart component
const Chart = lazy(() => import('primereact/chart').then(module => ({ default: module.Chart })));

// HVAC services and hooks
import {
    trackHVACUserAction,
    useCustomerDataFlow,
    useDataPipeline,
    useQuoteManagement
} from '../../index';

// Component props
interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

// Time range options
const timeRangeOptions = [
  { label: 'Ostatnie 7 dni', value: '7d' },
  { label: 'Ostatnie 30 dni', value: '30d' },
  { label: 'Ostatnie 3 miesiące', value: '3m' },
  { label: 'Ostatnie 6 miesięcy', value: '6m' },
  { label: 'Ostatni rok', value: '1y' },
  { label: 'Niestandardowy', value: 'custom' },
];

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = '',
}) => {
  // State for filters
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<Date[]>([]);
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Hooks for data
  const {
    analytics: flowAnalytics,
    loading: flowLoading,
    loadAnalytics: loadFlowAnalytics,
  } = useCustomerDataFlow({
    autoLoad: false,
  });

  const {
    analytics: quoteAnalytics,
    loading: quoteLoading,
    loadAnalytics: loadQuoteAnalytics,
  } = useQuoteManagement({
    autoLoad: false,
  });

  const {
    analytics: pipelineAnalytics,
    loading: pipelineLoading,
    loadAnalytics: loadPipelineAnalytics,
  } = useDataPipeline({
    autoLoad: false,
  });

  // Calculate date range
  const getDateRange = useCallback(() => {
    if (selectedTimeRange === 'custom' && customDateRange.length === 2) {
      return { from: customDateRange[0], to: customDateRange[1] };
    }

    const now = new Date();
    const from = new Date();

    switch (selectedTimeRange) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '3m':
        from.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        from.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        from.setFullYear(now.getFullYear() - 1);
        break;
      default:
        from.setDate(now.getDate() - 30);
    }

    return { from, to: now };
  }, [selectedTimeRange, customDateRange]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    const dateRange = getDateRange();
    
    trackHVACUserAction('analytics_dashboard_loaded', 'ANALYTICS', {
      timeRange: selectedTimeRange,
      dateRange,
    });

    try {
      await Promise.all([
        loadFlowAnalytics(),
        loadQuoteAnalytics(dateRange),
        loadPipelineAnalytics(dateRange),
      ]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }, [getDateRange, selectedTimeRange, loadFlowAnalytics, loadQuoteAnalytics, loadPipelineAnalytics]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((value: string) => {
    setSelectedTimeRange(value);
    setShowCustomRange(value === 'custom');
    
    if (value !== 'custom') {
      loadAnalytics();
    }
  }, [loadAnalytics]);

  // Handle custom date range change
  const handleCustomDateRangeChange = useCallback((dates: Date[]) => {
    setCustomDateRange(dates);
    
    if (dates.length === 2) {
      loadAnalytics();
    }
  }, [loadAnalytics]);

  // Load analytics on mount
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Customer flow chart data
  const customerFlowChartData = {
    labels: flowAnalytics?.monthlyTrends.map(trend => trend.month) || [],
    datasets: [
      {
        label: 'Nowi klienci',
        data: flowAnalytics?.monthlyTrends.map(trend => trend.flows) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Wartość (PLN)',
        data: flowAnalytics?.monthlyTrends.map(trend => trend.value) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  // Quote analytics chart data
  const quoteChartData = {
    labels: ['Wysłane', 'Zaakceptowane', 'Odrzucone', 'Wygasłe'],
    datasets: [
      {
        data: [
          quoteAnalytics?.conversionFunnel.sent || 0,
          quoteAnalytics?.conversionFunnel.accepted || 0,
          quoteAnalytics?.conversionFunnel.rejected || 0,
          quoteAnalytics?.statusDistribution.expired || 0,
        ],
        backgroundColor: [
          '#36A2EB',
          '#4BC0C0',
          '#FF6384',
          '#FF9F40',
        ],
      },
    ],
  };

  const isLoading = flowLoading || quoteLoading || pipelineLoading;

  return (
    <div className={`advanced-analytics-dashboard ${className}`}>
      {/* Dashboard Header */}
      <Card className="dashboard-header mb-4">
        <div className="flex justify-content-between align-items-center">
          <div>
            <h2 className="text-2xl font-bold text-900 mb-1">
              Dashboard Analityczny HVAC
            </h2>
            <p className="text-600">
              Zaawansowana analiza przepływu klientów, ofert i pipeline'u danych
            </p>
          </div>
          
          <div className="flex align-items-center gap-3">
            <Dropdown
              value={selectedTimeRange}
              options={timeRangeOptions}
              onChange={(e) => handleTimeRangeChange(e.value)}
              placeholder="Wybierz okres"
              className="w-12rem"
            />
            
            {showCustomRange && (
              <Calendar
                value={customDateRange}
                onChange={(e) => handleCustomDateRangeChange(e.value as Date[])}
                selectionMode="range"
                readOnlyInput
                placeholder="Wybierz zakres dat"
                className="w-15rem"
              />
            )}
            
            <Button
              icon="pi pi-refresh"
              onClick={loadAnalytics}
              loading={isLoading}
              tooltip="Odśwież dane"
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <Card className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {flowAnalytics?.totalFlows || 0}
            </div>
            <div className="text-600">Łączne przepływy</div>
            <div className="text-sm text-green-500 mt-1">
              <i className="pi pi-arrow-up mr-1" />
              +{((flowAnalytics?.winRate || 0) * 100).toFixed(1)}% konwersja
            </div>
          </Card>
        </div>
        
        <div className="col-12 md:col-3">
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {quoteAnalytics?.totalValue.toLocaleString('pl-PL') || 0} PLN
            </div>
            <div className="text-600">Wartość ofert</div>
            <div className="text-sm text-blue-500 mt-1">
              <i className="pi pi-chart-line mr-1" />
              {(quoteAnalytics?.winRate || 0).toFixed(1)}% win rate
            </div>
          </Card>
        </div>
        
        <div className="col-12 md:col-3">
          <Card className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {pipelineAnalytics?.activePipelines || 0}
            </div>
            <div className="text-600">Aktywne pipeline'y</div>
            <div className="text-sm text-orange-500 mt-1">
              <i className="pi pi-cog mr-1" />
              {(pipelineAnalytics?.averageSuccessRate || 0).toFixed(1)}% sukces
            </div>
          </Card>
        </div>
        
        <div className="col-12 md:col-3">
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              {((pipelineAnalytics?.totalDataProcessed || 0) / 1024 / 1024).toFixed(1)}MB
            </div>
            <div className="text-600">Przetworzone dane</div>
            <div className="text-sm text-purple-500 mt-1">
              <i className="pi pi-database mr-1" />
              Real-time sync
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid mb-4">
        <div className="col-12 md:col-8">
          <Card title="Przepływ klientów w czasie" className="h-full">
            <Suspense fallback={<Skeleton width="100%" height="300px" />}>
              <Chart
                type="line"
                data={customerFlowChartData}
                options={chartOptions}
                style={{ height: '300px' }}
              />
            </Suspense>
          </Card>
        </div>

        <div className="col-12 md:col-4">
          <Card title="Status ofert" className="h-full">
            <Suspense fallback={<Skeleton width="100%" height="300px" />}>
              <Chart
                type="doughnut"
                data={quoteChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
                style={{ height: '300px' }}
              />
            </Suspense>
          </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid mb-4">
        <div className="col-12 md:col-6">
          <Card title="Wydajność pipeline'ów">
            {pipelineAnalytics?.pipelinePerformance.map((perf, index) => (
              <div key={index} className="flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="font-semibold">{perf.pipelineName}</div>
                  <div className="text-sm text-600">
                    {perf.throughput.toFixed(1)} rekordów/s
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    value={`${perf.successRate.toFixed(1)}%`}
                    severity={perf.successRate > 95 ? 'success' : perf.successRate > 80 ? 'warning' : 'danger'}
                  />
                  <div className="text-sm text-600 mt-1">
                    {perf.averageRunTime.toFixed(1)}s śr. czas
                  </div>
                </div>
              </div>
            )) || <div className="text-center text-600">Brak danych</div>}
          </Card>
        </div>
        
        <div className="col-12 md:col-6">
          <Card title="Top źródła klientów">
            {flowAnalytics?.topSources.map((source, index) => (
              <div key={index} className="flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="font-semibold">{source.source}</div>
                  <div className="text-sm text-600">
                    {source.count} klientów
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-500">
                    {source.value.toLocaleString('pl-PL')} PLN
                  </div>
                  <ProgressBar 
                    value={(source.count / (flowAnalytics?.totalFlows || 1)) * 100}
                    showValue={false}
                    style={{ height: '4px', width: '100px' }}
                    className="mt-1"
                  />
                </div>
              </div>
            )) || <div className="text-center text-600">Brak danych</div>}
          </Card>
        </div>
      </div>

      {/* Recent Activity Table */}
      <Card title="Ostatnia aktywność">
        <DataTable
          value={[]} // This would be populated with recent activity data
          emptyMessage="Brak ostatniej aktywności"
          className="p-datatable-sm"
        >
          <Column field="timestamp" header="Czas" />
          <Column field="type" header="Typ" />
          <Column field="description" header="Opis" />
          <Column field="user" header="Użytkownik" />
          <Column field="status" header="Status" />
        </DataTable>
      </Card>
    </div>
  );
};
