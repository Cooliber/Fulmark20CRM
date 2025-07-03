/**
 * HVAC Service Planner Analytics Component
 * "Pasja rodzi profesjonalizm" - Professional Service Planning Analytics
 * 
 * Features:
 * - Performance monitoring and KPIs
 * - Technician productivity tracking
 * - Service planning optimization insights
 * - Cost analysis and ROI metrics
 * - Predictive analytics for planning
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
import { Timeline } from 'primereact/timeline';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

// Types
interface ServicePlannerMetrics {
  totalJobs: number;
  completedJobs: number;
  averageJobDuration: number;
  customerSatisfaction: number;
  technicianUtilization: number;
  routeEfficiency: number;
  costPerJob: number;
  revenuePerJob: number;
  firstTimeFixRate: number;
  emergencyResponseTime: number;
}

interface TechnicianPerformance {
  id: string;
  name: string;
  jobsCompleted: number;
  averageJobTime: number;
  customerRating: number;
  efficiency: number;
  revenue: number;
  skills: string[];
  certifications: string[];
}

interface ServiceTrend {
  date: Date;
  jobsScheduled: number;
  jobsCompleted: number;
  revenue: number;
  costs: number;
  efficiency: number;
}

interface AnalyticsProps {
  dateRange: [Date, Date];
  onDateRangeChange: (range: [Date, Date]) => void;
  onExportReport: (type: string) => void;
}

export const HvacServicePlannerAnalytics: React.FC<AnalyticsProps> = ({
  dateRange,
  onDateRangeChange,
  onExportReport,
}) => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState<ServicePlannerMetrics>({
    totalJobs: 0,
    completedJobs: 0,
    averageJobDuration: 0,
    customerSatisfaction: 0,
    technicianUtilization: 0,
    routeEfficiency: 0,
    costPerJob: 0,
    revenuePerJob: 0,
    firstTimeFixRate: 0,
    emergencyResponseTime: 0,
  });
  const [technicianPerformance, setTechnicianPerformance] = useState<TechnicianPerformance[]>([]);
  const [serviceTrends, setServiceTrends] = useState<ServiceTrend[]>([]);
  const [loading, setLoading] = useState(false);

  // Chart data
  const [performanceChart, setPerformanceChart] = useState<any>({});
  const [revenueChart, setRevenueChart] = useState<any>({});
  const [efficiencyChart, setEfficiencyChart] = useState<any>({});
  const [technicianChart, setTechnicianChart] = useState<any>({});

  // Mock data initialization
  useEffect(() => {
    const mockMetrics: ServicePlannerMetrics = {
      totalJobs: 245,
      completedJobs: 228,
      averageJobDuration: 125,
      customerSatisfaction: 4.6,
      technicianUtilization: 87,
      routeEfficiency: 92,
      costPerJob: 180,
      revenuePerJob: 320,
      firstTimeFixRate: 89,
      emergencyResponseTime: 18,
    };

    const mockTechnicians: TechnicianPerformance[] = [
      {
        id: 'tech-1',
        name: 'Jan Kowalski',
        jobsCompleted: 45,
        averageJobTime: 110,
        customerRating: 4.8,
        efficiency: 94,
        revenue: 14400,
        skills: ['Klimatyzacja', 'Wentylacja'],
        certifications: ['EPA 608', 'OSHA'],
      },
      {
        id: 'tech-2',
        name: 'Anna Nowak',
        jobsCompleted: 38,
        averageJobTime: 125,
        customerRating: 4.7,
        efficiency: 91,
        revenue: 12160,
        skills: ['Pompy ciepła', 'Systemy grzewcze'],
        certifications: ['EPA 608', 'Local Cert'],
      },
      {
        id: 'tech-3',
        name: 'Piotr Wiśniewski',
        jobsCompleted: 52,
        averageJobTime: 135,
        customerRating: 4.5,
        efficiency: 88,
        revenue: 16640,
        skills: ['Klimatyzacja', 'Chłodnictwo'],
        certifications: ['EPA 608', 'OSHA', 'Advanced HVAC'],
      },
    ];

    setMetrics(mockMetrics);
    setTechnicianPerformance(mockTechnicians);
  }, []);

  // Initialize charts
  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#ffffff';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#374151';

    // Performance trend chart
    const performanceData = {
      labels: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'],
      datasets: [
        {
          label: 'Ukończone zlecenia',
          data: [12, 15, 18, 14, 16, 8, 5],
          fill: false,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.4,
        },
        {
          label: 'Zaplanowane zlecenia',
          data: [15, 18, 20, 16, 18, 10, 6],
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

    // Revenue chart
    const revenueData = {
      labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'],
      datasets: [
        {
          label: 'Przychody (PLN)',
          data: [78000, 85000, 92000, 88000, 95000, 102000],
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        },
        {
          label: 'Koszty (PLN)',
          data: [45000, 48000, 52000, 50000, 54000, 58000],
          backgroundColor: '#f59e0b',
          borderColor: '#f59e0b',
          borderWidth: 1,
        },
      ],
    };

    const revenueOptions = {
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

    // Efficiency chart
    const efficiencyData = {
      labels: ['Efektywność tras', 'Wykorzystanie techników', 'Pierwsza naprawa', 'Zadowolenie klientów'],
      datasets: [
        {
          data: [92, 87, 89, 92],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
          borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
          borderWidth: 1,
        },
      ],
    };

    const efficiencyOptions = {
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

    // Technician performance chart
    const technicianData = {
      labels: technicianPerformance.map(tech => tech.name),
      datasets: [
        {
          label: 'Efektywność (%)',
          data: technicianPerformance.map(tech => tech.efficiency),
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderWidth: 1,
        },
        {
          label: 'Ocena klientów',
          data: technicianPerformance.map(tech => tech.customerRating * 20), // Scale to 100
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        },
      ],
    };

    const technicianOptions = {
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

    setPerformanceChart({ data: performanceData, options: performanceOptions });
    setRevenueChart({ data: revenueData, options: revenueOptions });
    setEfficiencyChart({ data: efficiencyData, options: efficiencyOptions });
    setTechnicianChart({ data: technicianData, options: technicianOptions });
  }, [technicianPerformance]);

  // Performance template
  const performanceTemplate = (technician: TechnicianPerformance) => {
    return (
      <div className="flex align-items-center gap-2">
        <ProgressBar 
          value={technician.efficiency} 
          className="w-6rem"
          style={{ height: '0.5rem' }}
        />
        <span className="text-white">{technician.efficiency}%</span>
      </div>
    );
  };

  // Rating template
  const ratingTemplate = (technician: TechnicianPerformance) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="text-white">{technician.customerRating.toFixed(1)}</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <i
              key={star}
              className={classNames('pi pi-star-fill text-xs', {
                'text-yellow-400': star <= Math.round(technician.customerRating),
                'text-gray-400': star > Math.round(technician.customerRating),
              })}
            />
          ))}
        </div>
      </div>
    );
  };

  // Skills template
  const skillsTemplate = (technician: TechnicianPerformance) => {
    return (
      <div className="flex flex-wrap gap-1">
        {technician.skills.slice(0, 2).map((skill, index) => (
          <Chip key={index} label={skill} className="text-xs bg-blue-100 text-blue-800" />
        ))}
        {technician.skills.length > 2 && (
          <Chip label={`+${technician.skills.length - 2}`} className="text-xs bg-gray-100 text-gray-800" />
        )}
      </div>
    );
  };

  // Revenue template
  const revenueTemplate = (technician: TechnicianPerformance) => {
    return `${technician.revenue.toLocaleString('pl-PL')} PLN`;
  };

  return (
    <div className="hvac-service-planner-analytics">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Analityka Planera Serwisowego</h2>
        
        <div className="flex gap-2">
          <Calendar
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.value as [Date, Date])}
            selectionMode="range"
            readOnlyInput
            showIcon
            placeholder="Wybierz zakres dat"
          />
          <Button
            icon="pi pi-download"
            label="Eksport"
            className="p-button-outlined"
            onClick={() => onExportReport('comprehensive')}
          />
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Efektywność</h4>
            <Knob
              value={metrics.routeEfficiency}
              size={80}
              strokeWidth={8}
              valueColor="#10b981"
              rangeColor="#374151"
              textColor="#ffffff"
            />
            <div className="text-sm text-gray-400 mt-2">
              {metrics.routeEfficiency}% tras
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Ukończone</div>
              <div className="text-2xl font-bold text-green-400">
                {metrics.completedJobs}
              </div>
              <div className="text-xs text-green-400">
                z {metrics.totalJobs} zleceń
              </div>
            </div>
            <i className="pi pi-check-circle text-green-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Zadowolenie</div>
              <div className="text-2xl font-bold text-blue-400">
                {metrics.customerSatisfaction.toFixed(1)}
              </div>
              <div className="text-xs text-blue-400">
                średnia ocena
              </div>
            </div>
            <i className="pi pi-star-fill text-blue-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Przychód/Zlecenie</div>
              <div className="text-2xl font-bold text-purple-400">
                {metrics.revenuePerJob} PLN
              </div>
              <div className="text-xs text-purple-400">
                średnio
              </div>
            </div>
            <i className="pi pi-dollar text-purple-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Pierwsza naprawa</div>
              <div className="text-2xl font-bold text-yellow-400">
                {metrics.firstTimeFixRate}%
              </div>
              <div className="text-xs text-yellow-400">
                skuteczność
              </div>
            </div>
            <i className="pi pi-wrench text-yellow-400 text-3xl" />
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Wydajność" leftIcon="pi pi-chart-line">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Trend wydajności tygodniowej</h3>
              <Chart 
                type="line" 
                data={performanceChart.data} 
                options={performanceChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Wskaźniki efektywności</h3>
              <Chart 
                type="doughnut" 
                data={efficiencyChart.data} 
                options={efficiencyChart.options}
                style={{ height: '300px' }}
              />
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Technicy" leftIcon="pi pi-users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Wydajność techników</h3>
              <Chart 
                type="bar" 
                data={technicianChart.data} 
                options={technicianChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Ranking techników</h3>
              <DataTable
                value={technicianPerformance}
                className="p-datatable-sm"
                emptyMessage="Brak danych o technikach"
              >
                <Column field="name" header="Technik" />
                <Column field="jobsCompleted" header="Zlecenia" />
                <Column field="efficiency" header="Efektywność" body={performanceTemplate} />
                <Column field="customerRating" header="Ocena" body={ratingTemplate} />
                <Column field="revenue" header="Przychód" body={revenueTemplate} />
              </DataTable>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Finanse" leftIcon="pi pi-dollar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Analiza przychodów i kosztów</h3>
              <Chart 
                type="bar" 
                data={revenueChart.data} 
                options={revenueChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Wskaźniki finansowe</h3>
              <div className="space-y-4">
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Średni przychód na zlecenie</span>
                  <span className="text-white font-semibold">{metrics.revenuePerJob} PLN</span>
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Średni koszt na zlecenie</span>
                  <span className="text-white font-semibold">{metrics.costPerJob} PLN</span>
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Marża na zlecenie</span>
                  <span className="text-green-400 font-semibold">
                    {metrics.revenuePerJob - metrics.costPerJob} PLN
                  </span>
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Rentowność</span>
                  <span className="text-green-400 font-semibold">
                    {(((metrics.revenuePerJob - metrics.costPerJob) / metrics.revenuePerJob) * 100).toFixed(1)}%
                  </span>
                </div>
                <Divider />
                <div className="flex justify-content-between align-items-center">
                  <span className="text-gray-300">Łączny przychód (miesiąc)</span>
                  <span className="text-white font-semibold text-lg">
                    {(metrics.revenuePerJob * metrics.completedJobs).toLocaleString('pl-PL')} PLN
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Raporty" leftIcon="pi pi-file-pdf">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport wydajności</h4>
              <p className="text-gray-400 text-sm mb-4">
                Szczegółowy raport wydajności techników i efektywności tras
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
                onClick={() => onExportReport('performance')}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport finansowy</h4>
              <p className="text-gray-400 text-sm mb-4">
                Analiza przychodów, kosztów i rentowności operacji
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
                onClick={() => onExportReport('financial')}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport zadowolenia klientów</h4>
              <p className="text-gray-400 text-sm mb-4">
                Analiza ocen klientów i jakości świadczonych usług
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
                onClick={() => onExportReport('satisfaction')}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport predykcyjny</h4>
              <p className="text-gray-400 text-sm mb-4">
                Przewidywania i rekomendacje dla optymalizacji planowania
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined w-full"
                onClick={() => onExportReport('predictive')}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Raport kompletny</h4>
              <p className="text-gray-400 text-sm mb-4">
                Pełny raport zawierający wszystkie metryki i analizy
              </p>
              <Button
                label="Generuj PDF"
                icon="pi pi-file-pdf"
                className="p-button-success w-full"
                onClick={() => onExportReport('comprehensive')}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-medium mb-3">Eksport danych</h4>
              <p className="text-gray-400 text-sm mb-4">
                Eksport surowych danych do analizy w Excel
              </p>
              <Button
                label="Eksport Excel"
                icon="pi pi-file-excel"
                className="p-button-outlined w-full"
                onClick={() => onExportReport('excel')}
              />
            </Card>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};
