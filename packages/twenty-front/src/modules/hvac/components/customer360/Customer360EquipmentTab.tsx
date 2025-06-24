/**
 * Customer 360 Equipment Tab Component - Enhanced
 * "Pasja rodzi profesjonalizm" - Professional HVAC equipment management
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
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Tag } from 'primereact/tag';
import React, { useState } from 'react';

// HVAC services and hooks
import {
    HVACEquipment as Equipment,
    trackHVACUserAction,
    useEquipmentManagement
} from '../../index';

interface Customer360EquipmentTabProps {
  customerId: string;
  equipment?: Equipment[];
}

export const Customer360EquipmentTab: React.FC<Customer360EquipmentTabProps> = ({
  customerId,
  equipment: propEquipment,
}) => {
  // State for dialogs
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  // Equipment management hook
  const {
    equipment,
    loading,
    error,
    selectedEquipment,
    maintenanceHistory,
    maintenanceLoading,
    loadEquipment,
    selectEquipment,
    loadMaintenanceHistory,
    refreshEquipment,
    clearError,
  } = useEquipmentManagement({
    customerId,
    autoLoad: true,
    onError: (error: Error) => {
      trackHVACUserAction('equipment_error', 'EQUIPMENT_MANAGEMENT', {
        customerId,
        error: error.message,
      });
    },
  });

  // Use prop equipment if provided, otherwise use hook equipment
  const displayEquipment = propEquipment || equipment;

  // Status configuration
  const statusConfig: Record<Equipment['status'], { label: string; severity: 'success' | 'warning' | 'danger' | 'secondary' }> = {
    ACTIVE: { label: 'Sprawny', severity: 'success' },
    MAINTENANCE: { label: 'Wymaga serwisu', severity: 'warning' },
    REPAIR_NEEDED: { label: 'Awaria', severity: 'danger' },
    INACTIVE: { label: 'Wyłączony', severity: 'secondary' },
  };

  // Type configuration
  const typeConfig: Record<Equipment['type'], { label: string; color: string }> = {
    AIR_CONDITIONING: { label: 'Klimatyzacja', color: 'blue' },
    VENTILATION: { label: 'Wentylacja', color: 'green' },
    HEATING: { label: 'Ogrzewanie', color: 'orange' },
    REFRIGERATION: { label: 'Chłodzenie', color: 'cyan' },
    HEAT_PUMP: { label: 'Pompa ciepła', color: 'purple' },
  };

  // Handle equipment actions
  const handleEquipmentAction = (action: string, equipmentId?: string) => {
    trackHVACUserAction(
      `customer360_equipment_${action}`,
      'EQUIPMENT_MANAGEMENT',
      { customerId, equipmentId, action }
    );
    
    console.log(`Equipment action: ${action}`, equipmentId);
  };

  // Column renderers
  const statusBodyTemplate = (rowData: Equipment) => (
    <Badge
      value={statusConfig[rowData.status].label}
      severity={statusConfig[rowData.status].severity}
    />
  );

  const typeBodyTemplate = (rowData: Equipment) => (
    <Tag
      value={typeConfig[rowData.type].label}
      style={{ backgroundColor: `var(--${typeConfig[rowData.type].color}-500)` }}
    />
  );

  const dateBodyTemplate = (date: Date) => (
    date.toLocaleDateString('pl-PL')
  );

  const actionsBodyTemplate = (rowData: Equipment) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => handleEquipmentAction('view', rowData.id)}
        tooltip="Zobacz szczegóły"
      />
      <Button
        icon="pi pi-wrench"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => handleEquipmentAction('service', rowData.id)}
        tooltip="Zaplanuj serwis"
      />
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => handleEquipmentAction('edit', rowData.id)}
        tooltip="Edytuj"
      />
    </div>
  );

  return (
    <div className="grid">
      {/* Equipment Actions */}
      <div className="col-12">
        <Card title="Zarządzanie sprzętem" className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              label="Dodaj urządzenie"
              icon="pi pi-plus"
              onClick={() => handleEquipmentAction('add')}
            />
            <Button
              label="Zaplanuj przegląd"
              icon="pi pi-calendar"
              className="p-button-outlined"
              onClick={() => handleEquipmentAction('schedule_review')}
            />
            <Button
              label="Historia serwisów"
              icon="pi pi-history"
              className="p-button-outlined"
              onClick={() => handleEquipmentAction('service_history')}
            />
          </div>
        </Card>
      </div>

      {/* Equipment Table */}
      <div className="col-12">
        <Card title="Lista urządzeń">
          {displayEquipment.length > 0 ? (
            <DataTable
              value={displayEquipment}
              responsiveLayout="scroll"
              stripedRows
              showGridlines
            >
              <Column field="name" header="Nazwa urządzenia" sortable />
              <Column 
                field="type" 
                header="Typ" 
                body={typeBodyTemplate}
                sortable 
              />
              <Column field="model" header="Model" sortable />
              <Column field="serialNumber" header="Numer seryjny" />
              <Column 
                field="status" 
                header="Status" 
                body={statusBodyTemplate}
                sortable 
              />
              <Column 
                field="lastService" 
                header="Ostatni serwis" 
                body={(rowData) => dateBodyTemplate(rowData.lastService)}
                sortable 
              />
              <Column 
                field="nextService" 
                header="Następny serwis" 
                body={(rowData) => dateBodyTemplate(rowData.nextService)}
                sortable 
              />
              <Column 
                header="Akcje" 
                body={actionsBodyTemplate}
                style={{ width: '120px' }}
              />
            </DataTable>
          ) : (
            <div className="text-center p-6">
              <i className="pi pi-cog text-6xl text-400 mb-4" />
              <h3 className="text-900 font-semibold mb-2">Brak urządzeń</h3>
              <p className="text-600 mb-4">
                Nie ma jeszcze żadnych urządzeń przypisanych do tego klienta.
              </p>
              <Button
                label="Dodaj pierwsze urządzenie"
                icon="pi pi-plus"
                onClick={() => handleEquipmentAction('add')}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
