/**
 * HVAC Mobile Technician Dashboard
 * "Pasja rodzi profesjonalizm" - Professional Mobile Interface for Technicians
 * 
 * Features:
 * - Mobile-first responsive design
 * - Offline capabilities with sync
 * - Real-time job updates
 * - GPS tracking and navigation
 * - Digital work orders
 * - Photo documentation
 * - Customer communication
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Timeline } from 'primereact/timeline';
import { Avatar } from 'primereact/avatar';
import { Chip } from 'primereact/chip';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { SpeedDial } from 'primereact/speeddial';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { classNames } from 'primereact/utils';
import { useHvacMobileTechnician } from '../hooks/useHvacMobileTechnician';
import { useGeolocation } from '../hooks/useGeolocation';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { HvacMobileJobCard } from './HvacMobileJobCard';
import { HvacMobileNavigation } from './HvacMobileNavigation';
import { HvacMobileWorkOrder } from './HvacMobileWorkOrder';

// Types
interface TechnicianJob {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
  scheduledTime: Date;
  estimatedDuration: number;
  description: string;
  equipmentInfo?: {
    type: string;
    model: string;
    serialNumber: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // km from current location
  eta?: number; // minutes
  notes?: string;
  photos?: string[];
  checklist?: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  notes?: string;
  photo?: string;
}

interface TechnicianStatus {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'ON_BREAK' | 'OFFLINE';
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  todayStats: {
    jobsCompleted: number;
    jobsScheduled: number;
    hoursWorked: number;
    efficiency: number;
  };
  isOnline: boolean;
  lastSync: Date;
}

export const HvacMobileDashboard: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [selectedJob, setSelectedJob] = useState<TechnicianJob | null>(null);
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Custom hooks
  const {
    technicianStatus,
    assignedJobs,
    currentJob,
    loading,
    error,
    updateJobStatus,
    completeJob,
    updateTechnicianStatus,
    uploadJobPhotos,
    addJobNotes,
  } = useHvacMobileTechnician();

  const {
    location,
    accuracy,
    isTracking,
    startTracking,
    stopTracking,
    error: locationError,
  } = useGeolocation();

  const {
    isOnline,
    pendingSync,
    syncData,
    queueAction,
  } = useOfflineSync();

  // Start location tracking on mount
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncData();
    }
  }, [isOnline, pendingSync, syncData]);

  // Calculate distances and ETAs
  useEffect(() => {
    if (location && assignedJobs.length > 0) {
      // Update job distances and ETAs
      // This would typically be done in the hook
    }
  }, [location, assignedJobs]);

  // Event handlers
  const handleJobSelect = useCallback((job: TechnicianJob) => {
    setSelectedJob(job);
    setShowWorkOrder(true);
  }, []);

  const handleStatusUpdate = useCallback(async (
    jobId: string, 
    status: TechnicianJob['status'],
    notes?: string
  ) => {
    try {
      if (isOnline) {
        await updateJobStatus(jobId, status, notes);
      } else {
        queueAction('UPDATE_JOB_STATUS', { jobId, status, notes });
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Status zaktualizowany',
        detail: `Status zlecenia został zmieniony na: ${status}`,
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się zaktualizować statusu',
        life: 3000,
      });
    }
  }, [isOnline, updateJobStatus, queueAction]);

  const handleJobComplete = useCallback(async (
    jobId: string,
    completionData: any
  ) => {
    try {
      if (isOnline) {
        await completeJob(jobId, completionData);
      } else {
        queueAction('COMPLETE_JOB', { jobId, completionData });
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Zlecenie ukończone',
        detail: 'Zlecenie zostało pomyślnie ukończone',
        life: 3000,
      });

      setShowWorkOrder(false);
      setSelectedJob(null);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się ukończyć zlecenia',
        life: 3000,
      });
    }
  }, [isOnline, completeJob, queueAction]);

  const handleTechnicianStatusChange = useCallback(async (
    status: TechnicianStatus['status'],
    notes?: string
  ) => {
    try {
      if (isOnline) {
        await updateTechnicianStatus(status, notes);
      } else {
        queueAction('UPDATE_TECHNICIAN_STATUS', { status, notes });
      }

      setShowStatusDialog(false);
      setStatusNotes('');

      toast.current?.show({
        severity: 'success',
        summary: 'Status zaktualizowany',
        detail: `Twój status został zmieniony na: ${status}`,
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się zaktualizować statusu',
        life: 3000,
      });
    }
  }, [isOnline, updateTechnicianStatus, queueAction]);

  const handleNavigation = useCallback((job: TechnicianJob) => {
    setIsNavigating(true);
    
    // Open navigation app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`;
    window.open(url, '_blank');
    
    // Update job status to en route
    handleStatusUpdate(job.id, 'EN_ROUTE', 'Technik w drodze do klienta');
  }, [handleStatusUpdate]);

  // Speed dial actions
  const speedDialItems = [
    {
      label: 'Zmień status',
      icon: 'pi pi-user',
      command: () => setShowStatusDialog(true),
    },
    {
      label: 'Synchronizuj',
      icon: 'pi pi-refresh',
      command: () => syncData(),
      disabled: !isOnline,
    },
    {
      label: 'Zgłoś problem',
      icon: 'pi pi-exclamation-triangle',
      command: () => {
        // Open problem reporting
      },
    },
    {
      label: 'Kontakt',
      icon: 'pi pi-phone',
      command: () => {
        // Open contact options
      },
    },
  ];

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      AVAILABLE: 'success',
      BUSY: 'warning',
      EN_ROUTE: 'info',
      ON_BREAK: 'secondary',
      OFFLINE: 'danger',
    };
    return colors[status as keyof typeof colors] || 'secondary';
  }, []);

  // Get job priority color
  const getJobPriorityColor = useCallback((priority: string) => {
    const colors = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'success',
    };
    return colors[priority as keyof typeof colors] || 'info';
  }, []);

  // Filter jobs by status
  const todayJobs = assignedJobs.filter(job => {
    const today = new Date();
    const jobDate = new Date(job.scheduledTime);
    return jobDate.toDateString() === today.toDateString();
  });

  const upcomingJobs = todayJobs.filter(job => 
    ['ASSIGNED', 'EN_ROUTE'].includes(job.status)
  );

  const inProgressJobs = todayJobs.filter(job => 
    ['ARRIVED', 'IN_PROGRESS'].includes(job.status)
  );

  const completedJobs = todayJobs.filter(job => 
    job.status === 'COMPLETED'
  );

  return (
    <div className="hvac-mobile-dashboard min-h-screen bg-gray-900">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="flex justify-content-between align-items-center mb-3">
          <div className="flex align-items-center gap-3">
            <Avatar
              label={technicianStatus?.name?.split(' ').map(n => n[0]).join('') || 'T'}
              size="large"
              shape="circle"
              className="bg-blue-500"
            />
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">
                {technicianStatus?.name || 'Technik'}
              </h2>
              <Tag
                value={technicianStatus?.status || 'OFFLINE'}
                severity={getStatusColor(technicianStatus?.status || 'OFFLINE') as any}
                icon="pi pi-circle-fill"
              />
            </div>
          </div>

          <div className="text-right">
            <div className="flex align-items-center gap-2 mb-1">
              <i className={classNames('pi', {
                'pi-wifi text-green-400': isOnline,
                'pi-wifi text-red-400': !isOnline,
              })} />
              <i className={classNames('pi', {
                'pi-map-marker text-green-400': isTracking && accuracy < 50,
                'pi-map-marker text-yellow-400': isTracking && accuracy >= 50,
                'pi-map-marker text-red-400': !isTracking,
              })} />
            </div>
            <div className="text-xs text-gray-400">
              {isOnline ? 'Online' : 'Offline'} • {isTracking ? `GPS: ${accuracy}m` : 'Brak GPS'}
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {technicianStatus?.todayStats.jobsCompleted || 0}
            </div>
            <div className="text-xs text-gray-400">Ukończone</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {technicianStatus?.todayStats.jobsScheduled || 0}
            </div>
            <div className="text-xs text-gray-400">Zaplanowane</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {technicianStatus?.todayStats.efficiency || 0}%
            </div>
            <div className="text-xs text-gray-400">Efektywność</div>
          </div>
        </div>

        {/* Sync Status */}
        {!isOnline && pendingSync.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-900 rounded">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-exclamation-triangle text-yellow-400" />
              <span className="text-yellow-200 text-sm">
                {pendingSync.length} akcji oczekuje na synchronizację
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header="Dzisiaj" leftIcon="pi pi-calendar">
            <div className="space-y-4">
              {/* Current Job */}
              {currentJob && (
                <Card className="bg-blue-900 border-blue-700">
                  <div className="flex justify-content-between align-items-start mb-3">
                    <h4 className="text-white font-semibold">Aktualne zlecenie</h4>
                    <Tag value={currentJob.status} severity="info" />
                  </div>
                  
                  <HvacMobileJobCard
                    job={currentJob}
                    onSelect={handleJobSelect}
                    onStatusUpdate={handleStatusUpdate}
                    onNavigate={handleNavigation}
                    isCurrentJob={true}
                  />
                </Card>
              )}

              {/* Upcoming Jobs */}
              {upcomingJobs.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">
                    Nadchodzące zlecenia ({upcomingJobs.length})
                  </h4>
                  <div className="space-y-3">
                    {upcomingJobs.map(job => (
                      <HvacMobileJobCard
                        key={job.id}
                        job={job}
                        onSelect={handleJobSelect}
                        onStatusUpdate={handleStatusUpdate}
                        onNavigate={handleNavigation}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Jobs */}
              {inProgressJobs.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">
                    W trakcie ({inProgressJobs.length})
                  </h4>
                  <div className="space-y-3">
                    {inProgressJobs.map(job => (
                      <HvacMobileJobCard
                        key={job.id}
                        job={job}
                        onSelect={handleJobSelect}
                        onStatusUpdate={handleStatusUpdate}
                        onNavigate={handleNavigation}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No jobs message */}
              {todayJobs.length === 0 && (
                <div className="text-center py-8">
                  <i className="pi pi-calendar text-gray-400 text-4xl mb-3" />
                  <div className="text-gray-400">
                    Brak zleceń na dziś
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel header="Ukończone" leftIcon="pi pi-check">
            <div className="space-y-3">
              {completedJobs.length > 0 ? (
                completedJobs.map(job => (
                  <HvacMobileJobCard
                    key={job.id}
                    job={job}
                    onSelect={handleJobSelect}
                    onStatusUpdate={handleStatusUpdate}
                    onNavigate={handleNavigation}
                    isCompleted={true}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="pi pi-check-circle text-gray-400 text-4xl mb-3" />
                  <div className="text-gray-400">
                    Brak ukończonych zleceń
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel header="Mapa" leftIcon="pi pi-map">
            <HvacMobileNavigation
              currentLocation={location}
              jobs={assignedJobs}
              onJobSelect={handleJobSelect}
              onNavigate={handleNavigation}
            />
          </TabPanel>
        </TabView>
      </div>

      {/* Work Order Dialog */}
      <Dialog
        visible={showWorkOrder}
        onHide={() => setShowWorkOrder(false)}
        header="Zlecenie pracy"
        className="w-full h-full m-0"
        contentClassName="h-full"
        maximizable
      >
        {selectedJob && (
          <HvacMobileWorkOrder
            job={selectedJob}
            onComplete={handleJobComplete}
            onStatusUpdate={handleStatusUpdate}
            onClose={() => setShowWorkOrder(false)}
          />
        )}
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        visible={showStatusDialog}
        onHide={() => setShowStatusDialog(false)}
        header="Zmień status"
        className="w-20rem"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE'].map(status => (
              <Button
                key={status}
                label={status}
                className={classNames(
                  'p-button-sm',
                  technicianStatus?.status === status ? 'p-button-primary' : 'p-button-outlined'
                )}
                onClick={() => handleTechnicianStatusChange(status as any, statusNotes)}
              />
            ))}
          </div>
          
          <InputTextarea
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            placeholder="Dodatkowe uwagi..."
            rows={3}
            className="w-full"
          />
        </div>
      </Dialog>

      {/* Speed Dial */}
      <SpeedDial
        model={speedDialItems}
        radius={80}
        type="quarter-circle"
        direction="up-left"
        style={{ left: 'calc(100vw - 80px)', top: 'calc(100vh - 80px)' }}
        buttonClassName="p-button-help"
      />
    </div>
  );
};
