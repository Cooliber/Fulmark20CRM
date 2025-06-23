/**
 * HVAC Preventive Maintenance Dashboard
 * "Pasja rodzi profesjonalizm" - Professional HVAC Maintenance Planning
 * 
 * Features:
 * - Automated maintenance scheduling
 * - Equipment-specific checklists
 * - Compliance tracking (EPA, OSHA, local codes)
 * - Seasonal maintenance planning
 * - Performance analytics
 * - Cost optimization
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Timeline } from 'primereact/timeline';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';
import { Knob } from 'primereact/knob';
import { FilterMatchMode } from 'primereact/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useHvacMaintenance } from '../hooks/useHvacMaintenance';
import { useHvacEquipment } from '../hooks/useHvacEquipment';
import { HvacMaintenanceCalendar } from './HvacMaintenanceCalendar';
import { HvacMaintenanceChecklist } from './HvacMaintenanceChecklist';
import { HvacComplianceTracker } from './HvacComplianceTracker';
import { HvacMaintenanceAnalytics } from './HvacMaintenanceAnalytics';

// Types
interface MaintenanceFilters {
  dateRange: [Date, Date];
  equipmentType: string | null;
  maintenanceType: string | null;
  priority: string | null;
  status: string | null;
  customerId: string | null;
}

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

const equipmentTypeOptions = [
  { label: 'Wszystkie', value: null },
  { label: 'Klimatyzacja', value: 'AIR_CONDITIONING' },
  { label: 'Ogrzewanie', value: 'HEATING' },
  { label: 'Wentylacja', value: 'VENTILATION' },
  { label: 'Chłodnictwo', value: 'REFRIGERATION' },
  { label: 'Pompy ciepła', value: 'HEAT_PUMP' },
];

const maintenanceTypeOptions = [
  { label: 'Wszystkie', value: null },
  { label: 'Prewencyjne', value: 'PREVENTIVE' },
  { label: 'Inspekcja', value: 'INSPECTION' },
  { label: 'Czyszczenie', value: 'CLEANING' },
  { label: 'Kalibracja', value: 'CALIBRATION' },
  { label: 'Wymiana części', value: 'PARTS_REPLACEMENT' },
];

const priorityOptions = [
  { label: 'Wszystkie', value: null },
  { label: 'Krytyczny', value: 'CRITICAL' },
  { label: 'Wysoki', value: 'HIGH' },
  { label: 'Średni', value: 'MEDIUM' },
  { label: 'Niski', value: 'LOW' },
];

const statusOptions = [
  { label: 'Wszystkie', value: null },
  { label: 'Zaplanowane', value: 'SCHEDULED' },
  { label: 'Przeterminowane', value: 'OVERDUE' },
  { label: 'W trakcie', value: 'IN_PROGRESS' },
  { label: 'Zakończone', value: 'COMPLETED' },
  { label: 'Anulowane', value: 'CANCELLED' },
];

export const HvacMaintenanceDashboard: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<MaintenanceFilters>({
    dateRange: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)], // Next 30 days
    equipmentType: null,
    maintenanceType: null,
    priority: null,
    status: null,
    customerId: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaintenance, setSelectedMaintenance] = useState<string[]>([]);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Custom hooks
  const {
    maintenanceSchedules,
    overdueItems,
    upcomingItems,
    loading: maintenanceLoading,
    error: maintenanceError,
    generateMaintenancePlan,
    schedulePreventiveMaintenance,
    getMaintenanceAnalytics,
    getMaintenanceStats,
  } = useHvacMaintenance();

  const {
    equipment,
    loading: equipmentLoading,
    getEquipmentByCustomer,
  } = useHvacEquipment();

  // Stats
  const [stats, setStats] = useState<MaintenanceStats>({
    totalEquipment: 0,
    scheduledMaintenance: 0,
    overdueMaintenance: 0,
    completedThisMonth: 0,
    complianceRate: 0,
    costSavings: 0,
    efficiency: 0,
    nextMaintenanceDate: null,
  });

  // Chart data
  const [chartData, setChartData] = useState<any>({});
  const [chartOptions, setChartOptions] = useState<any>({});

  // Load data on component mount and filter changes
  useEffect(() => {
    loadMaintenanceData();
  }, [filters, debouncedSearchTerm]);

  // Load stats
  useEffect(() => {
    loadStats();
  }, [maintenanceSchedules]);

  // Initialize charts
  useEffect(() => {
    initializeCharts();
  }, []);

  const loadMaintenanceData = useCallback(async () => {
    try {
      console.log('Loading maintenance data with filters:', {
        filters,
        search: debouncedSearchTerm,
      });
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się załadować danych konserwacji',
        life: 3000,
      });
    }
  }, [filters, debouncedSearchTerm]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await getMaintenanceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [getMaintenanceStats]);

  const initializeCharts = useCallback(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#ffffff';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#374151';

    // Maintenance trend chart
    const trendData = {
      labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'],
      datasets: [
        {
          label: 'Zaplanowane',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.4,
        },
        {
          label: 'Wykonane',
          data: [28, 48, 40, 19, 86, 27],
          fill: false,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.4,
        },
      ],
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

    setChartData({ trend: trendData });
    setChartOptions({ trend: trendOptions });
  }, []);

  // Event handlers
  const handleMaintenanceSchedule = useCallback(async (maintenanceData: any) => {
    try {
      await schedulePreventiveMaintenance(maintenanceData);
      await loadMaintenanceData();
      toast.current?.show({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Konserwacja została zaplanowana',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się zaplanować konserwacji',
        life: 3000,
      });
    }
  }, [schedulePreventiveMaintenance, loadMaintenanceData]);

  const handleGenerateMaintenancePlan = useCallback(async (customerId: string) => {
    try {
      await generateMaintenancePlan(customerId);
      await loadMaintenanceData();
      toast.current?.show({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Plan konserwacji został wygenerowany',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to generate maintenance plan:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się wygenerować planu konserwacji',
        life: 3000,
      });
    }
  }, [generateMaintenancePlan, loadMaintenanceData]);

  // Priority badge template
  const priorityTemplate = (priority: string) => {
    const severity = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'success',
    }[priority] || 'info';

    return <Badge value={priority} severity={severity as any} />;
  };

  // Status template
  const statusTemplate = (status: string) => {
    const statusConfig = {
      SCHEDULED: { label: 'Zaplanowane', severity: 'info' },
      OVERDUE: { label: 'Przeterminowane', severity: 'danger' },
      IN_PROGRESS: { label: 'W trakcie', severity: 'warning' },
      COMPLETED: { label: 'Zakończone', severity: 'success' },
      CANCELLED: { label: 'Anulowane', severity: 'secondary' },
    }[status] || { label: status, severity: 'info' };

    return <Tag value={statusConfig.label} severity={statusConfig.severity as any} />;
  };

  // Toolbar content
  const toolbarStartContent = (
    <div className="flex align-items-center gap-2">
      <Button
        icon="pi pi-calendar-plus"
        label="Nowa konserwacja"
        className="p-button-success"
        onClick={() => handleMaintenanceSchedule({})}
      />
      <Button
        icon="pi pi-file-pdf"
        label="Generuj plan"
        className="p-button-info"
        onClick={() => handleGenerateMaintenancePlan('')}
      />
      <Button
        icon="pi pi-chart-line"
        label="Analityka"
        className="p-button-secondary"
        onClick={() => setActiveTab(3)}
      />
    </div>
  );

  const toolbarEndContent = (
    <div className="flex align-items-center gap-2">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder="Szukaj konserwacji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-20rem"
        />
      </span>
      <Calendar
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.value as Date)}
        showIcon
        placeholder="Wybierz datę"
      />
    </div>
  );

  // Stats cards
  const statsCards = [
    {
      title: 'Łączne urządzenia',
      value: stats.totalEquipment,
      icon: 'pi pi-cog',
      color: 'blue',
      trend: '+5%',
    },
    {
      title: 'Zaplanowane',
      value: stats.scheduledMaintenance,
      icon: 'pi pi-calendar',
      color: 'green',
      trend: '+12%',
    },
    {
      title: 'Przeterminowane',
      value: stats.overdueMaintenance,
      icon: 'pi pi-exclamation-triangle',
      color: 'red',
      trend: '-8%',
    },
    {
      title: 'Zgodność',
      value: `${stats.complianceRate}%`,
      icon: 'pi pi-shield',
      color: 'purple',
      trend: '+3%',
    },
  ];

  return (
    <div className="hvac-maintenance-dashboard h-full">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          Konserwacja Prewencyjna HVAC
        </h2>
        <p className="text-gray-300">
          Zarządzanie harmonogramem konserwacji i zgodności z przepisami
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <div className="flex align-items-center justify-content-between">
              <div>
                <div className="text-gray-400 text-sm mb-1">{stat.title}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className={`text-xs text-${stat.color}-400`}>
                  {stat.trend} vs poprzedni miesiąc
                </div>
              </div>
              <div className={`text-${stat.color}-400 text-3xl`}>
                <i className={stat.icon} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Zgodność EPA</h4>
            <Knob
              value={stats.complianceRate}
              size={80}
              strokeWidth={8}
              valueColor="#10b981"
              rangeColor="#374151"
              textColor="#ffffff"
            />
            <div className="text-sm text-gray-400 mt-2">
              {stats.complianceRate}% zgodności
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Efektywność</h4>
            <Knob
              value={stats.efficiency}
              size={80}
              strokeWidth={8}
              valueColor="#3b82f6"
              rangeColor="#374151"
              textColor="#ffffff"
            />
            <div className="text-sm text-gray-400 mt-2">
              {stats.efficiency}% efektywności
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Oszczędności</h4>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats.costSavings.toLocaleString('pl-PL')} PLN
            </div>
            <div className="text-sm text-gray-400">
              Oszczędności roczne
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Toolbar
        start={toolbarStartContent}
        end={toolbarEndContent}
        className="mb-4 bg-gray-800 border-gray-700"
      />

      {/* Main Content Tabs */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Kalendarz konserwacji" leftIcon="pi pi-calendar">
          <HvacMaintenanceCalendar
            selectedDate={selectedDate}
            maintenanceSchedules={maintenanceSchedules}
            onDateSelect={setSelectedDate}
            onMaintenanceSchedule={handleMaintenanceSchedule}
            loading={maintenanceLoading}
          />
        </TabPanel>

        <TabPanel header="Listy kontrolne" leftIcon="pi pi-list">
          <HvacMaintenanceChecklist
            equipment={equipment}
            onChecklistComplete={(data) => console.log('Checklist completed:', data)}
            loading={equipmentLoading}
          />
        </TabPanel>

        <TabPanel header="Zgodność" leftIcon="pi pi-shield">
          <HvacComplianceTracker
            complianceRate={stats.complianceRate}
            overdueItems={overdueItems}
            upcomingItems={upcomingItems}
            onComplianceUpdate={loadMaintenanceData}
          />
        </TabPanel>

        <TabPanel header="Analityka" leftIcon="pi pi-chart-line">
          <HvacMaintenanceAnalytics
            stats={stats}
            chartData={chartData}
            chartOptions={chartOptions}
            onAnalyticsRefresh={loadStats}
          />
        </TabPanel>
      </TabView>
    </div>
  );
};
