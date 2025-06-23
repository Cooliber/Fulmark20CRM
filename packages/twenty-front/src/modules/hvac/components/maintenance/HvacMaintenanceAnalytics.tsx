/**
 * HVAC Maintenance Analytics Component
 * "Pasja rodzi profesjonalizm" - Professional Maintenance Analytics
 * 
 * Features:
 * - Performance metrics and KPIs
 * - Cost analysis and trends
 * - Equipment efficiency tracking
 * - Predictive maintenance insights
 * - Compliance reporting
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Knob } from 'primereact/knob';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { TabView, TabPanel } from 'primereact/tabview';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

// Types
interface MaintenanceStats {
  totalEquipment: number;
  scheduledMaintenance: number;
  overdueMaintenance: number;
  completedThisMonth: number;
  complianceRate: number;
  costSavings: number;
  efficiency: number;
  nextMaintenanceDate: Date | null;
}

interface AnalyticsProps {
  stats: MaintenanceStats;
  chartData: any;
  chartOptions: any;
  onAnalyticsRefresh: () => void;
}

export const HvacMaintenanceAnalytics: React.FC<AnalyticsProps> = ({
  stats,
  chartData,
  chartOptions,
  onAnalyticsRefresh,
}) => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date(),
  ]);
  const [selectedMetric, setSelectedMetric] = useState('efficiency');

  // Chart data
  const [performanceChart, setPerformanceChart] = useState<any>({});
  const [costChart, setCostChart] = useState<any>({});
  const [complianceChart, setComplianceChart] = useState<any>({});

  // Initialize charts
  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#ffffff';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#374151';

    // Performance chart
    const performanceData = {
      labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'],
      datasets: [
        {
          label: 'Efektywność (%)',
          data: [85, 88, 92, 89, 94, 91],
          fill: false,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.4,
        },
        {
          label: 'Zgodność (%)',
          data: [78, 82, 85, 88, 90, 87],
          fill: false,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.4,
        },
      ],
    };

    const performanceOptions = {
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

    // Cost chart
    const costData = {
      labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'],
      datasets: [
        {
          label: 'Koszty konserwacji (PLN)',
          data: [12000, 15000, 11000, 13500, 14200, 12800],
          backgroundColor: '#f59e0b',
          borderColor: '#f59e0b',
          borderWidth: 1,
        },
        {
          label: 'Oszczędności (PLN)',
          data: [2000, 2500, 1800, 2200, 2400, 2100],
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        },
      ],
    };

    const costOptions = {
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

    // Compliance chart
    const complianceData = {
      labels: ['EPA', 'OSHA', 'Przepisy lokalne', 'Certyfikaty'],
      datasets: [
        {
          data: [95, 88, 82, 91],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
          borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
          borderWidth: 1,
        },
      ],
    };

    const complianceOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
          position: 'bottom',
        },
      },
    };

    setPerformanceChart({ data: performanceData, options: performanceOptions });
    setCostChart({ data: costData, options: costOptions });
    setComplianceChart({ data: complianceData, options: complianceOptions });
  }, []);

  // Metric options
  const metricOptions = [
    { label: 'Efektywność', value: 'efficiency' },
    { label: 'Koszty', value: 'costs' },
    { label: 'Zgodność', value: 'compliance' },
    { label: 'Czas reakcji', value: 'response_time' },
  ];

  // Mock equipment performance data
  const equipmentPerformance = [
    {
      id: 'eq-1',
      name: 'Klimatyzacja A1',
      type: 'AIR_CONDITIONING',
      efficiency: 92,
      lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      cost: 1200,
      status: 'GOOD',
    },
    {
      id: 'eq-2',
      name: 'Wentylacja B2',
      type: 'VENTILATION',
      efficiency: 85,
      lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      cost: 800,
      status: 'WARNING',
    },
    {
      id: 'eq-3',
      name: 'Pompa ciepła C3',
      type: 'HEAT_PUMP',
      efficiency: 78,
      lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      cost: 1500,
      status: 'CRITICAL',
    },
  ];

  // Status template
  const statusTemplate = (equipment: any) => {
    const statusConfig = {
      GOOD: { label: 'Dobry', severity: 'success' },
      WARNING: { label: 'Uwaga', severity: 'warning' },
      CRITICAL: { label: 'Krytyczny', severity: 'danger' },
    }[equipment.status];

    return <Tag value={statusConfig.label} severity={statusConfig.severity as any} />;
  };

  // Efficiency template
  const efficiencyTemplate = (equipment: any) => {
    return (
      <div className="flex align-items-center gap-2">
        <ProgressBar 
          value={equipment.efficiency} 
          className="w-6rem"
          style={{ height: '0.5rem' }}
        />
        <span className="text-white">{equipment.efficiency}%</span>
      </div>
    );
  };

  return (
    <div className="hvac-maintenance-analytics">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Analityka Konserwacji</h2>
        
        <div className="flex gap-2">
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value as [Date, Date])}
            selectionMode="range"
            readOnlyInput
            showIcon
            placeholder="Wybierz zakres dat"
          />
          <Button
            icon="pi pi-refresh"
            label="Odśwież"
            className="p-button-outlined"
            onClick={onAnalyticsRefresh}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Efektywność</h4>
            <Knob
              value={stats.efficiency}
              size={80}
              strokeWidth={8}
              valueColor="#10b981"
              rangeColor="#374151"
              textColor="#ffffff"
            />
            <div className="text-sm text-gray-400 mt-2">
              {stats.efficiency}% średnia efektywność
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Oszczędności</div>
              <div className="text-2xl font-bold text-green-400">
                {stats.costSavings.toLocaleString('pl-PL')} PLN
              </div>
              <div className="text-xs text-green-400">+12% vs poprzedni miesiąc</div>
            </div>
            <i className="pi pi-trending-up text-green-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Zgodność</div>
              <div className="text-2xl font-bold text-blue-400">
                {stats.complianceRate}%
              </div>
              <div className="text-xs text-blue-400">+3% vs poprzedni miesiąc</div>
            </div>
            <i className="pi pi-shield text-blue-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Ukończone</div>
              <div className="text-2xl font-bold text-purple-400">
                {stats.completedThisMonth}
              </div>
              <div className="text-xs text-purple-400">w tym miesiącu</div>
            </div>
            <i className="pi pi-check-circle text-purple-400 text-3xl" />
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Wydajność" leftIcon="pi pi-chart-line">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Trend wydajności</h3>
              <Chart 
                type="line" 
                data={performanceChart.data} 
                options={performanceChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Wydajność urządzeń</h3>
              <DataTable
                value={equipmentPerformance}
                className="p-datatable-sm"
                emptyMessage="Brak danych o wydajności"
              >
                <Column field="name" header="Urządzenie" />
                <Column field="efficiency" header="Efektywność" body={efficiencyTemplate} />
                <Column field="status" header="Status" body={statusTemplate} />
              </DataTable>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Koszty" leftIcon="pi pi-dollar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Analiza kosztów</h3>
              <Chart 
                type="bar" 
                data={costChart.data} 
                options={costChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Koszty według urządzeń</h3>
              <DataTable
                value={equipmentPerformance}
                className="p-datatable-sm"
                emptyMessage="Brak danych o kosztach"
              >
                <Column field="name" header="Urządzenie" />
                <Column field="type" header="Typ" />
                <Column 
                  field="cost" 
                  header="Koszt (PLN)"
                  body={(equipment) => equipment.cost.toLocaleString('pl-PL')}
                />
                <Column field="status" header="Status" body={statusTemplate} />
              </DataTable>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Zgodność" leftIcon="pi pi-shield">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Zgodność według kategorii</h3>
              <Chart 
                type="doughnut" 
                data={complianceChart.data} 
                options={complianceChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Podsumowanie zgodności</h3>
              <div className="space-y-4">
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">EPA 608</span>
                  <div className="flex align-items-center gap-2">
                    <ProgressBar value={95} className="w-8rem" />
                    <span className="text-white">95%</span>
                  </div>
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">OSHA</span>
                  <div className="flex align-items-center gap-2">
                    <ProgressBar value={88} className="w-8rem" />
                    <span className="text-white">88%</span>
                  </div>
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Przepisy lokalne</span>
                  <div className="flex align-items-center gap-2">
                    <ProgressBar value={82} className="w-8rem" />
                    <span className="text-white">82%</span>
                  </div>
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Certyfikaty</span>
                  <div className="flex align-items-center gap-2">
                    <ProgressBar value={91} className="w-8rem" />
                    <span className="text-white">91%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Raporty" leftIcon="pi pi-file-pdf">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport miesięczny</h4>
              <p className="text-gray-400 text-sm mb-4">
                Szczegółowy raport wydajności i kosztów za ostatni miesiąc
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport zgodności</h4>
              <p className="text-gray-400 text-sm mb-4">
                Raport zgodności z przepisami EPA, OSHA i lokalnymi
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Analiza predykcyjna</h4>
              <p className="text-gray-400 text-sm mb-4">
                Przewidywania dotyczące przyszłych potrzeb konserwacyjnych
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
              />
            </Card>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};
