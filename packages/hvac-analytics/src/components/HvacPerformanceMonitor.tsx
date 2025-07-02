/**
 * HVAC Performance Monitor Component
 * "Pasja rodzi profesjonalizm" - Professional Performance Monitoring
 * 
 * Features:
 * - Real-time performance monitoring
 * - KPI tracking and alerts
 * - Trend analysis and forecasting
 * - Automated performance reports
 * - Benchmark comparisons
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Knob } from 'primereact/knob';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { Toast } from 'primereact/toast';
import { Timeline } from 'primereact/timeline';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { classNames } from 'primereact/utils';

// Types
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  lastUpdated: Date;
  history: number[];
}

interface PerformanceAlert {
  id: string;
  metric: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface BenchmarkData {
  metric: string;
  current: number;
  industry: number;
  best: number;
  unit: string;
}

export const HvacPerformanceMonitor: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [loading, setLoading] = useState(false);

  // Chart data
  const [trendChart, setTrendChart] = useState<any>({});
  const [benchmarkChart, setBenchmarkChart] = useState<any>({});

  // Mock data initialization
  useEffect(() => {
    const mockMetrics: PerformanceMetric[] = [
      {
        id: 'response-time',
        name: 'Czas odpowiedzi na awarie',
        value: 18,
        target: 15,
        unit: 'min',
        trend: 'DOWN',
        status: 'WARNING',
        lastUpdated: new Date(),
        history: [22, 20, 19, 18, 17, 18, 18],
      },
      {
        id: 'first-fix-rate',
        name: 'Wskaźnik pierwszej naprawy',
        value: 89,
        target: 85,
        unit: '%',
        trend: 'UP',
        status: 'GOOD',
        lastUpdated: new Date(),
        history: [85, 86, 87, 88, 89, 89, 89],
      },
      {
        id: 'customer-satisfaction',
        name: 'Zadowolenie klientów',
        value: 4.6,
        target: 4.5,
        unit: '/5',
        trend: 'STABLE',
        status: 'GOOD',
        lastUpdated: new Date(),
        history: [4.5, 4.5, 4.6, 4.6, 4.6, 4.6, 4.6],
      },
      {
        id: 'technician-utilization',
        name: 'Wykorzystanie techników',
        value: 87,
        target: 80,
        unit: '%',
        trend: 'UP',
        status: 'GOOD',
        lastUpdated: new Date(),
        history: [82, 83, 85, 86, 87, 87, 87],
      },
      {
        id: 'route-efficiency',
        name: 'Efektywność tras',
        value: 92,
        target: 90,
        unit: '%',
        trend: 'UP',
        status: 'GOOD',
        lastUpdated: new Date(),
        history: [88, 89, 90, 91, 92, 92, 92],
      },
      {
        id: 'cost-per-job',
        name: 'Koszt na zlecenie',
        value: 180,
        target: 200,
        unit: 'PLN',
        trend: 'DOWN',
        status: 'GOOD',
        lastUpdated: new Date(),
        history: [195, 190, 185, 182, 180, 180, 180],
      },
    ];

    const mockAlerts: PerformanceAlert[] = [
      {
        id: 'alert-1',
        metric: 'Czas odpowiedzi na awarie',
        severity: 'WARNING',
        message: 'Czas odpowiedzi przekroczył cel o 3 minuty',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        acknowledged: false,
      },
      {
        id: 'alert-2',
        metric: 'Wykorzystanie techników',
        severity: 'INFO',
        message: 'Wykorzystanie techników osiągnęło optymalny poziom',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        acknowledged: true,
      },
    ];

    const mockBenchmarks: BenchmarkData[] = [
      {
        metric: 'Czas odpowiedzi',
        current: 18,
        industry: 25,
        best: 12,
        unit: 'min',
      },
      {
        metric: 'Pierwsza naprawa',
        current: 89,
        industry: 82,
        best: 95,
        unit: '%',
      },
      {
        metric: 'Zadowolenie klientów',
        current: 4.6,
        industry: 4.2,
        best: 4.8,
        unit: '/5',
      },
      {
        metric: 'Efektywność tras',
        current: 92,
        industry: 85,
        best: 96,
        unit: '%',
      },
    ];

    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
    setBenchmarks(mockBenchmarks);
  }, []);

  // Initialize charts
  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#ffffff';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#374151';

    // Trend chart
    const trendData = {
      labels: ['6h temu', '5h temu', '4h temu', '3h temu', '2h temu', '1h temu', 'Teraz'],
      datasets: metrics.map((metric, index) => ({
        label: metric.name,
        data: metric.history,
        fill: false,
        borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][index % 6],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][index % 6],
        tension: 0.4,
      })),
    };

    const trendOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };

    // Benchmark chart
    const benchmarkData = {
      labels: benchmarks.map(b => b.metric),
      datasets: [
        {
          label: 'Aktualny',
          data: benchmarks.map(b => b.current),
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderWidth: 1,
        },
        {
          label: 'Branża',
          data: benchmarks.map(b => b.industry),
          backgroundColor: '#f59e0b',
          borderColor: '#f59e0b',
          borderWidth: 1,
        },
        {
          label: 'Najlepszy',
          data: benchmarks.map(b => b.best),
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        },
      ],
    };

    const benchmarkOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };

    setTrendChart({ data: trendData, options: trendOptions });
    setBenchmarkChart({ data: benchmarkData, options: benchmarkOptions });
  }, [metrics, benchmarks]);

  // Timeframe options
  const timeframeOptions = [
    { label: '24 godziny', value: '24h' },
    { label: '7 dni', value: '7d' },
    { label: '30 dni', value: '30d' },
    { label: '90 dni', value: '90d' },
  ];

  // Get metric status color
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      GOOD: 'success',
      WARNING: 'warning',
      CRITICAL: 'danger',
    };
    return colors[status as keyof typeof colors] || 'info';
  }, []);

  // Get trend icon
  const getTrendIcon = useCallback((trend: string) => {
    const icons = {
      UP: 'pi-trending-up',
      DOWN: 'pi-trending-down',
      STABLE: 'pi-minus',
    };
    return icons[trend as keyof typeof icons] || 'pi-minus';
  }, []);

  // Get trend color
  const getTrendColor = useCallback((trend: string, status: string) => {
    if (status === 'GOOD') {
      return trend === 'UP' ? 'text-green-400' : trend === 'DOWN' ? 'text-blue-400' : 'text-gray-400';
    } else {
      return trend === 'UP' ? 'text-red-400' : trend === 'DOWN' ? 'text-green-400' : 'text-gray-400';
    }
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
    
    toast.current?.show({
      severity: 'success',
      summary: 'Alert potwierdzony',
      detail: 'Alert został oznaczony jako przeczytany',
      life: 3000,
    });
  }, []);

  // Alert severity template
  const alertSeverityTemplate = (alert: PerformanceAlert) => {
    const severityConfig = {
      INFO: { label: 'Info', severity: 'info' },
      WARNING: { label: 'Ostrzeżenie', severity: 'warning' },
      CRITICAL: { label: 'Krytyczny', severity: 'danger' },
    }[alert.severity];

    return <Tag value={severityConfig.label} severity={severityConfig.severity as any} />;
  };

  // Alert actions template
  const alertActionsTemplate = (alert: PerformanceAlert) => {
    return (
      <div className="flex gap-2">
        {!alert.acknowledged && (
          <Button
            icon="pi pi-check"
            className="p-button-sm p-button-success"
            tooltip="Potwierdź"
            onClick={() => acknowledgeAlert(alert.id)}
          />
        )}
        <Button
          icon="pi pi-eye"
          className="p-button-sm p-button-outlined"
          tooltip="Szczegóły"
        />
      </div>
    );
  };

  // Toolbar content
  const toolbarStartContent = (
    <div className="flex align-items-center gap-3">
      <h2 className="text-xl font-bold text-white">Monitor Wydajności</h2>
      <div className="flex align-items-center gap-2">
        <span className="text-gray-400 text-sm">Czas rzeczywisty:</span>
        <InputSwitch
          checked={realTimeEnabled}
          onChange={(e) => setRealTimeEnabled(e.value)}
        />
      </div>
    </div>
  );

  const toolbarEndContent = (
    <div className="flex gap-2">
      <Dropdown
        value={selectedTimeframe}
        options={timeframeOptions}
        onChange={(e) => setSelectedTimeframe(e.value)}
        placeholder="Wybierz okres"
      />
      <Button
        icon="pi pi-refresh"
        className="p-button-outlined"
        tooltip="Odśwież dane"
      />
      <Button
        icon="pi pi-cog"
        className="p-button-outlined"
        tooltip="Ustawienia"
      />
    </div>
  );

  return (
    <div className="hvac-performance-monitor">
      <Toast ref={toast} />

      {/* Toolbar */}
      <Toolbar
        start={toolbarStartContent}
        end={toolbarEndContent}
        className="mb-4 bg-gray-800 border-gray-700"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map(metric => (
          <Card key={metric.id} className="bg-gray-800 border-gray-700">
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <h4 className="text-white font-medium text-sm mb-1">{metric.name}</h4>
                <div className="flex align-items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    {metric.value}{metric.unit}
                  </span>
                  <i className={classNames(
                    'pi text-sm',
                    getTrendIcon(metric.trend),
                    getTrendColor(metric.trend, metric.status)
                  )} />
                </div>
              </div>
              <Tag
                value={metric.status}
                severity={getStatusColor(metric.status) as any}
                className="text-xs"
              />
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-gray-400 text-xs">Cel: {metric.target}{metric.unit}</span>
              <span className="text-gray-400 text-xs">
                {metric.lastUpdated.toLocaleTimeString('pl-PL')}
              </span>
            </div>
            
            <ProgressBar
              value={Math.min((metric.value / metric.target) * 100, 100)}
              className="h-1"
            />
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-white font-semibold mb-4">Trendy wydajności</h3>
          <Chart 
            type="line" 
            data={trendChart.data} 
            options={trendChart.options}
            style={{ height: '300px' }}
          />
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-white font-semibold mb-4">Porównanie z branżą</h3>
          <Chart 
            type="bar" 
            data={benchmarkChart.data} 
            options={benchmarkChart.options}
            style={{ height: '300px' }}
          />
        </Card>
      </div>

      {/* Alerts */}
      <Card className="bg-gray-800 border-gray-700">
        <div className="flex justify-content-between align-items-center mb-4">
          <h3 className="text-white font-semibold">Alerty wydajności</h3>
          <Badge
            value={alerts.filter(alert => !alert.acknowledged).length}
            severity="danger"
          />
        </div>
        
        <DataTable
          value={alerts}
          className="p-datatable-sm"
          emptyMessage="Brak alertów"
        >
          <Column field="metric" header="Metryka" />
          <Column field="severity" header="Ważność" body={alertSeverityTemplate} />
          <Column field="message" header="Wiadomość" />
          <Column 
            field="timestamp" 
            header="Czas"
            body={(alert) => alert.timestamp.toLocaleString('pl-PL')}
          />
          <Column 
            field="acknowledged" 
            header="Status"
            body={(alert) => alert.acknowledged ? 
              <Tag value="Potwierdzone" severity="success" /> : 
              <Tag value="Nowe" severity="warning" />
            }
          />
          <Column header="Akcje" body={alertActionsTemplate} />
        </DataTable>
      </Card>
    </div>
  );
};
