/**
 * HVAC Scheduling Hook
 * "Pasja rodzi profesjonalizm" - Professional HVAC Scheduling Management
 * 
 * Provides comprehensive scheduling functionality:
 * - Job scheduling and rescheduling
 * - Route optimization
 * - Conflict detection
 * - Performance analytics
 * - Real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useDebounce } from '@/hooks/useDebounce';

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

interface SchedulingRequest {
  customerId: string;
  serviceType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  preferredDate?: Date;
  preferredTechnicianId?: string;
  estimatedDuration: number;
  requiredSkills: string[];
  customerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface SchedulingResult {
  success: boolean;
  jobId?: string;
  assignedTechnician?: string;
  scheduledTime?: Date;
  estimatedArrival?: Date;
  alternativeOptions?: AlternativeSchedule[];
  reason?: string;
  confidence: number;
}

interface AlternativeSchedule {
  technicianId: string;
  technicianName: string;
  scheduledTime: Date;
  estimatedArrival: Date;
  confidence: number;
  reason: string;
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

interface RouteOptimization {
  technicianId: string;
  optimizedJobs: ScheduledJob[];
  totalTravelTime: number;
  totalWorkTime: number;
  efficiency: number;
  fuelSavings: number;
}

export const useHvacScheduling = () => {
  // State
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Apollo client for GraphQL operations
  const apolloClient = useApolloClient();

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/scheduling';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Scheduling WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Scheduling WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Scheduling WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'JOB_SCHEDULED':
        setScheduledJobs(prev => [...prev, data.job]);
        break;
      case 'JOB_UPDATED':
        setScheduledJobs(prev => 
          prev.map(job => job.id === data.job.id ? { ...job, ...data.job } : job)
        );
        break;
      case 'JOB_CANCELLED':
        setScheduledJobs(prev => prev.filter(job => job.id !== data.jobId));
        break;
      case 'JOB_RESCHEDULED':
        setScheduledJobs(prev => 
          prev.map(job => 
            job.id === data.jobId 
              ? { ...job, startTime: new Date(data.newStartTime), endTime: new Date(data.newEndTime) }
              : job
          )
        );
        break;
      default:
        console.log('Unknown real-time update type:', data.type);
    }
    setLastUpdate(new Date());
  }, []);

  // Load scheduled jobs
  const loadScheduledJobs = useCallback(async (filters?: {
    dateRange?: [Date, Date];
    technicianId?: string;
    status?: string;
    priority?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // This would be replaced with actual GraphQL query
      const mockJobs: ScheduledJob[] = [
        {
          id: '1',
          ticketId: 'HVAC-001',
          title: 'Konserwacja klimatyzacji',
          description: 'Rutynowa konserwacja systemu klimatyzacji',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          technicianId: 'tech-1',
          technicianName: 'Jan Kowalski',
          customerId: 'customer-1',
          customerName: 'Firma ABC Sp. z o.o.',
          customerAddress: 'ul. Przykładowa 123, Warszawa',
          priority: 'MEDIUM',
          status: 'SCHEDULED',
          serviceType: 'MAINTENANCE',
          estimatedDuration: 120,
          location: {
            latitude: 52.2297,
            longitude: 21.0122,
          },
          skills: ['MAINTENANCE', 'AIR_CONDITIONING'],
          notes: 'Klient preferuje godziny popołudniowe',
        },
        // Add more mock jobs as needed
      ];

      setScheduledJobs(mockJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedule a new job
  const scheduleJob = useCallback(async (request: SchedulingRequest): Promise<SchedulingResult> => {
    try {
      setLoading(true);
      setError(null);

      // This would call the actual scheduling service
      const response = await fetch('/api/hvac/scheduling/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule job');
      }

      const result: SchedulingResult = await response.json();

      if (result.success) {
        // Reload jobs to get the updated list
        await loadScheduledJobs();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to schedule job';
      setError(error);
      return {
        success: false,
        reason: error,
        confidence: 0,
      };
    } finally {
      setLoading(false);
    }
  }, [loadScheduledJobs]);

  // Reschedule an existing job
  const rescheduleJob = useCallback(async (jobId: string, newDateTime: Date): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/scheduling/reschedule/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newDateTime }),
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule job');
      }

      // Update local state optimistically
      setScheduledJobs(prev => 
        prev.map(job => {
          if (job.id === jobId) {
            const duration = job.endTime.getTime() - job.startTime.getTime();
            return {
              ...job,
              startTime: newDateTime,
              endTime: new Date(newDateTime.getTime() + duration),
            };
          }
          return job;
        })
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule job');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel a job
  const cancelJob = useCallback(async (jobId: string, reason: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/scheduling/cancel/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }

      // Update local state
      setScheduledJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'CANCELLED' as const }
            : job
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get scheduling statistics
  const getSchedulingStats = useCallback(async (date: Date): Promise<SchedulingStats> => {
    try {
      const response = await fetch(`/api/hvac/scheduling/stats?date=${date.toISOString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to get scheduling stats');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get scheduling stats:', err);
      // Return mock stats
      return {
        totalJobs: scheduledJobs.length,
        scheduledJobs: scheduledJobs.filter(job => job.status === 'SCHEDULED').length,
        inProgressJobs: scheduledJobs.filter(job => job.status === 'IN_PROGRESS').length,
        completedJobs: scheduledJobs.filter(job => job.status === 'COMPLETED').length,
        overdueJobs: scheduledJobs.filter(job => 
          job.status === 'SCHEDULED' && new Date(job.startTime) < new Date()
        ).length,
        technicianUtilization: 75,
        averageResponseTime: 45,
        customerSatisfaction: 4.2,
      };
    }
  }, [scheduledJobs]);

  // Optimize routes for a specific date
  const optimizeRoutes = useCallback(async (date: Date): Promise<RouteOptimization[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hvac/scheduling/optimize-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize routes');
      }

      const optimizations: RouteOptimization[] = await response.json();
      
      // Apply optimizations to scheduled jobs
      for (const optimization of optimizations) {
        setScheduledJobs(prev => 
          prev.map(job => {
            const optimizedJob = optimization.optimizedJobs.find(oj => oj.id === job.id);
            return optimizedJob ? { ...job, ...optimizedJob } : job;
          })
        );
      }

      return optimizations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize routes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for scheduling conflicts
  const checkConflicts = useCallback((jobId: string, newStartTime: Date, duration: number): string[] => {
    const job = scheduledJobs.find(j => j.id === jobId);
    if (!job) return [];

    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);
    const conflicts: string[] = [];

    scheduledJobs.forEach(otherJob => {
      if (otherJob.id === jobId || otherJob.technicianId !== job.technicianId) {
        return;
      }

      const otherStart = new Date(otherJob.startTime);
      const otherEnd = new Date(otherJob.endTime);

      if (newStartTime < otherEnd && newEndTime > otherStart) {
        conflicts.push(otherJob.id);
      }
    });

    return conflicts;
  }, [scheduledJobs]);

  // Get available time slots for a technician
  const getAvailableTimeSlots = useCallback((
    technicianId: string, 
    date: Date, 
    duration: number
  ): Date[] => {
    const slots: Date[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const slotInterval = 30; // 30 minutes

    const technicianJobs = scheduledJobs.filter(job => 
      job.technicianId === technicianId &&
      job.status !== 'CANCELLED' &&
      new Date(job.startTime).toDateString() === date.toDateString()
    );

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Check if this slot conflicts with existing jobs
        const hasConflict = technicianJobs.some(job => {
          const jobStart = new Date(job.startTime);
          const jobEnd = new Date(job.endTime);
          return slotStart < jobEnd && slotEnd > jobStart;
        });

        if (!hasConflict && slotEnd.getHours() <= endHour) {
          slots.push(slotStart);
        }
      }
    }

    return slots;
  }, [scheduledJobs]);

  // Auto-refresh jobs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadScheduledJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadScheduledJobs]);

  // Initial load
  useEffect(() => {
    loadScheduledJobs();
  }, [loadScheduledJobs]);

  return {
    // State
    scheduledJobs,
    loading,
    error,
    lastUpdate,

    // Actions
    loadScheduledJobs,
    scheduleJob,
    rescheduleJob,
    cancelJob,
    getSchedulingStats,
    optimizeRoutes,
    checkConflicts,
    getAvailableTimeSlots,

    // Utilities
    refreshJobs: loadScheduledJobs,
    clearError: () => setError(null),
  };
};
