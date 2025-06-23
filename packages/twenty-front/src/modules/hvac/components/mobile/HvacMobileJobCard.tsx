/**
 * HVAC Mobile Job Card Component
 * "Pasja rodzi profesjonalizm" - Professional Mobile Job Display
 * 
 * Features:
 * - Touch-friendly job cards
 * - Quick status updates
 * - Navigation integration
 * - Priority indicators
 * - Time and distance display
 * - Offline support
 */

import React, { useState, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Menu } from 'primereact/menu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { classNames } from 'primereact/utils';

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
}

interface JobCardProps {
  job: TechnicianJob;
  onSelect: (job: TechnicianJob) => void;
  onStatusUpdate: (jobId: string, status: TechnicianJob['status'], notes?: string) => void;
  onNavigate: (job: TechnicianJob) => void;
  isCurrentJob?: boolean;
  isCompleted?: boolean;
}

export const HvacMobileJobCard: React.FC<JobCardProps> = ({
  job,
  onSelect,
  onStatusUpdate,
  onNavigate,
  isCurrentJob = false,
  isCompleted = false,
}) => {
  // State
  const [showActions, setShowActions] = useState(false);

  // Get priority color
  const getPriorityColor = useCallback((priority: string) => {
    const colors = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'success',
    };
    return colors[priority as keyof typeof colors] || 'info';
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      ASSIGNED: 'info',
      EN_ROUTE: 'warning',
      ARRIVED: 'warning',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
    };
    return colors[status as keyof typeof colors] || 'info';
  }, []);

  // Get status label
  const getStatusLabel = useCallback((status: string) => {
    const labels = {
      ASSIGNED: 'Przydzielone',
      EN_ROUTE: 'W drodze',
      ARRIVED: 'Na miejscu',
      IN_PROGRESS: 'W trakcie',
      COMPLETED: 'Ukończone',
    };
    return labels[status as keyof typeof labels] || status;
  }, []);

  // Format time
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Format duration
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Handle quick actions
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'start':
        onStatusUpdate(job.id, 'IN_PROGRESS', 'Rozpoczęto pracę');
        break;
      case 'arrive':
        onStatusUpdate(job.id, 'ARRIVED', 'Technik dotarł na miejsce');
        break;
      case 'enroute':
        onStatusUpdate(job.id, 'EN_ROUTE', 'Technik w drodze');
        break;
      case 'complete':
        confirmDialog({
          message: 'Czy na pewno chcesz oznaczyć to zlecenie jako ukończone?',
          header: 'Potwierdzenie',
          icon: 'pi pi-question-circle',
          accept: () => onSelect(job), // Open work order for completion
        });
        break;
      case 'navigate':
        onNavigate(job);
        break;
      case 'call':
        window.open(`tel:${job.customerPhone}`);
        break;
      default:
        break;
    }
    setShowActions(false);
  }, [job, onStatusUpdate, onSelect, onNavigate]);

  // Get available actions based on status
  const getAvailableActions = useCallback(() => {
    const actions = [];

    if (!isCompleted) {
      // Navigation is always available
      actions.push({
        label: 'Nawigacja',
        icon: 'pi pi-map-marker',
        command: () => handleQuickAction('navigate'),
      });

      // Call customer
      actions.push({
        label: 'Zadzwoń',
        icon: 'pi pi-phone',
        command: () => handleQuickAction('call'),
      });

      // Status-specific actions
      switch (job.status) {
        case 'ASSIGNED':
          actions.push({
            label: 'W drodze',
            icon: 'pi pi-car',
            command: () => handleQuickAction('enroute'),
          });
          break;
        case 'EN_ROUTE':
          actions.push({
            label: 'Dotarłem',
            icon: 'pi pi-map-marker',
            command: () => handleQuickAction('arrive'),
          });
          break;
        case 'ARRIVED':
          actions.push({
            label: 'Rozpocznij',
            icon: 'pi pi-play',
            command: () => handleQuickAction('start'),
          });
          break;
        case 'IN_PROGRESS':
          actions.push({
            label: 'Ukończ',
            icon: 'pi pi-check',
            command: () => handleQuickAction('complete'),
          });
          break;
      }
    }

    return actions;
  }, [job.status, isCompleted, handleQuickAction]);

  // Check if job is overdue
  const isOverdue = new Date(job.scheduledTime) < new Date() && job.status !== 'COMPLETED';

  return (
    <Card
      className={classNames(
        'job-card cursor-pointer transition-all duration-200 border-l-4',
        {
          'bg-gray-800 border-gray-700': !isCurrentJob && !isCompleted,
          'bg-blue-900 border-blue-500': isCurrentJob,
          'bg-green-900 border-green-500': isCompleted,
          'bg-red-900 border-red-500': isOverdue,
          'hover:bg-gray-700': !isCurrentJob && !isCompleted,
        }
      )}
      onClick={() => onSelect(job)}
    >
      <ConfirmDialog />
      
      <div className="flex justify-content-between align-items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex align-items-center gap-2 mb-2">
            <h4 className="text-white font-semibold text-base truncate">
              {job.customerName}
            </h4>
            <Badge
              value={job.priority}
              severity={getPriorityColor(job.priority) as any}
              size="small"
            />
          </div>
          
          <div className="text-sm text-gray-300 mb-1">
            {job.serviceType}
          </div>
          
          <div className="text-xs text-gray-400 truncate">
            {job.customerAddress}
          </div>
        </div>

        <div className="text-right ml-3">
          <Tag
            value={getStatusLabel(job.status)}
            severity={getStatusColor(job.status) as any}
            className="mb-2"
          />
          
          {isOverdue && (
            <div>
              <Tag value="PRZETERMINOWANE" severity="danger" className="text-xs" />
            </div>
          )}
        </div>
      </div>

      {/* Time and Duration */}
      <div className="flex justify-content-between align-items-center mb-3">
        <div className="flex align-items-center gap-4">
          <div className="text-sm">
            <i className="pi pi-clock text-gray-400 mr-1" />
            <span className="text-white">{formatTime(job.scheduledTime)}</span>
          </div>
          
          <div className="text-sm">
            <i className="pi pi-stopwatch text-gray-400 mr-1" />
            <span className="text-white">{formatDuration(job.estimatedDuration)}</span>
          </div>
        </div>

        {/* Distance and ETA */}
        {(job.distance || job.eta) && (
          <div className="flex align-items-center gap-3">
            {job.distance && (
              <div className="text-sm">
                <i className="pi pi-map text-gray-400 mr-1" />
                <span className="text-white">{job.distance.toFixed(1)} km</span>
              </div>
            )}
            
            {job.eta && (
              <div className="text-sm">
                <i className="pi pi-car text-gray-400 mr-1" />
                <span className="text-white">{job.eta} min</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Equipment Info */}
      {job.equipmentInfo && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Urządzenie:</div>
          <div className="flex flex-wrap gap-1">
            <Chip
              label={job.equipmentInfo.type}
              className="text-xs bg-gray-700 text-gray-200"
            />
            <Chip
              label={job.equipmentInfo.model}
              className="text-xs bg-gray-700 text-gray-200"
            />
          </div>
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Opis:</div>
          <div className="text-sm text-gray-300 line-height-3">
            {job.description.length > 100 
              ? `${job.description.substring(0, 100)}...`
              : job.description
            }
          </div>
        </div>
      )}

      {/* Photos indicator */}
      {job.photos && job.photos.length > 0 && (
        <div className="mb-3">
          <Chip
            label={`${job.photos.length} zdjęć`}
            icon="pi pi-camera"
            className="text-xs bg-blue-100 text-blue-800"
          />
        </div>
      )}

      {/* Quick Actions */}
      {!isCompleted && (
        <div className="flex gap-2 pt-2 border-t border-gray-700">
          {/* Primary action button */}
          {job.status === 'ASSIGNED' && (
            <Button
              label="W drodze"
              icon="pi pi-car"
              className="p-button-sm p-button-info flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction('enroute');
              }}
            />
          )}
          
          {job.status === 'EN_ROUTE' && (
            <Button
              label="Dotarłem"
              icon="pi pi-map-marker"
              className="p-button-sm p-button-warning flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction('arrive');
              }}
            />
          )}
          
          {job.status === 'ARRIVED' && (
            <Button
              label="Rozpocznij"
              icon="pi pi-play"
              className="p-button-sm p-button-success flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction('start');
              }}
            />
          )}
          
          {job.status === 'IN_PROGRESS' && (
            <Button
              label="Ukończ"
              icon="pi pi-check"
              className="p-button-sm p-button-success flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction('complete');
              }}
            />
          )}

          {/* Navigation button */}
          <Button
            icon="pi pi-map-marker"
            className="p-button-sm p-button-outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickAction('navigate');
            }}
            tooltip="Nawigacja"
          />

          {/* Call button */}
          <Button
            icon="pi pi-phone"
            className="p-button-sm p-button-outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickAction('call');
            }}
            tooltip="Zadzwoń do klienta"
          />

          {/* More actions */}
          <Button
            icon="pi pi-ellipsis-v"
            className="p-button-sm p-button-text"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            tooltip="Więcej opcji"
          />
        </div>
      )}

      {/* Completed job info */}
      {isCompleted && (
        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div className="text-sm text-green-400">
              <i className="pi pi-check-circle mr-1" />
              Ukończone
            </div>
            
            <Button
              label="Szczegóły"
              icon="pi pi-eye"
              className="p-button-sm p-button-text"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(job);
              }}
            />
          </div>
        </div>
      )}

      {/* Actions Menu */}
      <Menu
        model={getAvailableActions()}
        popup
        ref={(el) => {
          if (el && showActions) {
            el.show({ currentTarget: el });
          }
        }}
        onHide={() => setShowActions(false)}
      />
    </Card>
  );
};
