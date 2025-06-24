/**
 * HVAC Dispatch Hook
 * "Pasja rodzi profesjonalizm" - Professional HVAC Dispatch Management
 * 
 * Provides comprehensive dispatch functionality:
 * - Real-time dispatch management
 * - Emergency response coordination
 * - Technician tracking
 * - Customer notifications
 * - Status updates
 */

import { useApolloClient } from '@apollo/client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface DispatchRequest {
  ticketId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  serviceType: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  equipmentInfo?: {
    type: string;
    model: string;
    serialNumber?: string;
  };
  description: string;
  preferredTimeSlot?: Date;
  emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface DispatchResult {
  success: boolean;
  dispatchId: string;
  assignedTechnician?: TechnicianDispatchInfo;
  estimatedArrival?: Date;
  trackingUrl?: string;
  customerNotificationSent: boolean;
  reason?: string;
}

interface TechnicianDispatchInfo {
  technicianId: string;
  name: string;
  phone: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SITE' | 'UNAVAILABLE';
  estimatedArrival: Date;
  skills: string[];
}

interface ActiveDispatch {
  id: string;
  ticketId: string;
  technicianId: string;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dispatchTime: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  completionTime?: Date;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  technicianInfo: TechnicianDispatchInfo;
  serviceType: string;
  priority: string;
  notes?: string;
  trackingUrl: string;
}

interface DispatchUpdate {
  dispatchId: string;
  technicianId: string;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  notes?: string;
  estimatedCompletion?: Date;
}

interface EmergencyDispatch {
  ticketId: string;
  emergencyLevel: 'HIGH' | 'CRITICAL';
  responseTimeRequired: number; // minutes
  specialRequirements?: string[];
  escalationContacts: string[];
}

export const useHvacDispatch = () => {
  // State
  const [activeDispatches, setActiveDispatches] = useState<ActiveDispatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Apollo client for GraphQL operations
  const apolloClient = useApolloClient();

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for real-time dispatch updates
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/dispatch';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Dispatch WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeDispatchUpdate(data);
        } catch (error) {
          console.error('Failed to parse dispatch WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Dispatch WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Dispatch WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle real-time dispatch updates
  const handleRealtimeDispatchUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'DISPATCH_CREATED':
        setActiveDispatches(prev => [...prev, data.dispatch]);
        break;
      case 'DISPATCH_UPDATED':
        setActiveDispatches(prev => 
          prev.map(dispatch => 
            dispatch.id === data.dispatch.id 
              ? { ...dispatch, ...data.dispatch }
              : dispatch
          )
        );
        break;
      case 'DISPATCH_COMPLETED':
        setActiveDispatches(prev => 
          prev.map(dispatch => 
            dispatch.id === data.dispatchId 
              ? { ...dispatch, status: 'COMPLETED', completionTime: new Date(data.completionTime) }
              : dispatch
          )
        );
        break;
      case 'DISPATCH_CANCELLED':
        setActiveDispatches(prev => 
          prev.map(dispatch => 
            dispatch.id === data.dispatchId 
              ? { ...dispatch, status: 'CANCELLED' }
              : dispatch
          )
        );
        break;
      case 'TECHNICIAN_LOCATION_UPDATE':
        setActiveDispatches(prev => 
          prev.map(dispatch => 
            dispatch.technicianId === data.technicianId 
              ? {
                  ...dispatch,
                  technicianInfo: {
                    ...dispatch.technicianInfo,
                    currentLocation: {
                      ...data.location,
                      lastUpdated: new Date(data.timestamp),
                    },
                  },
                }
              : dispatch
          )
        );
        break;
      default:
        console.log('Unknown dispatch update type:', data.type);
    }
    setLastUpdate(new Date());
  }, []);

  // Load active dispatches
  const loadActiveDispatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // This would be replaced with actual API call
      const response = await fetch('/api/hvac/dispatch/active');
      
      if (!response.ok) {
        throw new Error('Failed to load active dispatches');
      }

      const dispatches: ActiveDispatch[] = await response.json();
      setActiveDispatches(dispatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active dispatches');
    } finally {
      setLoading(false);
    }
  }, []);

  // Dispatch a new service request
  const dispatchJob = useCallback(async (request: DispatchRequest): Promise<DispatchResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hvac/dispatch/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to dispatch job');
      }

      const result: DispatchResult = await response.json();

      if (result.success) {
        // Reload active dispatches
        await loadActiveDispatches();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to dispatch job';
      setError(error);
      return {
        success: false,
        dispatchId: '',
        customerNotificationSent: false,
        reason: error,
      };
    } finally {
      setLoading(false);
    }
  }, [loadActiveDispatches]);

  // Update dispatch status
  const updateDispatchStatus = useCallback(async (update: DispatchUpdate): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/dispatch/update/${update.dispatchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      });

      if (!response.ok) {
        throw new Error('Failed to update dispatch status');
      }

      // Update local state optimistically
      setActiveDispatches(prev => 
        prev.map(dispatch => 
          dispatch.id === update.dispatchId 
            ? { 
                ...dispatch, 
                status: update.status,
                ...(update.location && {
                  technicianInfo: {
                    ...dispatch.technicianInfo,
                    currentLocation: {
                      latitude: update.location.latitude,
                      longitude: update.location.longitude,
                      lastUpdated: update.location.timestamp,
                    },
                  },
                }),
                ...(update.notes && { notes: update.notes }),
                ...(update.estimatedCompletion && { estimatedCompletion: update.estimatedCompletion }),
              }
            : dispatch
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dispatch status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get dispatch status
  const getDispatchStatus = useCallback(async (dispatchId: string): Promise<ActiveDispatch | null> => {
    try {
      const response = await fetch(`/api/hvac/dispatch/status/${dispatchId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get dispatch status');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get dispatch status:', err);
      return null;
    }
  }, []);

  // Handle emergency dispatch
  const handleEmergencyDispatch = useCallback(async (emergency: EmergencyDispatch): Promise<DispatchResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hvac/dispatch/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergency),
      });

      if (!response.ok) {
        throw new Error('Failed to handle emergency dispatch');
      }

      const result: DispatchResult = await response.json();

      if (result.success) {
        await loadActiveDispatches();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to handle emergency dispatch';
      setError(error);
      return {
        success: false,
        dispatchId: '',
        customerNotificationSent: false,
        reason: error,
      };
    } finally {
      setLoading(false);
    }
  }, [loadActiveDispatches]);

  // Cancel dispatch
  const cancelDispatch = useCallback(async (dispatchId: string, reason: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hvac/dispatch/cancel/${dispatchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel dispatch');
      }

      // Update local state
      setActiveDispatches(prev => 
        prev.map(dispatch => 
          dispatch.id === dispatchId 
            ? { ...dispatch, status: 'CANCELLED' }
            : dispatch
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel dispatch');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get technician's active dispatch
  const getTechnicianActiveDispatch = useCallback((technicianId: string): ActiveDispatch | null => {
    return activeDispatches.find(dispatch => 
      dispatch.technicianId === technicianId && 
      ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(dispatch.status)
    ) || null;
  }, [activeDispatches]);

  // Get dispatches by status
  const getDispatchesByStatus = useCallback((status: ActiveDispatch['status']): ActiveDispatch[] => {
    return activeDispatches.filter(dispatch => dispatch.status === status);
  }, [activeDispatches]);

  // Get overdue dispatches
  const getOverdueDispatches = useCallback((): ActiveDispatch[] => {
    const now = new Date();
    return activeDispatches.filter(dispatch => 
      dispatch.estimatedArrival && 
      dispatch.estimatedArrival < now && 
      !['COMPLETED', 'CANCELLED'].includes(dispatch.status)
    );
  }, [activeDispatches]);

  // Send customer notification
  const sendCustomerNotification = useCallback(async (
    dispatchId: string, 
    message: string, 
    type: 'SMS' | 'EMAIL' | 'BOTH' = 'BOTH'
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hvac/dispatch/notify/${dispatchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type }),
      });

      return response.ok;
    } catch (err) {
      console.error('Failed to send customer notification:', err);
      return false;
    }
  }, []);

  // Track technician location
  const trackTechnicianLocation = useCallback(async (technicianId: string): Promise<{
    latitude: number;
    longitude: number;
    timestamp: Date;
  } | null> => {
    try {
      const response = await fetch(`/api/hvac/dispatch/track/${technicianId}`);
      
      if (!response.ok) {
        throw new Error('Failed to track technician location');
      }

      const location = await response.json();
      return {
        ...location,
        timestamp: new Date(location.timestamp),
      };
    } catch (err) {
      console.error('Failed to track technician location:', err);
      return null;
    }
  }, []);

  // Calculate ETA
  const calculateETA = useCallback(async (
    fromLocation: { latitude: number; longitude: number },
    toLocation: { latitude: number; longitude: number }
  ): Promise<number> => {
    try {
      const response = await fetch('/api/hvac/dispatch/calculate-eta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromLocation, toLocation }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate ETA');
      }

      const { eta } = await response.json();
      return eta; // in minutes
    } catch (err) {
      console.error('Failed to calculate ETA:', err);
      // Fallback calculation based on distance
      const distance = calculateDistance(fromLocation, toLocation);
      return Math.round(distance / 40 * 60); // Assuming 40 km/h average speed
    }
  }, []);

  // Helper function to calculate distance
  const calculateDistance = useCallback((
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(point2.latitude - point1.latitude);
    const dLon = toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Auto-refresh dispatches every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveDispatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadActiveDispatches]);

  // Initial load
  useEffect(() => {
    loadActiveDispatches();
  }, [loadActiveDispatches]);

  return {
    // State
    activeDispatches,
    pendingJobs: activeDispatches.filter(dispatch => dispatch.status === 'DISPATCHED'),
    activeJobs: activeDispatches.filter(dispatch => ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(dispatch.status)),
    loading,
    error,
    lastUpdate,

    // Actions
    loadActiveDispatches,
    dispatchJob,
    updateDispatchStatus,
    getDispatchStatus,
    handleEmergencyDispatch,
    cancelDispatch,
    sendCustomerNotification,
    trackTechnicianLocation,
    calculateETA,

    // Utilities
    getTechnicianActiveDispatch,
    getDispatchesByStatus,
    getOverdueDispatches,
    refreshDispatches: loadActiveDispatches,
    clearError: () => setError(null),
  };
};
