/**
 * HVAC Maintenance Calendar Component
 * "Pasja rodzi profesjonalizm" - Professional Maintenance Scheduling Calendar
 * 
 * Features:
 * - Visual maintenance scheduling
 * - Equipment-specific maintenance types
 * - Compliance deadline tracking
 * - Seasonal maintenance planning
 * - Drag-and-drop rescheduling
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Menu } from 'primereact/menu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import { Timeline } from 'primereact/timeline';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

// Types
interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  customerId: string;
  customerName: string;
  maintenanceType: 'PREVENTIVE' | 'INSPECTION' | 'CLEANING' | 'CALIBRATION' | 'PARTS_REPLACEMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SCHEDULED' | 'OVERDUE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: Date;
  estimatedDuration: number;
  lastPerformed?: Date;
  nextDueDate: Date;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'SEASONAL';
  complianceRequirements: string[];
  checklist: MaintenanceChecklistItem[];
  assignedTechnician?: string;
  notes?: string;
  cost?: number;
}

interface MaintenanceChecklistItem {
  id: string;
  description: string;
  category: 'SAFETY' | 'PERFORMANCE' | 'COMPLIANCE' | 'VISUAL' | 'MEASUREMENT';
  required: boolean;
  completed?: boolean;
  value?: string;
  notes?: string;
}

interface CalendarProps {
  selectedDate: Date;
  maintenanceSchedules: MaintenanceSchedule[];
  onDateSelect: (date: Date) => void;
  onMaintenanceSchedule: (maintenanceData: any) => void;
  loading?: boolean;
}

export const HvacMaintenanceCalendar: React.FC<CalendarProps> = ({
  selectedDate,
  maintenanceSchedules,
  onDateSelect,
  onMaintenanceSchedule,
  loading = false,
}) => {
  // Refs
  const toast = useRef<Toast>(null);
  const maintenanceMenuRef = useRef<Menu>(null);
  const maintenanceDetailsRef = useRef<OverlayPanel>(null);

  // State
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceSchedule | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [draggedMaintenance, setDraggedMaintenance] = useState<MaintenanceSchedule | null>(null);

  // Convert maintenance schedules to calendar events
  useEffect(() => {
    const events = maintenanceSchedules.map(maintenance => ({
      id: maintenance.id,
      title: `${maintenance.equipmentName} - ${maintenance.maintenanceType}`,
      start: maintenance.scheduledDate,
      end: new Date(maintenance.scheduledDate.getTime() + maintenance.estimatedDuration * 60000),
      backgroundColor: getMaintenanceColor(maintenance.maintenanceType, maintenance.priority),
      borderColor: getStatusColor(maintenance.status),
      textColor: '#ffffff',
      extendedProps: {
        maintenance,
        equipmentType: maintenance.equipmentType,
        customer: maintenance.customerName,
      },
    }));
    setCalendarEvents(events);
  }, [maintenanceSchedules]);

  // Get maintenance type color
  const getMaintenanceColor = useCallback((type: string, priority: string) => {
    const typeColors = {
      PREVENTIVE: '#3b82f6',
      INSPECTION: '#10b981',
      CLEANING: '#f59e0b',
      CALIBRATION: '#8b5cf6',
      PARTS_REPLACEMENT: '#ef4444',
    };

    const priorityModifier = {
      CRITICAL: 1.2,
      HIGH: 1.1,
      MEDIUM: 1.0,
      LOW: 0.8,
    };

    const baseColor = typeColors[type as keyof typeof typeColors] || '#6b7280';
    const modifier = priorityModifier[priority as keyof typeof priorityModifier] || 1.0;
    
    return baseColor;
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      SCHEDULED: '#3b82f6',
      OVERDUE: '#ef4444',
      IN_PROGRESS: '#f59e0b',
      COMPLETED: '#10b981',
      CANCELLED: '#6b7280',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }, []);

  // Get days in month with maintenance
  const getDaysWithMaintenance = useCallback(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayMaintenance = maintenanceSchedules.filter(maintenance => {
        const maintenanceDate = new Date(maintenance.scheduledDate);
        return maintenanceDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        maintenance: dayMaintenance,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
      });
    }

    return days;
  }, [selectedDate, maintenanceSchedules]);

  // Event handlers
  const handleMaintenanceClick = useCallback((maintenance: MaintenanceSchedule, event: React.MouseEvent) => {
    setSelectedMaintenance(maintenance);
    maintenanceDetailsRef.current?.toggle(event);
  }, []);

  const handleMaintenanceContextMenu = useCallback((maintenance: MaintenanceSchedule, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedMaintenance(maintenance);
    
    const menuItems = [
      {
        label: 'Szczegóły',
        icon: 'pi pi-info-circle',
        command: () => maintenanceDetailsRef.current?.toggle(event),
      },
      {
        label: 'Edytuj',
        icon: 'pi pi-pencil',
        command: () => {
          // Open edit dialog
        },
      },
      {
        label: 'Wykonaj teraz',
        icon: 'pi pi-play',
        command: () => {
          // Start maintenance
        },
      },
      {
        label: 'Przełóż',
        icon: 'pi pi-calendar',
        command: () => {
          // Reschedule maintenance
        },
      },
      {
        label: 'Anuluj',
        icon: 'pi pi-times',
        command: () => {
          confirmDialog({
            message: 'Czy na pewno chcesz anulować tę konserwację?',
            header: 'Potwierdzenie anulowania',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
              // Cancel maintenance
            },
          });
        },
      },
    ];

    maintenanceMenuRef.current?.show(event);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    onDateSelect(date);
  }, [onDateSelect]);

  // Render maintenance item
  const renderMaintenanceItem = useCallback((maintenance: MaintenanceSchedule) => {
    const isOverdue = maintenance.status === 'OVERDUE' || 
      (maintenance.status === 'SCHEDULED' && new Date(maintenance.scheduledDate) < new Date());

    return (
      <div
        key={maintenance.id}
        className={classNames(
          'maintenance-item p-2 mb-1 border-l-4 cursor-pointer transition-all duration-200',
          'bg-gray-800 hover:bg-gray-700 rounded-r-md text-xs',
          {
            'border-red-500 bg-red-900': isOverdue,
            'border-blue-500': maintenance.maintenanceType === 'PREVENTIVE',
            'border-green-500': maintenance.maintenanceType === 'INSPECTION',
            'border-yellow-500': maintenance.maintenanceType === 'CLEANING',
            'border-purple-500': maintenance.maintenanceType === 'CALIBRATION',
            'border-red-500': maintenance.maintenanceType === 'PARTS_REPLACEMENT',
          }
        )}
        onClick={(e) => handleMaintenanceClick(maintenance, e)}
        onContextMenu={(e) => handleMaintenanceContextMenu(maintenance, e)}
        data-pr-tooltip={`${maintenance.equipmentName} - ${maintenance.maintenanceType}`}
      >
        <div className="flex justify-content-between align-items-start mb-1">
          <div className="text-white font-medium truncate">
            {maintenance.equipmentName}
          </div>
          <Badge
            value={maintenance.priority}
            severity={
              maintenance.priority === 'CRITICAL' ? 'danger' :
              maintenance.priority === 'HIGH' ? 'warning' :
              maintenance.priority === 'MEDIUM' ? 'info' : 'success'
            }
            size="small"
          />
        </div>
        
        <div className="text-gray-300 mb-1">
          {maintenance.maintenanceType}
        </div>
        
        <div className="flex justify-content-between align-items-center">
          <div className="text-gray-400">
            {maintenance.scheduledDate.toLocaleTimeString('pl-PL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          
          <Tag
            value={maintenance.customerName}
            className="text-xs bg-gray-600"
          />
        </div>
        
        {isOverdue && (
          <div className="mt-1">
            <Tag value="PRZETERMINOWANE" severity="danger" className="text-xs" />
          </div>
        )}

        {maintenance.complianceRequirements.length > 0 && (
          <div className="mt-1">
            <Tag value="ZGODNOŚĆ" severity="info" className="text-xs" />
          </div>
        )}
      </div>
    );
  }, [handleMaintenanceClick, handleMaintenanceContextMenu]);

  // Render calendar day
  const renderCalendarDay = useCallback((dayData: any) => {
    const { date, maintenance, isToday, isSelected } = dayData;
    const dayNumber = date.getDate();
    const hasOverdue = maintenance.some((m: MaintenanceSchedule) => 
      m.status === 'OVERDUE' || 
      (m.status === 'SCHEDULED' && new Date(m.scheduledDate) < new Date())
    );

    return (
      <div
        key={date.toISOString()}
        className={classNames(
          'calendar-day p-2 border border-gray-700 min-h-24 cursor-pointer transition-colors',
          'hover:bg-gray-700',
          {
            'bg-gray-800': !isSelected,
            'bg-blue-900': isSelected,
            'border-blue-500': isToday,
            'border-red-500': hasOverdue,
          }
        )}
        onClick={() => handleDayClick(date)}
      >
        <div className="flex justify-content-between align-items-center mb-2">
          <div className={classNames(
            'text-sm font-medium',
            {
              'text-white': !isToday,
              'text-blue-400': isToday,
            }
          )}>
            {dayNumber}
          </div>
          
          {maintenance.length > 0 && (
            <Badge
              value={maintenance.length}
              severity={hasOverdue ? 'danger' : 'info'}
              size="small"
            />
          )}
        </div>
        
        <div className="space-y-1">
          {maintenance.slice(0, 2).map(renderMaintenanceItem)}
          {maintenance.length > 2 && (
            <div className="text-xs text-gray-400 text-center">
              +{maintenance.length - 2} więcej
            </div>
          )}
        </div>
      </div>
    );
  }, [handleDayClick, renderMaintenanceItem]);

  // Get maintenance type label
  const getMaintenanceTypeLabel = useCallback((type: string) => {
    const labels = {
      PREVENTIVE: 'Prewencyjna',
      INSPECTION: 'Inspekcja',
      CLEANING: 'Czyszczenie',
      CALIBRATION: 'Kalibracja',
      PARTS_REPLACEMENT: 'Wymiana części',
    };
    return labels[type as keyof typeof labels] || type;
  }, []);

  // Get frequency label
  const getFrequencyLabel = useCallback((frequency: string) => {
    const labels = {
      MONTHLY: 'Miesięcznie',
      QUARTERLY: 'Kwartalnie',
      SEMI_ANNUAL: 'Półrocznie',
      ANNUAL: 'Rocznie',
      SEASONAL: 'Sezonowo',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-full">
        <ProgressSpinner />
      </div>
    );
  }

  const daysWithMaintenance = getDaysWithMaintenance();

  return (
    <div className="hvac-maintenance-calendar h-full">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Tooltip target=".maintenance-item" />
      
      {/* Calendar Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {selectedDate.toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: 'long',
            })}
          </h3>
          <p className="text-sm text-gray-400">
            {maintenanceSchedules.length} konserwacji zaplanowanych
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            icon="pi pi-chevron-left"
            className="p-button-text p-button-sm"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              onDateSelect(newDate);
            }}
          />
          <Button
            label="Dziś"
            className="p-button-text p-button-sm"
            onClick={() => onDateSelect(new Date())}
          />
          <Button
            icon="pi pi-chevron-right"
            className="p-button-text p-button-sm"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              onDateSelect(newDate);
            }}
          />
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-1 mb-4">
        {['month', 'week', 'day'].map((mode) => (
          <Button
            key={mode}
            label={mode === 'month' ? 'Miesiąc' : mode === 'week' ? 'Tydzień' : 'Dzień'}
            className={classNames(
              'p-button-sm',
              viewMode === mode ? 'p-button-primary' : 'p-button-outlined'
            )}
            onClick={() => setViewMode(mode as any)}
          />
        ))}
      </div>

      {/* Calendar Grid */}
      <Card className="h-full bg-gray-800 border-gray-700">
        {viewMode === 'month' && (
          <div className="calendar-grid">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map((day) => (
                <div key={day} className="text-center text-gray-400 font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {daysWithMaintenance.map(renderCalendarDay)}
            </div>
          </div>
        )}
        
        {viewMode === 'week' && (
          <div className="week-view">
            <div className="text-center text-gray-400 py-8">
              Widok tygodniowy - w trakcie implementacji
            </div>
          </div>
        )}
        
        {viewMode === 'day' && (
          <div className="day-view">
            <div className="text-center text-gray-400 py-8">
              Widok dzienny - w trakcie implementacji
            </div>
          </div>
        )}
      </Card>

      {/* Maintenance Details Overlay */}
      <OverlayPanel ref={maintenanceDetailsRef} className="w-25rem">
        {selectedMaintenance && (
          <div className="maintenance-details">
            <h4 className="text-lg font-semibold mb-3">
              {selectedMaintenance.equipmentName}
            </h4>
            
            <div className="space-y-3">
              <div>
                <strong>Typ konserwacji:</strong> {getMaintenanceTypeLabel(selectedMaintenance.maintenanceType)}
              </div>
              <div>
                <strong>Priorytet:</strong> {selectedMaintenance.priority}
              </div>
              <div>
                <strong>Status:</strong> {selectedMaintenance.status}
              </div>
              <div>
                <strong>Klient:</strong> {selectedMaintenance.customerName}
              </div>
              <div>
                <strong>Data:</strong> {selectedMaintenance.scheduledDate.toLocaleString('pl-PL')}
              </div>
              <div>
                <strong>Czas trwania:</strong> {selectedMaintenance.estimatedDuration} min
              </div>
              <div>
                <strong>Częstotliwość:</strong> {getFrequencyLabel(selectedMaintenance.frequency)}
              </div>
              
              {selectedMaintenance.lastPerformed && (
                <div>
                  <strong>Ostatnio wykonane:</strong> {selectedMaintenance.lastPerformed.toLocaleDateString('pl-PL')}
                </div>
              )}
              
              {selectedMaintenance.complianceRequirements.length > 0 && (
                <div>
                  <strong>Wymagania zgodności:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMaintenance.complianceRequirements.map((req, index) => (
                      <Chip key={index} label={req} className="text-xs" />
                    ))}
                  </div>
                </div>
              )}
              
              {selectedMaintenance.notes && (
                <div>
                  <strong>Uwagi:</strong> {selectedMaintenance.notes}
                </div>
              )}
              
              {selectedMaintenance.cost && (
                <div>
                  <strong>Koszt:</strong> {selectedMaintenance.cost.toLocaleString('pl-PL')} PLN
                </div>
              )}
            </div>

            <Divider />

            <div className="flex gap-2">
              <Button
                label="Wykonaj"
                icon="pi pi-play"
                className="p-button-success flex-1"
                onClick={() => {
                  // Start maintenance
                  maintenanceDetailsRef.current?.hide();
                }}
              />
              <Button
                icon="pi pi-pencil"
                className="p-button-outlined"
                tooltip="Edytuj"
              />
              <Button
                icon="pi pi-calendar"
                className="p-button-outlined"
                tooltip="Przełóż"
              />
            </div>
          </div>
        )}
      </OverlayPanel>

      {/* Context Menu */}
      <Menu ref={maintenanceMenuRef} popup />
    </div>
  );
};
