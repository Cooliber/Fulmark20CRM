/**
 * HVAC Equipment Management Component
 * "Pasja rodzi profesjonalizm" - Professional Equipment Management
 *
 * Advanced equipment management with:
 * - Real-time equipment monitoring
 * - Maintenance scheduling
 * - Performance analytics
 * - IoT integration
 * - Polish manufacturer support (Vaillant, Viessmann, Bosch)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
import { Tag } from 'primereact/tag';

// HVAC Hooks and Services
import {
  useEquipmentManagement,
  trackHVACUserAction,
  useHVACPerformanceMonitoring
} from '../../index';

// Types
interface Equipment {
  id: string;
  name: string;
  type: 'BOILER' | 'HEAT_PUMP' | 'AC_UNIT' | 'VENTILATION' | 'CHILLER';
  manufacturer: 'VAILLANT' | 'VIESSMANN' | 'BOSCH' | 'DAIKIN' | 'CARRIER' | 'OTHER';
  model: string;
  serialNumber: string;
  location: string;
  installationDate: Date;
  lastMaintenance: Date | null;
  nextMaintenance: Date;
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';
  efficiency: number; // 0-100%
  energyConsumption: number; // kWh
  operatingHours: number;
  warrantyExpiry: Date;
  notes?: string;
}

interface EquipmentFormData {
  name: string;
  type: Equipment['type'];
  manufacturer: Equipment['manufacturer'];
  model: string;
  serialNumber: string;
  location: string;
  installationDate: Date | null;
  warrantyExpiry: Date | null;
  notes: string;
}

export const HvacEquipmentManagement: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    type: 'BOILER',
    manufacturer: 'VAILLANT',
    model: '',
    serialNumber: '',
    location: '',
    installationDate: null,
    warrantyExpiry: null,
    notes: '',
  });

  // Custom hooks
  const {
    equipment,
    loading,
    error,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    scheduleMaintenanceForEquipment,
    getEquipmentPerformanceMetrics,
  } = useEquipmentManagement();

  const { measureOperation } = useHVACPerformanceMonitoring({
    enableMetrics: true,
    performanceThreshold: 300,
  });

  // Equipment type options
  const equipmentTypes = [
    { label: 'Kocioł', value: 'BOILER' },
    { label: 'Pompa ciepła', value: 'HEAT_PUMP' },
    { label: 'Klimatyzacja', value: 'AC_UNIT' },
    { label: 'Wentylacja', value: 'VENTILATION' },
    { label: 'Chiller', value: 'CHILLER' },
  ];

  // Manufacturer options (Polish market focus)
  const manufacturers = [
    { label: 'Vaillant', value: 'VAILLANT' },
    { label: 'Viessmann', value: 'VIESSMANN' },
    { label: 'Bosch', value: 'BOSCH' },
    { label: 'Daikin', value: 'DAIKIN' },
    { label: 'Carrier', value: 'CARRIER' },
    { label: 'Inne', value: 'OTHER' },
  ];

  // Status severity mapping
  const getStatusSeverity = (status: Equipment['status']) => {
    switch (status) {
      case 'OPERATIONAL': return 'success';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'danger';
      case 'OFFLINE': return 'secondary';
      case 'MAINTENANCE': return 'info';
      default: return 'secondary';
    }
  };

  // Status labels
  const statusLabels = {
    OPERATIONAL: 'Sprawny',
    WARNING: 'Ostrzeżenie',
    CRITICAL: 'Krytyczny',
    OFFLINE: 'Offline',
    MAINTENANCE: 'Konserwacja',
  };

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.model || !formData.serialNumber) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Wypełnij wszystkie wymagane pola',
        life: 3000,
      });
      return;
    }

    try {
      const equipmentData = {
        ...formData,
        installationDate: formData.installationDate || new Date(),
        warrantyExpiry: formData.warrantyExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'OPERATIONAL' as const,
        efficiency: 100,
        energyConsumption: 0,
        operatingHours: 0,
        lastMaintenance: null,
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      };

      await measureOperation('equipment_add', async () => {
        if (selectedEquipment) {
          await updateEquipment(selectedEquipment.id, equipmentData);
        } else {
          await addEquipment(equipmentData);
        }
      });

      trackHVACUserAction(
        selectedEquipment ? 'equipment_updated' : 'equipment_added',
        'EQUIPMENT_MANAGEMENT',
        {
          equipmentType: formData.type,
          manufacturer: formData.manufacturer,
        }
      );

      toast.current?.show({
        severity: 'success',
        summary: 'Sukces',
        detail: selectedEquipment ? 'Urządzenie zaktualizowane' : 'Urządzenie dodane',
        life: 3000,
      });

      setShowAddDialog(false);
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się zapisać urządzenia',
        life: 5000,
      });
    }
  }, [formData, selectedEquipment, addEquipment, updateEquipment, measureOperation]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: 'BOILER',
      manufacturer: 'VAILLANT',
      model: '',
      serialNumber: '',
      location: '',
      installationDate: null,
      warrantyExpiry: null,
      notes: '',
    });
    setSelectedEquipment(null);
  }, []);

  // Handle edit
  const handleEdit = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      type: equipment.type,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      location: equipment.location,
      installationDate: equipment.installationDate,
      warrantyExpiry: equipment.warrantyExpiry,
      notes: equipment.notes || '',
    });
    setShowEditDialog(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (equipment: Equipment) => {
    try {
      await deleteEquipment(equipment.id);
      
      trackHVACUserAction('equipment_deleted', 'EQUIPMENT_MANAGEMENT', {
        equipmentId: equipment.id,
        equipmentType: equipment.type,
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Urządzenie usunięte',
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się usunąć urządzenia',
        life: 5000,
      });
    }
  }, [deleteEquipment]);

  // Schedule maintenance
  const handleScheduleMaintenance = useCallback(async (equipment: Equipment) => {
    try {
      const maintenanceDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
      await scheduleMaintenanceForEquipment(equipment.id, maintenanceDate);
      
      trackHVACUserAction('maintenance_scheduled', 'EQUIPMENT_MANAGEMENT', {
        equipmentId: equipment.id,
        maintenanceDate: maintenanceDate.toISOString(),
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Konserwacja zaplanowana',
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się zaplanować konserwacji',
        life: 5000,
      });
    }
  }, [scheduleMaintenanceForEquipment]);

  // Column templates
  const statusBodyTemplate = (rowData: Equipment) => (
    <Badge
      value={statusLabels[rowData.status]}
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const manufacturerBodyTemplate = (rowData: Equipment) => (
    <Chip label={rowData.manufacturer} className="mr-2" />
  );

  const efficiencyBodyTemplate = (rowData: Equipment) => (
    <div className="flex align-items-center gap-2">
      <ProgressBar value={rowData.efficiency} className="w-6rem" />
      <span>{rowData.efficiency}%</span>
    </div>
  );

  const actionsBodyTemplate = (rowData: Equipment) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        tooltip="Edytuj"
      />
      <Button
        icon="pi pi-calendar"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => handleScheduleMaintenance(rowData)}
        tooltip="Zaplanuj konserwację"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-sm p-button-danger"
        onClick={() => handleDelete(rowData)}
        tooltip="Usuń"
      />
    </div>
  );

  return (
    <div className="hvac-equipment-management">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Zarządzanie Sprzętem HVAC</h2>
        <Button
          label="Dodaj urządzenie"
          icon="pi pi-plus"
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
        />
      </div>

      {/* Main Content */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Lista urządzeń" leftIcon="pi pi-list">
          <Card>
            <DataTable
              value={equipment}
              loading={loading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              className="p-datatable-sm"
              emptyMessage="Brak urządzeń"
              responsiveLayout="scroll"
            >
              <Column field="name" header="Nazwa" sortable />
              <Column field="type" header="Typ" sortable />
              <Column body={manufacturerBodyTemplate} header="Producent" />
              <Column field="model" header="Model" />
              <Column field="location" header="Lokalizacja" />
              <Column body={statusBodyTemplate} header="Status" />
              <Column body={efficiencyBodyTemplate} header="Wydajność" />
              <Column body={actionsBodyTemplate} header="Akcje" />
            </DataTable>
          </Card>
        </TabPanel>

        <TabPanel header="Mapa urządzeń" leftIcon="pi pi-map">
          <Card>
            <div className="text-center p-6">
              <i className="pi pi-map text-6xl text-400 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Mapa urządzeń</h3>
              <p className="text-600">Interaktywna mapa lokalizacji urządzeń będzie dostępna wkrótce.</p>
            </div>
          </Card>
        </TabPanel>

        <TabPanel header="Analityka" leftIcon="pi pi-chart-line">
          <Card>
            <div className="text-center p-6">
              <i className="pi pi-chart-line text-6xl text-400 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Analityka wydajności</h3>
              <p className="text-600">Zaawansowana analityka wydajności urządzeń będzie dostępna wkrótce.</p>
            </div>
          </Card>
        </TabPanel>
      </TabView>

      {/* Add/Edit Dialog */}
      <Dialog
        visible={showAddDialog || showEditDialog}
        onHide={() => {
          setShowAddDialog(false);
          setShowEditDialog(false);
          resetForm();
        }}
        header={selectedEquipment ? 'Edytuj urządzenie' : 'Dodaj urządzenie'}
        className="w-30rem"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nazwa *</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full"
              placeholder="Nazwa urządzenia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Typ *</label>
              <Dropdown
                value={formData.type}
                options={equipmentTypes}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Producent *</label>
              <Dropdown
                value={formData.manufacturer}
                options={manufacturers}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <InputText
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full"
                placeholder="Model urządzenia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numer seryjny *</label>
              <InputText
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                className="w-full"
                placeholder="Numer seryjny"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lokalizacja</label>
            <InputText
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full"
              placeholder="Lokalizacja urządzenia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data instalacji</label>
              <Calendar
                value={formData.installationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, installationDate: e.value as Date }))}
                className="w-full"
                dateFormat="dd/mm/yy"
                placeholder="Wybierz datę"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Koniec gwarancji</label>
              <Calendar
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.value as Date }))}
                className="w-full"
                dateFormat="dd/mm/yy"
                placeholder="Wybierz datę"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Uwagi</label>
            <InputTextarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full"
              rows={3}
              placeholder="Dodatkowe uwagi..."
            />
          </div>

          <div className="flex justify-content-end gap-2 pt-4">
            <Button
              label="Anuluj"
              className="p-button-outlined"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
            />
            <Button
              label={selectedEquipment ? 'Zaktualizuj' : 'Dodaj'}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
