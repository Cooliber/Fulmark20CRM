/**
 * HVAC Scheduling Calendar Component
 * "Pasja rodzi profesjonalizm" - Professional Drag-and-Drop Scheduling
 * 
 * Features:
 * - Drag-and-drop job scheduling
 * - Multi-view calendar (day/week/month)
 * - Real-time updates
 * - Conflict detection
 * - Time slot optimization
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
import { classNames } from 'primereact/utils';

// Types
interface ScheduledJob {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  technicianId: string;
  technicianName: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceType: string;
  estimatedDuration: number;
  location: {
    latitude: number;
    longitude: number;
  };
  skills: string[];
  notes?: string;
}

interface Technician {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  skills: string[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  workingHours: {
    start: string;
    end: string;
  };
  color: string; // For calendar display
}

interface CalendarProps {
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  jobs: ScheduledJob[];
  technicians: Technician[];
  onDateSelect: (date: Date) => void;
  onJobSchedule: (jobData: any) => void;
  onJobReschedule: (jobId: string, newDateTime: Date) => void;
  onJobCancel: (jobId: string, reason: string) => void;
  loading?: boolean;
}

export const HvacSchedulingCalendar: React.FC<CalendarProps> = ({
  selectedDate,
  viewMode,
  jobs,
  technicians,
  onDateSelect,
  onJobSchedule,
  onJobReschedule,
  onJobCancel,
  loading = false,
}) => {
  // Refs
  const toast = useRef<Toast>(null);
  const jobMenuRef = useRef<Menu>(null);
  const jobDetailsRef = useRef<OverlayPanel>(null);

  // State
  const [draggedJob, setDraggedJob] = useState<ScheduledJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Generate time slots for day/week view
  useEffect(() => {
    if (viewMode === 'day' || viewMode === 'week') {
      generateTimeSlots();
    }
  }, [viewMode, selectedDate]);

  // Convert jobs to calendar events
  useEffect(() => {
    const events = jobs.map(job => ({
      id: job.id,
      title: `${job.customerName} - ${job.serviceType}`,
      start: job.startTime,
      end: job.endTime,
      backgroundColor: getTechnicianColor(job.technicianId),
      borderColor: getPriorityColor(job.priority),
      textColor: '#ffffff',
      extendedProps: {
        job,
        technician: technicians.find(t => t.id === job.technicianId),
      },
    }));
    setCalendarEvents(events);
  }, [jobs, technicians]);

  // Detect scheduling conflicts
  useEffect(() => {
    detectConflicts();
  }, [jobs]);

  const generateTimeSlots = useCallback(() => {
    const slots = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = new Date(selectedDate);
        time.setHours(hour, minute, 0, 0);
        
        slots.push({
          time,
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          available: isTimeSlotAvailable(time),
        });
      }
    }
    
    setTimeSlots(slots);
  }, [selectedDate, jobs, technicians]);

  const isTimeSlotAvailable = useCallback((time: Date) => {
    // Check if any technician is available at this time
    return technicians.some(tech => {
      const workStart = parseTime(tech.workingHours.start);
      const workEnd = parseTime(tech.workingHours.end);
      const slotTime = time.getHours() * 60 + time.getMinutes();
      
      if (slotTime < workStart || slotTime >= workEnd) {
        return false;
      }

      // Check if technician has conflicting jobs
      const hasConflict = jobs.some(job => {
        if (job.technicianId !== tech.id) return false;
        
        const jobStart = new Date(job.startTime);
        const jobEnd = new Date(job.endTime);
        const slotEnd = new Date(time.getTime() + 30 * 60000); // 30 minutes later
        
        return time < jobEnd && slotEnd > jobStart;
      });

      return !hasConflict;
    });
  }, [jobs, technicians]);

  const detectConflicts = useCallback(() => {
    const conflictIds: string[] = [];
    
    for (let i = 0; i < jobs.length; i++) {
      for (let j = i + 1; j < jobs.length; j++) {
        const job1 = jobs[i];
        const job2 = jobs[j];
        
        // Check if same technician has overlapping jobs
        if (job1.technicianId === job2.technicianId) {
          const start1 = new Date(job1.startTime);
          const end1 = new Date(job1.endTime);
          const start2 = new Date(job2.startTime);
          const end2 = new Date(job2.endTime);
          
          if (start1 < end2 && start2 < end1) {
            conflictIds.push(job1.id, job2.id);
          }
        }
      }
    }
    
    setConflicts([...new Set(conflictIds)]);
  }, [jobs]);

  const getTechnicianColor = useCallback((technicianId: string) => {
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.color || '#6366f1';
  }, [technicians]);

  const getPriorityColor = useCallback((priority: string) => {
    const colors = {
      CRITICAL: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#eab308',
      LOW: '#22c55e',
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  }, []);

  const parseTime = useCallback((timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  // Event handlers
  const handleJobDragStart = useCallback((job: ScheduledJob) => {
    setDraggedJob(job);
  }, []);

  const handleJobDragEnd = useCallback(() => {
    setDraggedJob(null);
  }, []);

  const handleTimeSlotDrop = useCallback(async (time: Date) => {
    if (!draggedJob) return;

    const newStartTime = new Date(time);
    const duration = draggedJob.endTime.getTime() - draggedJob.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Check for conflicts
    const hasConflict = jobs.some(job => {
      if (job.id === draggedJob.id || job.technicianId !== draggedJob.technicianId) {
        return false;
      }
      
      const jobStart = new Date(job.startTime);
      const jobEnd = new Date(job.endTime);
      
      return newStartTime < jobEnd && newEndTime > jobStart;
    });

    if (hasConflict) {
      toast.current?.show({
        severity: 'error',
        summary: 'Konflikt harmonogramu',
        detail: 'Technik ma już zaplanowane zlecenie w tym czasie',
        life: 3000,
      });
      return;
    }

    try {
      await onJobReschedule(draggedJob.id, newStartTime);
      toast.current?.show({
        severity: 'success',
        summary: 'Zlecenie przełożone',
        detail: `Zlecenie zostało przełożone na ${newStartTime.toLocaleString('pl-PL')}`,
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się przełożyć zlecenia',
        life: 3000,
      });
    }
  }, [draggedJob, jobs, onJobReschedule]);

  const handleJobClick = useCallback((job: ScheduledJob, event: React.MouseEvent) => {
    setSelectedJob(job);
    jobDetailsRef.current?.toggle(event);
  }, []);

  const handleJobContextMenu = useCallback((job: ScheduledJob, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedJob(job);
    
    const menuItems = [
      {
        label: 'Szczegóły',
        icon: 'pi pi-info-circle',
        command: () => jobDetailsRef.current?.toggle(event),
      },
      {
        label: 'Edytuj',
        icon: 'pi pi-pencil',
        command: () => {
          // Open edit dialog
        },
      },
      {
        label: 'Anuluj',
        icon: 'pi pi-times',
        command: () => {
          confirmDialog({
            message: 'Czy na pewno chcesz anulować to zlecenie?',
            header: 'Potwierdzenie anulowania',
            icon: 'pi pi-exclamation-triangle',
            accept: () => onJobCancel(job.id, 'Anulowane przez użytkownika'),
          });
        },
      },
    ];

    jobMenuRef.current?.show(event);
  }, [onJobCancel]);

  // Render job card
  const renderJobCard = useCallback((job: ScheduledJob) => {
    const isConflict = conflicts.includes(job.id);
    const technician = technicians.find(t => t.id === job.technicianId);
    
    return (
      <div
        key={job.id}
        className={classNames(
          'job-card p-2 mb-2 border-l-4 cursor-pointer transition-all duration-200',
          'bg-gray-800 hover:bg-gray-700 rounded-r-md',
          {
            'border-red-500 bg-red-900': isConflict,
            'border-blue-500': job.priority === 'LOW',
            'border-yellow-500': job.priority === 'MEDIUM',
            'border-orange-500': job.priority === 'HIGH',
            'border-red-500': job.priority === 'CRITICAL',
          }
        )}
        draggable
        onDragStart={() => handleJobDragStart(job)}
        onDragEnd={handleJobDragEnd}
        onClick={(e) => handleJobClick(job, e)}
        onContextMenu={(e) => handleJobContextMenu(job, e)}
        data-pr-tooltip={`${job.customerName} - ${job.serviceType}`}
      >
        <div className="flex justify-content-between align-items-start mb-1">
          <div className="text-sm font-semibold text-white truncate">
            {job.customerName}
          </div>
          <Badge
            value={job.priority}
            severity={
              job.priority === 'CRITICAL' ? 'danger' :
              job.priority === 'HIGH' ? 'warning' :
              job.priority === 'MEDIUM' ? 'info' : 'success'
            }
            size="small"
          />
        </div>
        
        <div className="text-xs text-gray-300 mb-1">
          {job.serviceType}
        </div>
        
        <div className="flex justify-content-between align-items-center">
          <div className="text-xs text-gray-400">
            {job.startTime.toLocaleTimeString('pl-PL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - {job.endTime.toLocaleTimeString('pl-PL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          
          <Tag
            value={technician?.name || 'Nieprzydzielony'}
            style={{ backgroundColor: technician?.color || '#6b7280' }}
            className="text-xs"
          />
        </div>
        
        {isConflict && (
          <div className="mt-1">
            <Tag value="KONFLIKT" severity="danger" className="text-xs" />
          </div>
        )}
      </div>
    );
  }, [conflicts, technicians, handleJobDragStart, handleJobDragEnd, handleJobClick, handleJobContextMenu]);

  // Render time slot
  const renderTimeSlot = useCallback((slot: any) => {
    const jobsInSlot = jobs.filter(job => {
      const jobStart = new Date(job.startTime);
      const slotTime = slot.time;
      const slotEnd = new Date(slotTime.getTime() + 30 * 60000);
      
      return jobStart >= slotTime && jobStart < slotEnd;
    });

    return (
      <div
        key={slot.label}
        className={classNames(
          'time-slot p-2 border-b border-gray-700 min-h-16',
          'transition-colors duration-200',
          {
            'bg-gray-800': slot.available,
            'bg-gray-900': !slot.available,
            'hover:bg-gray-700': slot.available,
            'border-l-4 border-green-500': draggedJob && slot.available,
            'border-l-4 border-red-500': draggedJob && !slot.available,
          }
        )}
        onDragOver={(e) => {
          if (slot.available) {
            e.preventDefault();
          }
        }}
        onDrop={() => {
          if (slot.available) {
            handleTimeSlotDrop(slot.time);
          }
        }}
      >
        <div className="flex justify-content-between align-items-center mb-2">
          <div className="text-sm font-medium text-gray-300">
            {slot.label}
          </div>
          {!slot.available && (
            <Tag value="Niedostępny" severity="secondary" className="text-xs" />
          )}
        </div>
        
        <div className="space-y-1">
          {jobsInSlot.map(renderJobCard)}
        </div>
      </div>
    );
  }, [jobs, draggedJob, handleTimeSlotDrop, renderJobCard]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-full">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="hvac-scheduling-calendar h-full">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Tooltip target=".job-card" />
      
      {/* Calendar Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {selectedDate.toLocaleDateString('pl-PL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          <p className="text-sm text-gray-400">
            {jobs.length} zleceń zaplanowanych
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            icon="pi pi-chevron-left"
            className="p-button-text p-button-sm"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
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
              newDate.setDate(newDate.getDate() + 1);
              onDateSelect(newDate);
            }}
          />
        </div>
      </div>

      {/* Calendar Content */}
      <Card className="h-full bg-gray-800 border-gray-700">
        <div className="calendar-content h-full overflow-auto">
          {viewMode === 'day' && (
            <div className="day-view">
              {timeSlots.map(renderTimeSlot)}
            </div>
          )}
          
          {viewMode === 'week' && (
            <div className="week-view">
              {/* Week view implementation */}
              <div className="text-center text-gray-400 py-8">
                Widok tygodniowy - w trakcie implementacji
              </div>
            </div>
          )}
          
          {viewMode === 'month' && (
            <div className="month-view">
              {/* Month view implementation */}
              <div className="text-center text-gray-400 py-8">
                Widok miesięczny - w trakcie implementacji
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Job Details Overlay */}
      <OverlayPanel ref={jobDetailsRef} className="w-20rem">
        {selectedJob && (
          <div className="job-details">
            <h4 className="text-lg font-semibold mb-3">
              {selectedJob.customerName}
            </h4>
            
            <div className="space-y-2">
              <div>
                <strong>Typ serwisu:</strong> {selectedJob.serviceType}
              </div>
              <div>
                <strong>Priorytet:</strong> {selectedJob.priority}
              </div>
              <div>
                <strong>Status:</strong> {selectedJob.status}
              </div>
              <div>
                <strong>Technik:</strong> {selectedJob.technicianName}
              </div>
              <div>
                <strong>Czas:</strong> {selectedJob.startTime.toLocaleString('pl-PL')}
              </div>
              <div>
                <strong>Czas trwania:</strong> {selectedJob.estimatedDuration} min
              </div>
              <div>
                <strong>Adres:</strong> {selectedJob.customerAddress}
              </div>
              {selectedJob.notes && (
                <div>
                  <strong>Uwagi:</strong> {selectedJob.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </OverlayPanel>

      {/* Context Menu */}
      <Menu ref={jobMenuRef} popup />
    </div>
  );
};
