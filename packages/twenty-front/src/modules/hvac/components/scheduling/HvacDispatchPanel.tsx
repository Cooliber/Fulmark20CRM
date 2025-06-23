/**
 * HVAC Dispatch Panel Component
 * "Pasja rodzi profesjonalizm" - Professional HVAC Dispatch Management
 * 
 * Features:
 * - Real-time dispatch coordination
 * - Emergency response management
 * - Technician assignment and tracking
 * - Customer communication
 * - Route optimization
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Timeline } from 'primereact/timeline';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
import { classNames } from 'primereact/utils';
import { useHvacDispatch } from '../../hooks/useHvacDispatch';
import { useHvacTechnicians } from '../../hooks/useHvacTechnicians';

// Types
interface DispatchJob {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  serviceType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
  estimatedDuration: number;
  scheduledTime: Date;
  assignedTechnician?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

interface Technician {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'ON_BREAK' | 'OFFLINE';
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  skills: string[];
  currentJobs: number;
  maxJobs: number;
}

export const HvacDispatchPanel: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [selectedJob, setSelectedJob] = useState<DispatchJob | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Custom hooks
  const {
    pendingJobs,
    activeJobs,
    emergencyJobs,
    loading: dispatchLoading,
    assignJob,
    reassignJob,
    updateJobStatus,
    sendCustomerNotification,
  } = useHvacDispatch();

  const {
    availableTechnicians,
    busyTechnicians,
    loading: techniciansLoading,
    getTechnicianLocation,
    updateTechnicianStatus,
  } = useHvacTechnicians();

  // Handle job assignment
  const handleAssignJob = useCallback(async () => {
    if (!selectedJob || !selectedTechnician) return;

    try {
      await assignJob(selectedJob.id, selectedTechnician, dispatchNotes);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Zlecenie przydzielone',
        detail: `Zlecenie zostało przydzielone technikowi`,
        life: 3000,
      });

      setShowAssignDialog(false);
      setSelectedJob(null);
      setSelectedTechnician('');
      setDispatchNotes('');
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się przydzielić zlecenia',
        life: 3000,
      });
    }
  }, [selectedJob, selectedTechnician, dispatchNotes, assignJob]);

  // Handle emergency dispatch
  const handleEmergencyDispatch = useCallback(async (job: DispatchJob) => {
    try {
      // Find nearest available technician
      const nearestTechnician = availableTechnicians[0]; // Simplified logic
      
      if (nearestTechnician) {
        await assignJob(job.id, nearestTechnician.id, 'EMERGENCY DISPATCH - Immediate response required');
        
        // Send customer notification
        await sendCustomerNotification(job.id, 'TECHNICIAN_ASSIGNED', {
          technicianName: nearestTechnician.name,
          eta: '15-30 minut',
        });

        toast.current?.show({
          severity: 'success',
          summary: 'Awaria przydzielona',
          detail: `Technik ${nearestTechnician.name} został wysłany`,
          life: 5000,
        });
      } else {
        toast.current?.show({
          severity: 'warn',
          summary: 'Brak dostępnych techników',
          detail: 'Wszyscy technicy są zajęci',
          life: 5000,
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się przydzielić awarii',
        life: 3000,
      });
    }
  }, [availableTechnicians, assignJob, sendCustomerNotification]);

  // Priority template
  const priorityTemplate = (job: DispatchJob) => {
    const severity = {
      EMERGENCY: 'danger',
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'success',
    }[job.priority] || 'info';

    return <Badge value={job.priority} severity={severity as any} />;
  };

  // Status template
  const statusTemplate = (job: DispatchJob) => {
    const statusConfig = {
      PENDING: { label: 'Oczekuje', severity: 'warning' },
      ASSIGNED: { label: 'Przydzielone', severity: 'info' },
      EN_ROUTE: { label: 'W drodze', severity: 'info' },
      ARRIVED: { label: 'Na miejscu', severity: 'warning' },
      IN_PROGRESS: { label: 'W trakcie', severity: 'warning' },
      COMPLETED: { label: 'Zakończone', severity: 'success' },
    }[job.status] || { label: job.status, severity: 'info' };

    return <Tag value={statusConfig.label} severity={statusConfig.severity as any} />;
  };

  // Actions template
  const actionsTemplate = (job: DispatchJob) => {
    return (
      <div className="flex gap-2">
        {job.status === 'PENDING' && (
          <Button
            icon="pi pi-user-plus"
            className="p-button-sm p-button-info"
            tooltip="Przydziel technika"
            onClick={() => {
              setSelectedJob(job);
              setShowAssignDialog(true);
            }}
          />
        )}
        
        {job.priority === 'EMERGENCY' && job.status === 'PENDING' && (
          <Button
            icon="pi pi-bolt"
            className="p-button-sm p-button-danger"
            tooltip="Natychmiastowe przydzielenie"
            onClick={() => handleEmergencyDispatch(job)}
          />
        )}
        
        <Button
          icon="pi pi-phone"
          className="p-button-sm p-button-outlined"
          tooltip="Zadzwoń do klienta"
          onClick={() => window.open(`tel:${job.customerPhone}`)}
        />
        
        <Button
          icon="pi pi-map-marker"
          className="p-button-sm p-button-outlined"
          tooltip="Pokaż na mapie"
          onClick={() => {
            const url = `https://www.google.com/maps/search/?api=1&query=${job.location.latitude},${job.location.longitude}`;
            window.open(url, '_blank');
          }}
        />
      </div>
    );
  };

  // Technician options for dropdown
  const technicianOptions = availableTechnicians.map(tech => ({
    label: `${tech.name} (${tech.currentJobs}/${tech.maxJobs} zleceń)`,
    value: tech.id,
  }));

  return (
    <div className="hvac-dispatch-panel">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Panel Dyspozytorski</h2>
        
        <div className="flex gap-2">
          <Chip
            label={`${emergencyJobs.length} awarii`}
            className="bg-red-100 text-red-800"
            icon="pi pi-exclamation-triangle"
          />
          <Chip
            label={`${pendingJobs.length} oczekujących`}
            className="bg-yellow-100 text-yellow-800"
            icon="pi pi-clock"
          />
          <Chip
            label={`${activeJobs.length} aktywnych`}
            className="bg-blue-100 text-blue-800"
            icon="pi pi-cog"
          />
        </div>
      </div>

      {/* Emergency Jobs */}
      {emergencyJobs.length > 0 && (
        <Card className="mb-4 bg-red-900 border-red-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex align-items-center gap-2">
            <i className="pi pi-exclamation-triangle text-red-400" />
            Awarie wymagające natychmiastowej interwencji
          </h3>
          
          <DataTable
            value={emergencyJobs}
            className="p-datatable-sm"
            emptyMessage="Brak awarii"
          >
            <Column field="ticketId" header="Nr zgłoszenia" />
            <Column field="customerName" header="Klient" />
            <Column field="serviceType" header="Typ usługi" />
            <Column field="priority" header="Priorytet" body={priorityTemplate} />
            <Column field="status" header="Status" body={statusTemplate} />
            <Column 
              field="scheduledTime" 
              header="Czas zgłoszenia"
              body={(job) => new Date(job.scheduledTime).toLocaleString('pl-PL')}
            />
            <Column header="Akcje" body={actionsTemplate} />
          </DataTable>
        </Card>
      )}

      {/* Pending Jobs */}
      <Card className="mb-4 bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">
          Zlecenia oczekujące na przydzielenie ({pendingJobs.length})
        </h3>
        
        <DataTable
          value={pendingJobs}
          className="p-datatable-sm"
          emptyMessage="Brak oczekujących zleceń"
          loading={dispatchLoading}
        >
          <Column field="ticketId" header="Nr zgłoszenia" />
          <Column field="customerName" header="Klient" />
          <Column field="address" header="Adres" />
          <Column field="serviceType" header="Typ usługi" />
          <Column field="priority" header="Priorytet" body={priorityTemplate} />
          <Column 
            field="scheduledTime" 
            header="Planowany czas"
            body={(job) => new Date(job.scheduledTime).toLocaleString('pl-PL')}
          />
          <Column 
            field="estimatedDuration" 
            header="Czas trwania"
            body={(job) => `${job.estimatedDuration} min`}
          />
          <Column header="Akcje" body={actionsTemplate} />
        </DataTable>
      </Card>

      {/* Active Jobs */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">
          Aktywne zlecenia ({activeJobs.length})
        </h3>
        
        <DataTable
          value={activeJobs}
          className="p-datatable-sm"
          emptyMessage="Brak aktywnych zleceń"
          loading={dispatchLoading}
        >
          <Column field="ticketId" header="Nr zgłoszenia" />
          <Column field="customerName" header="Klient" />
          <Column field="assignedTechnician" header="Technik" />
          <Column field="status" header="Status" body={statusTemplate} />
          <Column 
            field="scheduledTime" 
            header="Rozpoczęcie"
            body={(job) => new Date(job.scheduledTime).toLocaleString('pl-PL')}
          />
          <Column header="Akcje" body={actionsTemplate} />
        </DataTable>
      </Card>

      {/* Assignment Dialog */}
      <Dialog
        visible={showAssignDialog}
        onHide={() => setShowAssignDialog(false)}
        header="Przydziel zlecenie technikowi"
        className="w-30rem"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Szczegóły zlecenia:</h4>
              <p><strong>Klient:</strong> {selectedJob.customerName}</p>
              <p><strong>Adres:</strong> {selectedJob.address}</p>
              <p><strong>Typ usługi:</strong> {selectedJob.serviceType}</p>
              <p><strong>Priorytet:</strong> {selectedJob.priority}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Wybierz technika:</label>
              <Dropdown
                value={selectedTechnician}
                options={technicianOptions}
                onChange={(e) => setSelectedTechnician(e.value)}
                placeholder="Wybierz technika..."
                className="w-full"
                loading={techniciansLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Uwagi:</label>
              <InputTextarea
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Dodatkowe uwagi dla technika..."
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2 pt-3">
              <Button
                label="Anuluj"
                icon="pi pi-times"
                className="p-button-outlined flex-1"
                onClick={() => setShowAssignDialog(false)}
              />
              <Button
                label="Przydziel"
                icon="pi pi-check"
                className="p-button-success flex-1"
                onClick={handleAssignJob}
                disabled={!selectedTechnician}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
