/**
 * HVAC Scheduling Dashboard
 * "Pasja rodzi profesjonalizm" - Professional HVAC Service Planning Interface
 * 
 * Features:
 * - Drag-and-drop scheduling calendar
 * - Real-time technician tracking
 * - Emergency dispatch handling
 * - Route optimization visualization
 * - Performance analytics
 */

import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useHvacDispatch } from '../../hooks/useHvacDispatch';
import { useHvacScheduling } from '../../hooks/useHvacScheduling';
import { useHvacTechnicians } from '../../hooks/useHvacTechnicians';
import { HvacDispatchPanel } from './HvacDispatchPanel';
import { HvacRouteOptimizer } from './HvacRouteOptimizer';
import { HvacSchedulingCalendar } from './HvacSchedulingCalendar';
import { HvacTechnicianTracker } from './HvacTechnicianTracker';

// Import unified types

// Types
interface SchedulingFilters {
  dateRange: [Date, Date];
  technician: string | null;
  priority: string | null;
  status: string | null;
  serviceType: string | null;
}

interface SchedulingStats {
  totalJobs: number;
  scheduledJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  overdueJobs: number;
  technicianUtilization: number;
  averageResponseTime: number;
  customerSatisfaction: number;
}

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
  { label: 'W drodze', value: 'EN_ROUTE' },
  { label: 'W trakcie', value: 'IN_PROGRESS' },
  { label: 'Zakończone', value: 'COMPLETED' },
  { label: 'Anulowane', value: 'CANCELLED' },
];

const serviceTypeOptions = [
  { label: 'Wszystkie', value: null },
  { label: 'Instalacja', value: 'INSTALLATION' },
  { label: 'Konserwacja', value: 'MAINTENANCE' },
  { label: 'Naprawa', value: 'REPAIR' },
  { label: 'Inspekcja', value: 'INSPECTION' },
  { label: 'Awaria', value: 'EMERGENCY' },
];

export const HvacSchedulingDashboard: React.FC = () => {
  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [filters, setFilters] = useState<SchedulingFilters>({
    dateRange: [new Date(), new Date()],
    technician: null,
    priority: null,
    status: null,
    serviceType: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, { delay: 300 });

  // Custom hooks
  const {
    scheduledJobs,
    loading: schedulingLoading,
    error: schedulingError,
    scheduleJob,
    rescheduleJob,
    cancelJob,
    getSchedulingStats,
    optimizeRoutes,
  } = useHvacScheduling();

  const {
    activeDispatches,
    dispatchJob,
    updateDispatchStatus,
    getDispatchStatus,
  } = useHvacDispatch();

  const {
    technicians,
    loading: techniciansLoading,
    getTechnicianLocation,
    getTechnicianAvailability,
  } = useHvacTechnicians();

  // Stats
  const [stats, setStats] = useState<SchedulingStats>({
    totalJobs: 0,
    scheduledJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    overdueJobs: 0,
    technicianUtilization: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
  });

  // Load data on component mount and filter changes
  useEffect(() => {
    loadSchedulingData();
  }, [selectedDate, viewMode, filters, debouncedSearchTerm]);

  // Load stats
  useEffect(() => {
    loadStats();
  }, [scheduledJobs]);

  const loadSchedulingData = useCallback(async () => {
    try {
      // This would call the actual API
      console.log('Loading scheduling data with filters:', {
        date: selectedDate,
        viewMode,
        filters,
        search: debouncedSearchTerm,
      });
    } catch (error) {
      console.error('Failed to load scheduling data:', error);
    }
  }, [selectedDate, viewMode, filters, debouncedSearchTerm]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await getSchedulingStats(selectedDate);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [selectedDate, getSchedulingStats]);

  // Event handlers
  const handleJobSchedule = useCallback(async (jobData: any) => {
    try {
      await scheduleJob(jobData);
      await loadSchedulingData();
    } catch (error) {
      console.error('Failed to schedule job:', error);
    }
  }, [scheduleJob, loadSchedulingData]);

  const handleJobReschedule = useCallback(async (jobId: string, newDateTime: Date) => {
    try {
      await rescheduleJob(jobId, newDateTime);
      await loadSchedulingData();
    } catch (error) {
      console.error('Failed to reschedule job:', error);
    }
  }, [rescheduleJob, loadSchedulingData]);

  const handleJobCancel = useCallback(async (jobId: string, reason: string) => {
    try {
      await cancelJob(jobId, reason);
      await loadSchedulingData();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, [cancelJob, loadSchedulingData]);

  const handleEmergencyDispatch = useCallback(async (emergencyData: any) => {
    try {
      setShowDispatchPanel(true);
      await dispatchJob(emergencyData);
    } catch (error) {
      console.error('Failed to dispatch emergency:', error);
    }
  }, [dispatchJob]);

  const handleRouteOptimization = useCallback(async () => {
    try {
      setShowRouteOptimizer(true);
      await optimizeRoutes(selectedDate);
    } catch (error) {
      console.error('Failed to optimize routes:', error);
    }
  }, [optimizeRoutes, selectedDate]);

  // Priority badge template
  const priorityTemplate = (priority: string) => {
    const severity = {
      CRITICAL: 'danger' as const,
      HIGH: 'warning' as const,
      MEDIUM: 'info' as const,
      LOW: 'success' as const,
    }[priority] || ('info' as const);

    return <Badge value={priority} severity={severity} />;
  };

  // Status template
  const statusTemplate = (status: string) => {
    const statusConfig = {
      SCHEDULED: { label: 'Zaplanowane', severity: 'info' as const },
      EN_ROUTE: { label: 'W drodze', severity: 'warning' as const },
      IN_PROGRESS: { label: 'W trakcie', severity: 'warning' as const },
      COMPLETED: { label: 'Zakończone', severity: 'success' as const },
      CANCELLED: { label: 'Anulowane', severity: 'danger' as const },
    }[status] || { label: status, severity: 'info' as const };

    return <Tag value={statusConfig.label} severity={statusConfig.severity} />;
  };

  // Toolbar content
  const toolbarStartContent = (
    <div className="flex align-items-center gap-2">
      <Button
        icon="pi pi-calendar-plus"
        label="Nowe zlecenie"
        className="p-button-success"
        onClick={() => setShowDispatchPanel(true)}
      />
      <Button
        icon="pi pi-map"
        label="Optymalizuj trasy"
        className="p-button-info"
        onClick={handleRouteOptimization}
        disabled={selectedJobs.length === 0}
      />
      <Button
        icon="pi pi-exclamation-triangle"
        label="Awaria"
        className="p-button-danger"
        onClick={() => handleEmergencyDispatch({})}
      />
    </div>
  );

  const toolbarEndContent = (
    <div className="flex align-items-center gap-2">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder="Szukaj zleceń..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-20rem"
        />
      </span>
      <Dropdown
        value={viewMode}
        options={[
          { label: 'Dzień', value: 'day' },
          { label: 'Tydzień', value: 'week' },
          { label: 'Miesiąc', value: 'month' },
        ]}
        onChange={(e) => setViewMode(e.value)}
        className="w-8rem"
      />
    </div>
  );

  // Stats cards
  const statsCards = [
    {
      title: 'Łączne zlecenia',
      value: stats.totalJobs,
      icon: 'pi pi-briefcase',
      color: 'blue',
    },
    {
      title: 'Zaplanowane',
      value: stats.scheduledJobs,
      icon: 'pi pi-calendar',
      color: 'green',
    },
    {
      title: 'W trakcie',
      value: stats.inProgressJobs,
      icon: 'pi pi-cog',
      color: 'orange',
    },
    {
      title: 'Przeterminowane',
      value: stats.overdueJobs,
      icon: 'pi pi-exclamation-triangle',
      color: 'red',
    },
  ];

  return (
    <div className="hvac-scheduling-dashboard h-full">
      <Toast />
      <ConfirmDialog />

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          Planowanie Serwisu HVAC
        </h2>
        <p className="text-gray-300">
          Zarządzanie zleceniami, technikami i trasami serwisowymi
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <div className="flex align-items-center justify-content-between">
              <div>
                <div className="text-gray-400 text-sm mb-1">{stat.title}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
              <div className={`text-${stat.color}-400 text-3xl`}>
                <i className={stat.icon} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Toolbar
        start={toolbarStartContent}
        end={toolbarEndContent}
        className="mb-4 bg-gray-800 border-gray-700"
      />

      {/* Main Content */}
      <Splitter className="h-full">
        <SplitterPanel size={70} minSize={50}>
          <div className="h-full p-2">
            {/* Scheduling Calendar */}
            <HvacSchedulingCalendar
              selectedDate={selectedDate}
              viewMode={viewMode}
              jobs={scheduledJobs}
              technicians={technicians}
              onDateSelect={setSelectedDate}
              onJobSchedule={handleJobSchedule}
              onJobReschedule={handleJobReschedule}
              onJobCancel={handleJobCancel}
              loading={schedulingLoading}
            />
          </div>
        </SplitterPanel>

        <SplitterPanel size={30} minSize={25}>
          <div className="h-full p-2">
            {/* Technician Tracker */}
            <HvacTechnicianTracker
              technicians={technicians}
              activeDispatches={activeDispatches}
              onTechnicianSelect={(techId) => {
                setFilters(prev => ({ ...prev, technician: techId }));
              }}
              loading={techniciansLoading}
            />
          </div>
        </SplitterPanel>
      </Splitter>

      {/* Dispatch Panel */}
      {showDispatchPanel && (
        <HvacDispatchPanel
          visible={showDispatchPanel}
          onHide={() => setShowDispatchPanel(false)}
          onDispatch={handleJobSchedule}
          technicians={technicians}
        />
      )}

      {/* Route Optimizer */}
      {showRouteOptimizer && (
        <HvacRouteOptimizer
          visible={showRouteOptimizer}
          onHide={() => setShowRouteOptimizer(false)}
          selectedDate={selectedDate}
          jobs={scheduledJobs}
          technicians={technicians}
          onOptimize={optimizeRoutes}
        />
      )}
    </div>
  );
};
