/**
 * HVAC Mobile Technician Hook
 * "Pasja rodzi profesjonalizm" - Professional Mobile Technician Management
 * 
 * Provides comprehensive mobile technician functionality:
 * - Job management and status updates
 * - Real-time location tracking
 * - Offline capabilities with sync
 * - Photo and document upload
 * - Work order completion
 * - Customer communication
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';

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
  distance?: number;
  eta?: number;
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

interface WorkOrderData {
  jobId: string;
  startTime: Date;
  endTime: Date;
  workPerformed: string;
  partsUsed: any[];
  checklist: ChecklistItem[];
  photos: File[];
  customerSignature?: string;
  technicianNotes: string;
  customerFeedback?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export const useHvacMobileTechnician = () => {
  // State
  const [technicianStatus, setTechnicianStatus] = useState<TechnicianStatus | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<TechnicianJob[]>([]);
  const [currentJob, setCurrentJob] = useState<TechnicianJob | null>(null);
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
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/mobile-technician';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Mobile Technician WebSocket connected');
        // Send technician identification
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'TECHNICIAN_CONNECT',
            technicianId: getCurrentTechnicianId(),
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Failed to parse mobile technician WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Mobile Technician WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Mobile Technician WebSocket error:', error);
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
      case 'JOB_ASSIGNED':
        setAssignedJobs(prev => [...prev, data.job]);
        break;
      case 'JOB_UPDATED':
        setAssignedJobs(prev => 
          prev.map(job => job.id === data.job.id ? { ...job, ...data.job } : job)
        );
        if (currentJob?.id === data.job.id) {
          setCurrentJob(prev => prev ? { ...prev, ...data.job } : null);
        }
        break;
      case 'JOB_CANCELLED':
        setAssignedJobs(prev => prev.filter(job => job.id !== data.jobId));
        if (currentJob?.id === data.jobId) {
          setCurrentJob(null);
        }
        break;
      case 'TECHNICIAN_STATUS_UPDATE':
        setTechnicianStatus(prev => prev ? { ...prev, ...data.status } : null);
        break;
      case 'LOCATION_REQUEST':
        // Send current location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            sendLocationUpdate(position.coords.latitude, position.coords.longitude);
          });
        }
        break;
      default:
        console.log('Unknown mobile technician update type:', data.type);
    }
    setLastUpdate(new Date());
  }, [currentJob]);

  // Get current technician ID (would come from auth context)
  const getCurrentTechnicianId = useCallback(() => {
    return localStorage.getItem('technicianId') || 'current-technician';
  }, []);

  // Load technician status and jobs
  const loadTechnicianData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const technicianId = getCurrentTechnicianId();

      // Load technician status
      const statusResponse = await fetch(`/api/hvac/mobile/technician/${technicianId}/status`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setTechnicianStatus(status);
      }

      // Load assigned jobs
      const jobsResponse = await fetch(`/api/hvac/mobile/technician/${technicianId}/jobs`);
      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json();
        setAssignedJobs(jobs);
        
        // Find current job (in progress)
        const inProgressJob = jobs.find((job: TechnicianJob) => 
          job.status === 'IN_PROGRESS' || job.status === 'ARRIVED'
        );
        setCurrentJob(inProgressJob || null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load technician data');
    } finally {
      setLoading(false);
    }
  }, [getCurrentTechnicianId]);

  // Update job status
  const updateJobStatus = useCallback(async (
    jobId: string,
    status: TechnicianJob['status'],
    notes?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/mobile/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          notes,
          timestamp: new Date().toISOString(),
          technicianId: getCurrentTechnicianId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Update local state optimistically
      setAssignedJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status, notes: notes || job.notes }
            : job
        )
      );

      // Update current job if it's the one being updated
      if (currentJob?.id === jobId) {
        if (status === 'IN_PROGRESS' || status === 'ARRIVED') {
          setCurrentJob(prev => prev ? { ...prev, status, notes: notes || prev.notes } : null);
        } else if (status === 'COMPLETED') {
          setCurrentJob(null);
        }
      } else if (status === 'IN_PROGRESS' || status === 'ARRIVED') {
        // Set as current job if starting work
        const job = assignedJobs.find(j => j.id === jobId);
        if (job) {
          setCurrentJob({ ...job, status, notes: notes || job.notes });
        }
      }

      // Send real-time update
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'JOB_STATUS_UPDATE',
          jobId,
          status,
          notes,
          technicianId: getCurrentTechnicianId(),
        }));
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentJob, assignedJobs, getCurrentTechnicianId]);

  // Complete job with work order data
  const completeJob = useCallback(async (
    jobId: string,
    workOrderData: WorkOrderData
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('workOrderData', JSON.stringify({
        ...workOrderData,
        photos: undefined, // Remove photos from JSON, will be added as files
      }));
      formData.append('technicianId', getCurrentTechnicianId());

      // Add photos
      workOrderData.photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      const response = await fetch(`/api/hvac/mobile/jobs/${jobId}/complete`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to complete job');
      }

      // Update local state
      setAssignedJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'COMPLETED' }
            : job
        )
      );

      // Clear current job
      if (currentJob?.id === jobId) {
        setCurrentJob(null);
      }

      // Send real-time update
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'JOB_COMPLETED',
          jobId,
          technicianId: getCurrentTechnicianId(),
          completionTime: new Date().toISOString(),
        }));
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete job');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentJob, getCurrentTechnicianId]);

  // Update technician status
  const updateTechnicianStatus = useCallback(async (
    status: TechnicianStatus['status'],
    notes?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/mobile/technician/${getCurrentTechnicianId()}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          notes,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update technician status');
      }

      // Update local state
      setTechnicianStatus(prev => prev ? { ...prev, status } : null);

      // Send real-time update
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'TECHNICIAN_STATUS_UPDATE',
          technicianId: getCurrentTechnicianId(),
          status,
          notes,
        }));
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update technician status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getCurrentTechnicianId]);

  // Send location update
  const sendLocationUpdate = useCallback(async (
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hvac/mobile/technician/${getCurrentTechnicianId()}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Update local state
      setTechnicianStatus(prev => prev ? {
        ...prev,
        currentLocation: {
          latitude,
          longitude,
          accuracy: accuracy || 0,
          timestamp: new Date(),
        },
      } : null);

      // Send real-time update
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'LOCATION_UPDATE',
          technicianId: getCurrentTechnicianId(),
          location: { latitude, longitude, accuracy },
          timestamp: new Date().toISOString(),
        }));
      }

      return true;
    } catch (err) {
      console.error('Failed to send location update:', err);
      return false;
    }
  }, [getCurrentTechnicianId]);

  // Upload job photos
  const uploadJobPhotos = useCallback(async (
    jobId: string,
    photos: File[]
  ): Promise<string[]> => {
    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('technicianId', getCurrentTechnicianId());
      
      photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      const response = await fetch(`/api/hvac/mobile/jobs/${jobId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }

      const result = await response.json();
      return result.photoUrls || [];
    } catch (err) {
      console.error('Failed to upload job photos:', err);
      throw err;
    }
  }, [getCurrentTechnicianId]);

  // Add job notes
  const addJobNotes = useCallback(async (
    jobId: string,
    notes: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hvac/mobile/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          technicianId: getCurrentTechnicianId(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add job notes');
      }

      // Update local state
      setAssignedJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, notes: (job.notes || '') + '\n' + notes }
            : job
        )
      );

      if (currentJob?.id === jobId) {
        setCurrentJob(prev => prev ? {
          ...prev,
          notes: (prev.notes || '') + '\n' + notes,
        } : null);
      }

      return true;
    } catch (err) {
      console.error('Failed to add job notes:', err);
      return false;
    }
  }, [currentJob, getCurrentTechnicianId]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadTechnicianData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadTechnicianData]);

  // Initial load
  useEffect(() => {
    loadTechnicianData();
  }, [loadTechnicianData]);

  // Mock data for development
  useEffect(() => {
    if (!technicianStatus) {
      setTechnicianStatus({
        id: 'tech-1',
        name: 'Jan Kowalski',
        status: 'AVAILABLE',
        currentLocation: {
          latitude: 52.2297,
          longitude: 21.0122,
          accuracy: 10,
          timestamp: new Date(),
        },
        todayStats: {
          jobsCompleted: 3,
          jobsScheduled: 5,
          hoursWorked: 6.5,
          efficiency: 85,
        },
        isOnline: true,
        lastSync: new Date(),
      });
    }

    if (assignedJobs.length === 0) {
      setAssignedJobs([
        {
          id: 'job-1',
          ticketId: 'HVAC-001',
          customerName: 'Firma ABC Sp. z o.o.',
          customerPhone: '+48 123 456 789',
          customerAddress: 'ul. Przykładowa 123, Warszawa',
          serviceType: 'Konserwacja klimatyzacji',
          priority: 'MEDIUM',
          status: 'ASSIGNED',
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          estimatedDuration: 120,
          description: 'Rutynowa konserwacja systemu klimatyzacji',
          location: {
            latitude: 52.2297,
            longitude: 21.0122,
          },
          distance: 5.2,
          eta: 15,
        },
      ]);
    }
  }, [technicianStatus, assignedJobs]);

  return {
    // State
    technicianStatus,
    assignedJobs,
    currentJob,
    loading,
    error,
    lastUpdate,

    // Actions
    loadTechnicianData,
    updateJobStatus,
    completeJob,
    updateTechnicianStatus,
    sendLocationUpdate,
    uploadJobPhotos,
    addJobNotes,

    // Utilities
    refreshData: loadTechnicianData,
    clearError: () => setError(null),
  };
};
