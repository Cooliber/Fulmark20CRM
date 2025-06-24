/**
 * HVAC Technician Tracker Component
 * "Pasja rodzi profesjonalizm" - Real-time Technician Monitoring
 * 
 * Features:
 * - Real-time GPS tracking
 * - Status monitoring
 * - Workload visualization
 * - Performance metrics
 * - Communication tools
 */

import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';
import { classNames } from 'primereact/utils';
import React, { useCallback, useRef, useState } from 'react';

// Import unified types
import {
    type ActiveDispatch,
    type Technician
} from '../../index';

interface TrackerProps {
  technicians: Technician[];
  activeDispatches: ActiveDispatch[];
  onTechnicianSelect: (technicianId: string) => void;
  loading?: boolean;
}

export const HvacTechnicianTracker: React.FC<TrackerProps> = ({
  technicians,
  activeDispatches,
  onTechnicianSelect,
  loading = false,
}) => {
  // Refs
  const toast = useRef<Toast>(null);
  const techDetailsRef = useRef<OverlayPanel>(null);
  const techMenuRef = useRef<Menu>(null);

  // State
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'efficiency' | 'workload'>('name');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Sort technicians
  const sortedTechnicians = React.useMemo(() => {
    let sorted = [...technicians];
    
    if (filterStatus) {
      sorted = sorted.filter(tech => tech.status === filterStatus);
    }
    
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'efficiency':
          return b.todayStats.efficiency - a.todayStats.efficiency;
        case 'workload':
          return b.todayStats.jobsScheduled - a.todayStats.jobsScheduled;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [technicians, sortBy, filterStatus]);

  // Get status configuration
  const getStatusConfig = useCallback((status: string) => {
    const configs = {
      AVAILABLE: { 
        label: 'Dostępny', 
        severity: 'success', 
        icon: 'pi pi-check-circle',
        color: '#22c55e'
      },
      BUSY: { 
        label: 'Zajęty', 
        severity: 'warning', 
        icon: 'pi pi-clock',
        color: '#f59e0b'
      },
      EN_ROUTE: { 
        label: 'W drodze', 
        severity: 'info', 
        icon: 'pi pi-car',
        color: '#3b82f6'
      },
      ON_BREAK: { 
        label: 'Przerwa', 
        severity: 'secondary', 
        icon: 'pi pi-pause',
        color: '#6b7280'
      },
      OFFLINE: { 
        label: 'Offline', 
        severity: 'danger', 
        icon: 'pi pi-times-circle',
        color: '#ef4444'
      },
    };
    return configs[status as keyof typeof configs] || configs.OFFLINE;
  }, []);

  // Get level badge
  const getLevelBadge = useCallback((level: string) => {
    const levels = {
      APPRENTICE: { label: 'Praktykant', color: '#8b5cf6' },
      JUNIOR: { label: 'Junior', color: '#06b6d4' },
      SENIOR: { label: 'Senior', color: '#10b981' },
      LEAD: { label: 'Lider', color: '#f59e0b' },
      SUPERVISOR: { label: 'Supervisor', color: '#ef4444' },
    };
    return levels[level as keyof typeof levels] || levels.JUNIOR;
  }, []);

  // Handle technician click
  const handleTechnicianClick = useCallback((technician: Technician, event: React.MouseEvent) => {
    setSelectedTechnician(technician);
    techDetailsRef.current?.toggle(event);
  }, []);

  // Handle technician context menu
  const handleTechnicianContextMenu = useCallback((technician: Technician, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedTechnician(technician);
    
    const menuItems = [
      {
        label: 'Szczegóły',
        icon: 'pi pi-info-circle',
        command: () => techDetailsRef.current?.toggle(event),
      },
      {
        label: 'Przydziel zlecenie',
        icon: 'pi pi-plus',
        command: () => onTechnicianSelect(technician.id),
      },
      {
        label: 'Pokaż na mapie',
        icon: 'pi pi-map-marker',
        command: () => setShowMap(true),
      },
      {
        label: 'Kontakt',
        icon: 'pi pi-phone',
        command: () => window.open(`tel:${technician.phone}`),
      },
    ];

    techMenuRef.current?.show(event);
  }, [onTechnicianSelect]);

  // Get active dispatch for technician
  const getActiveDispatch = useCallback((technicianId: string) => {
    return activeDispatches.find(dispatch => 
      dispatch.technicianId === technicianId && 
      ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(dispatch.status)
    );
  }, [activeDispatches]);

  // Render technician card
  const renderTechnicianCard = useCallback((technician: Technician) => {
    const statusConfig = getStatusConfig(technician.status);
    const levelBadge = getLevelBadge(technician.level);
    const activeDispatch = getActiveDispatch(technician.id);
    const workloadPercentage = (technician.todayStats.jobsCompleted / technician.todayStats.jobsScheduled) * 100 || 0;

    return (
      <Card
        key={technician.id}
        className={classNames(
          'technician-card mb-3 cursor-pointer transition-all duration-200',
          'bg-gray-800 border-gray-700 hover:bg-gray-700',
          {
            'border-l-4': true,
            'border-l-green-500': technician.status === 'AVAILABLE',
            'border-l-yellow-500': technician.status === 'BUSY',
            'border-l-blue-500': technician.status === 'EN_ROUTE',
            'border-l-gray-500': technician.status === 'ON_BREAK',
            'border-l-red-500': technician.status === 'OFFLINE',
          }
        )}
        onClick={(e) => handleTechnicianClick(technician, e)}
        onContextMenu={(e) => handleTechnicianContextMenu(technician, e)}
      >
        <div className="flex align-items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              image={technician.avatar}
              label={technician.name.split(' ').map(n => n[0]).join('')}
              size="large"
              shape="circle"
              style={{ backgroundColor: technician.color }}
            />
            <div
              className={classNames(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800',
                {
                  'bg-green-500': technician.status === 'AVAILABLE',
                  'bg-yellow-500': technician.status === 'BUSY',
                  'bg-blue-500': technician.status === 'EN_ROUTE',
                  'bg-gray-500': technician.status === 'ON_BREAK',
                  'bg-red-500': technician.status === 'OFFLINE',
                }
              )}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-content-between align-items-start mb-2">
              <div>
                <h4 className="text-white font-semibold text-sm mb-1 truncate">
                  {technician.name}
                </h4>
                <div className="flex gap-1 mb-1">
                  <Tag
                    value={statusConfig.label}
                    severity={statusConfig.severity as any}
                    icon={statusConfig.icon}
                    className="text-xs"
                  />
                  <Chip
                    label={levelBadge.label}
                    style={{ backgroundColor: levelBadge.color }}
                    className="text-xs text-white"
                  />
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">
                  Efektywność
                </div>
                <div className="text-sm font-semibold text-white">
                  {technician.todayStats.efficiency}%
                </div>
              </div>
            </div>

            {/* Current Job */}
            {technician.currentJob && (
              <div className="bg-gray-700 p-2 rounded mb-2">
                <div className="text-xs text-gray-300 mb-1">
                  Aktualne zlecenie:
                </div>
                <div className="text-sm text-white font-medium mb-1">
                  {technician.currentJob.customerName}
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {technician.currentJob.serviceType}
                </div>
                <ProgressBar
                  value={technician.currentJob.progress}
                  className="h-1"
                  showValue={false}
                />
              </div>
            )}

            {/* Active Dispatch */}
            {activeDispatch && (
              <div className="bg-blue-900 p-2 rounded mb-2">
                <div className="flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs text-blue-300 mb-1">
                      Wysłany do:
                    </div>
                    <div className="text-sm text-white">
                      {activeDispatch.customerInfo.name}
                    </div>
                  </div>
                  <Tag
                    value={activeDispatch.status}
                    severity="info"
                    className="text-xs"
                  />
                </div>
                {activeDispatch.estimatedArrival && (
                  <div className="text-xs text-blue-300 mt-1">
                    ETA: {activeDispatch.estimatedArrival.toLocaleTimeString('pl-PL')}
                  </div>
                )}
              </div>
            )}

            {/* Today's Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-400">Zlecenia</div>
                <div className="text-white font-medium">
                  {technician.todayStats.jobsCompleted}/{technician.todayStats.jobsScheduled}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Godziny</div>
                <div className="text-white font-medium">
                  {technician.todayStats.hoursWorked.toFixed(1)}h
                </div>
              </div>
            </div>

            {/* Workload Progress */}
            <div className="mt-2">
              <div className="flex justify-content-between text-xs mb-1">
                <span className="text-gray-400">Obciążenie</span>
                <span className="text-white">{workloadPercentage.toFixed(0)}%</span>
              </div>
              <ProgressBar
                value={workloadPercentage}
                className="h-1"
                showValue={false}
              />
            </div>

            {/* Skills */}
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {technician.skills.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    className="text-xs bg-gray-600 text-gray-200"
                  />
                ))}
                {technician.skills.length > 3 && (
                  <Chip
                    label={`+${technician.skills.length - 3}`}
                    className="text-xs bg-gray-600 text-gray-200"
                  />
                )}
              </div>
            </div>

            {/* Location Update */}
            <div className="mt-2 text-xs text-gray-400">
              Ostatnia aktualizacja: {technician.currentLocation.lastUpdated.toLocaleTimeString('pl-PL')}
            </div>
          </div>
        </div>
      </Card>
    );
  }, [getStatusConfig, getLevelBadge, getActiveDispatch, handleTechnicianClick, handleTechnicianContextMenu]);

  // Filter buttons
  const statusFilters = [
    { label: 'Wszyscy', value: null },
    { label: 'Dostępni', value: 'AVAILABLE' },
    { label: 'Zajęci', value: 'BUSY' },
    { label: 'W drodze', value: 'EN_ROUTE' },
    { label: 'Offline', value: 'OFFLINE' },
  ];

  return (
    <div className="hvac-technician-tracker h-full">
      <Toast ref={toast} />
      <Tooltip target=".technician-card" />

      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <h3 className="text-lg font-semibold text-white">
            Technicy ({technicians.length})
          </h3>
          <Button
            icon="pi pi-map"
            className="p-button-text p-button-sm"
            onClick={() => setShowMap(!showMap)}
            tooltip="Pokaż mapę"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1 mb-3">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value || 'all'}
              label={filter.label}
              className={classNames(
                'p-button-sm',
                filterStatus === filter.value
                  ? 'p-button-primary'
                  : 'p-button-outlined p-button-secondary'
              )}
              onClick={() => setFilterStatus(filter.value)}
            />
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-1">
          <Button
            label="Nazwa"
            className={classNames(
              'p-button-sm',
              sortBy === 'name' ? 'p-button-primary' : 'p-button-text'
            )}
            onClick={() => setSortBy('name')}
          />
          <Button
            label="Status"
            className={classNames(
              'p-button-sm',
              sortBy === 'status' ? 'p-button-primary' : 'p-button-text'
            )}
            onClick={() => setSortBy('status')}
          />
          <Button
            label="Efektywność"
            className={classNames(
              'p-button-sm',
              sortBy === 'efficiency' ? 'p-button-primary' : 'p-button-text'
            )}
            onClick={() => setSortBy('efficiency')}
          />
        </div>
      </div>

      {/* Technicians List */}
      <div className="technicians-list overflow-auto h-full">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            Ładowanie techników...
          </div>
        ) : sortedTechnicians.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Brak techników do wyświetlenia
          </div>
        ) : (
          sortedTechnicians.map(renderTechnicianCard)
        )}
      </div>

      {/* Technician Details Overlay */}
      <OverlayPanel ref={techDetailsRef} className="w-25rem">
        {selectedTechnician && (
          <div className="technician-details">
            <div className="flex align-items-center gap-3 mb-4">
              <Avatar
                image={selectedTechnician.avatar}
                label={selectedTechnician.name.split(' ').map(n => n[0]).join('')}
                size="large"
                shape="circle"
                style={{ backgroundColor: selectedTechnician.color }}
              />
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  {selectedTechnician.name}
                </h4>
                <div className="flex gap-2">
                  <Tag
                    value={getStatusConfig(selectedTechnician.status).label}
                    severity={getStatusConfig(selectedTechnician.status).severity as any}
                  />
                  <Chip
                    label={getLevelBadge(selectedTechnician.level).label}
                    style={{ backgroundColor: getLevelBadge(selectedTechnician.level).color }}
                    className="text-white"
                  />
                </div>
              </div>
            </div>

            <Divider />

            <div className="space-y-3">
              <div>
                <strong>Email:</strong> {selectedTechnician.email}
              </div>
              <div>
                <strong>Telefon:</strong> {selectedTechnician.phone}
              </div>
              <div>
                <strong>Godziny pracy:</strong> {selectedTechnician.workingHours.start} - {selectedTechnician.workingHours.end}
              </div>
              
              <Divider />
              
              <div>
                <strong>Dzisiejsze statystyki:</strong>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-content-between">
                    <span>Zlecenia wykonane:</span>
                    <span>{selectedTechnician.todayStats.jobsCompleted}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span>Zlecenia zaplanowane:</span>
                    <span>{selectedTechnician.todayStats.jobsScheduled}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span>Godziny pracy:</span>
                    <span>{selectedTechnician.todayStats.hoursWorked.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span>Czas podróży:</span>
                    <span>{selectedTechnician.todayStats.travelTime.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span>Efektywność:</span>
                    <span>{selectedTechnician.todayStats.efficiency}%</span>
                  </div>
                </div>
              </div>

              <Divider />

              <div>
                <strong>Umiejętności:</strong>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTechnician.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      className="bg-blue-100 text-blue-800"
                    />
                  ))}
                </div>
              </div>

              {selectedTechnician.currentLocation.address && (
                <div>
                  <strong>Lokalizacja:</strong>
                  <div className="mt-1 text-sm text-gray-600">
                    {selectedTechnician.currentLocation.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ostatnia aktualizacja: {selectedTechnician.currentLocation.lastUpdated.toLocaleString('pl-PL')}
                  </div>
                </div>
              )}
            </div>

            <Divider />

            <div className="flex gap-2">
              <Button
                label="Przydziel zlecenie"
                icon="pi pi-plus"
                className="p-button-primary flex-1"
                onClick={() => {
                  onTechnicianSelect(selectedTechnician.id);
                  techDetailsRef.current?.hide();
                }}
              />
              <Button
                icon="pi pi-phone"
                className="p-button-outlined"
                onClick={() => window.open(`tel:${selectedTechnician.phone}`)}
                tooltip="Zadzwoń"
              />
              <Button
                icon="pi pi-envelope"
                className="p-button-outlined"
                onClick={() => window.open(`mailto:${selectedTechnician.email}`)}
                tooltip="Wyślij email"
              />
            </div>
          </div>
        )}
      </OverlayPanel>

      {/* Context Menu */}
      <Menu ref={techMenuRef} popup />
    </div>
  );
};
