/**
 * HVAC Compliance Tracker Component
 * "Pasja rodzi profesjonalizm" - Professional HVAC Compliance Management
 * 
 * Features:
 * - EPA compliance tracking
 * - OSHA safety compliance
 * - Local building code compliance
 * - Certification management
 * - Audit trail
 * - Automated alerts
 */

import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Chip } from 'primereact/chip';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Knob } from 'primereact/knob';
import { ProgressBar } from 'primereact/progressbar';
import { TabPanel, TabView } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';

// Types
interface ComplianceItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  complianceType: 'EPA' | 'OSHA' | 'LOCAL_CODE' | 'CERTIFICATION';
  requirement: string;
  status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' | 'EXPIRED';
  lastCheck: Date;
  nextDue: Date;
  responsible: string;
  notes?: string;
  documents: string[];
}

interface ComplianceStats {
  totalItems: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  expired: number;
  complianceRate: number;
}

interface ComplianceTrackerProps {
  complianceRate: number;
  overdueItems: any[];
  upcomingItems: any[];
  onComplianceUpdate: () => void;
}

export const HvacComplianceTracker: React.FC<ComplianceTrackerProps> = ({
  complianceRate,
  overdueItems,
  upcomingItems,
  onComplianceUpdate,
}) => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    totalItems: 0,
    compliant: 0,
    atRisk: 0,
    nonCompliant: 0,
    expired: 0,
    complianceRate: 0,
  });
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockItems: ComplianceItem[] = [
      {
        id: 'comp-1',
        equipmentId: 'eq-1',
        equipmentName: 'Klimatyzacja biurowa A1',
        complianceType: 'EPA',
        requirement: 'EPA 608 - Refrigerant Handling',
        status: 'COMPLIANT',
        lastCheck: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextDue: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
        responsible: 'Jan Kowalski',
        documents: ['cert-epa-608.pdf'],
      },
      {
        id: 'comp-2',
        equipmentId: 'eq-2',
        equipmentName: 'System wentylacji B2',
        complianceType: 'OSHA',
        requirement: 'OSHA Safety Standards',
        status: 'AT_RISK',
        lastCheck: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        responsible: 'Anna Nowak',
        documents: ['safety-inspection.pdf'],
      },
      {
        id: 'comp-3',
        equipmentId: 'eq-3',
        equipmentName: 'Pompa ciepła C3',
        complianceType: 'LOCAL_CODE',
        requirement: 'Local Building Code Compliance',
        status: 'NON_COMPLIANT',
        lastCheck: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        nextDue: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        responsible: 'Piotr Wiśniewski',
        documents: [],
      },
    ];

    setComplianceItems(mockItems);

    // Calculate stats
    const newStats: ComplianceStats = {
      totalItems: mockItems.length,
      compliant: mockItems.filter(item => item.status === 'COMPLIANT').length,
      atRisk: mockItems.filter(item => item.status === 'AT_RISK').length,
      nonCompliant: mockItems.filter(item => item.status === 'NON_COMPLIANT').length,
      expired: mockItems.filter(item => item.status === 'EXPIRED').length,
      complianceRate: Math.round((mockItems.filter(item => item.status === 'COMPLIANT').length / mockItems.length) * 100),
    };

    setStats(newStats);
  }, []);

  // Filter options
  const typeOptions = [
    { label: 'Wszystkie', value: 'ALL' },
    { label: 'EPA', value: 'EPA' },
    { label: 'OSHA', value: 'OSHA' },
    { label: 'Przepisy lokalne', value: 'LOCAL_CODE' },
    { label: 'Certyfikaty', value: 'CERTIFICATION' },
  ];

  // Status template
  const statusTemplate = (item: ComplianceItem) => {
    const statusConfig = {
      COMPLIANT: { label: 'Zgodne', severity: 'success' as const, icon: 'pi-check' },
      AT_RISK: { label: 'Zagrożone', severity: 'warning' as const, icon: 'pi-exclamation-triangle' },
      NON_COMPLIANT: { label: 'Niezgodne', severity: 'danger' as const, icon: 'pi-times' },
      EXPIRED: { label: 'Wygasłe', severity: 'danger' as const, icon: 'pi-clock' },
    }[item.status];

    return (
      <Tag
        value={statusConfig.label}
        severity={statusConfig.severity}
        icon={`pi ${statusConfig.icon}`}
      />
    );
  };

  // Compliance type template
  const typeTemplate = (item: ComplianceItem) => {
    const typeConfig = {
      EPA: { label: 'EPA', color: 'blue' },
      OSHA: { label: 'OSHA', color: 'orange' },
      LOCAL_CODE: { label: 'Przepisy', color: 'green' },
      CERTIFICATION: { label: 'Certyfikat', color: 'purple' },
    }[item.complianceType];

    return (
      <Chip
        label={typeConfig.label}
        className={`bg-${typeConfig.color}-100 text-${typeConfig.color}-800`}
      />
    );
  };

  // Days until due template
  const daysUntilDueTemplate = (item: ComplianceItem) => {
    const now = new Date();
    const dueDate = new Date(item.nextDue);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge value={`${Math.abs(diffDays)} dni po terminie`} severity="danger" />;
    } else if (diffDays <= 7) {
      return <Badge value={`${diffDays} dni`} severity="warning" />;
    } else if (diffDays <= 30) {
      return <Badge value={`${diffDays} dni`} severity="info" />;
    } else {
      return <Badge value={`${diffDays} dni`} severity="success" />;
    }
  };

  // Actions template
  const actionsTemplate = (item: ComplianceItem) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-sm p-button-outlined"
          tooltip="Szczegóły"
          onClick={() => {
            // Open details dialog
          }}
        />
        <Button
          icon="pi pi-refresh"
          className="p-button-sm p-button-info"
          tooltip="Aktualizuj status"
          onClick={() => {
            // Update compliance status
          }}
        />
        <Button
          icon="pi pi-file-pdf"
          className="p-button-sm p-button-secondary"
          tooltip="Dokumenty"
          onClick={() => {
            // Open documents
          }}
        />
      </div>
    );
  };

  // Filter items based on selected type
  const filteredItems = selectedType === 'ALL' 
    ? complianceItems 
    : complianceItems.filter(item => item.complianceType === selectedType);

  return (
    <div className="hvac-compliance-tracker">
      <Toast ref={toast} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Ogólna zgodność</h4>
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
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Zgodne</div>
              <div className="text-2xl font-bold text-green-400">{stats.compliant}</div>
            </div>
            <i className="pi pi-check-circle text-green-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Zagrożone</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.atRisk}</div>
            </div>
            <i className="pi pi-exclamation-triangle text-yellow-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Niezgodne</div>
              <div className="text-2xl font-bold text-red-400">{stats.nonCompliant}</div>
            </div>
            <i className="pi pi-times-circle text-red-400 text-3xl" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Wszystkie wymagania" leftIcon="pi pi-list">
          <div className="mb-4">
            <div className="flex justify-content-between align-items-center">
              <h3 className="text-white font-semibold">Wymagania zgodności</h3>
              <div className="flex gap-2">
                <Dropdown
                  value={selectedType}
                  options={typeOptions}
                  onChange={(e) => setSelectedType(e.value)}
                  placeholder="Filtruj według typu"
                  className="w-12rem"
                />
                <Button
                  icon="pi pi-refresh"
                  label="Odśwież"
                  className="p-button-outlined"
                  onClick={onComplianceUpdate}
                />
              </div>
            </div>
          </div>

          <DataTable
            value={filteredItems}
            className="p-datatable-sm"
            emptyMessage="Brak wymagań zgodności"
            loading={loading}
            paginator
            rows={10}
          >
            <Column field="equipmentName" header="Urządzenie" />
            <Column field="complianceType" header="Typ" body={typeTemplate} />
            <Column field="requirement" header="Wymaganie" />
            <Column field="status" header="Status" body={statusTemplate} />
            <Column field="responsible" header="Odpowiedzialny" />
            <Column 
              field="lastCheck" 
              header="Ostatnia kontrola"
              body={(item) => item.lastCheck.toLocaleDateString('pl-PL')}
            />
            <Column 
              field="nextDue" 
              header="Termin"
              body={daysUntilDueTemplate}
            />
            <Column header="Akcje" body={actionsTemplate} />
          </DataTable>
        </TabPanel>

        <TabPanel header="Nadchodzące terminy" leftIcon="pi pi-calendar">
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Nadchodzące terminy zgodności</h3>
            
            {upcomingItems.length > 0 ? (
              <Timeline
                value={upcomingItems}
                align="alternate"
                className="customized-timeline"
                marker={(item) => (
                  <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1 bg-blue-500">
                    <i className="pi pi-calendar" />
                  </span>
                )}
                content={(item, index) => (
                  <Card className="bg-gray-800 border-gray-700">
                    <div className="flex justify-content-between align-items-start">
                      <div>
                        <h4 className="text-white font-medium">{item.equipmentName}</h4>
                        <p className="text-gray-300 text-sm">{item.requirement}</p>
                        <div className="flex gap-2 mt-2">
                          {typeTemplate(item)}
                          {statusTemplate(item)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {item.nextDue.toLocaleDateString('pl-PL')}
                        </div>
                        {daysUntilDueTemplate(item)}
                      </div>
                    </div>
                  </Card>
                )}
              />
            ) : (
              <div className="text-center py-8">
                <i className="pi pi-calendar text-gray-400 text-4xl mb-3" />
                <div className="text-gray-400">
                  Brak nadchodzących terminów zgodności
                </div>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel header="Przeterminowane" leftIcon="pi pi-exclamation-triangle">
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-red-400">
              Przeterminowane wymagania zgodności
            </h3>
            
            {overdueItems.length > 0 ? (
              <DataTable
                value={overdueItems}
                className="p-datatable-sm"
                emptyMessage="Brak przeterminowanych wymagań"
              >
                <Column field="equipmentName" header="Urządzenie" />
                <Column field="complianceType" header="Typ" body={typeTemplate} />
                <Column field="requirement" header="Wymaganie" />
                <Column 
                  field="nextDue" 
                  header="Przeterminowane o"
                  body={daysUntilDueTemplate}
                />
                <Column field="responsible" header="Odpowiedzialny" />
                <Column header="Akcje" body={actionsTemplate} />
              </DataTable>
            ) : (
              <div className="text-center py-8">
                <i className="pi pi-check-circle text-green-400 text-4xl mb-3" />
                <div className="text-green-400">
                  Brak przeterminowanych wymagań zgodności
                </div>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel header="Raporty" leftIcon="pi pi-chart-bar">
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Raporty zgodności</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <h4 className="text-white font-medium mb-3">Zgodność według typu</h4>
                <div className="space-y-2">
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-gray-300">EPA</span>
                    <ProgressBar value={85} className="flex-1 mx-3" />
                    <span className="text-white">85%</span>
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-gray-300">OSHA</span>
                    <ProgressBar value={92} className="flex-1 mx-3" />
                    <span className="text-white">92%</span>
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-gray-300">Przepisy lokalne</span>
                    <ProgressBar value={78} className="flex-1 mx-3" />
                    <span className="text-white">78%</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <h4 className="text-white font-medium mb-3">Akcje</h4>
                <div className="space-y-2">
                  <Button
                    label="Generuj raport PDF"
                    icon="pi pi-file-pdf"
                    className="p-button-outlined w-full"
                  />
                  <Button
                    label="Eksportuj do Excel"
                    icon="pi pi-file-excel"
                    className="p-button-outlined w-full"
                  />
                  <Button
                    label="Zaplanuj audyt"
                    icon="pi pi-calendar-plus"
                    className="p-button-info w-full"
                  />
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};
