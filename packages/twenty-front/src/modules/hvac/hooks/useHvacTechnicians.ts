/**
 * HVAC Technicians Hook
 * "Pasja rodzi profesjonalizm" - Professional HVAC Technician Management
 * 
 * Provides comprehensive technician management:
 * - Real-time technician tracking
 * - Availability management
 * - Performance monitoring
 * - Skill-based assignment
 * - Location tracking
 */

import { useApolloClient } from '@apollo/client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'ON_BREAK' | 'OFFLINE';
  level: 'APPRENTICE' | 'JUNIOR' | 'SENIOR' | 'LEAD' | 'SUPERVISOR';
  skills: string[];
  certifications: string[];
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    lastUpdated: Date;
  };
  workingHours: {
    start: string;
    end: string;
  };
  todayStats: {
    jobsCompleted: number;
    jobsScheduled: number;
    hoursWorked: number;
    travelTime: number;
    efficiency: number;
    customerRating: number;
  };
  currentJob?: {
    id: string;
    customerName: string;
    serviceType: string;
    startTime: Date;
    estimatedCompletion: Date;
    progress: number;
  };
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface TechnicianAvailability {
  technicianId: string;
  isAvailable: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  reason?: string;
  scheduledJobs: {
    id: string;
    startTime: Date;
    endTime: Date;
    customerName: string;
  }[];
}

interface TechnicianPerformance {
  technicianId: string;
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  metrics: {
    jobsCompleted: number;
    averageJobTime: number;
    customerSatisfaction: number;
    onTimePercentage: number;
    efficiency: number;
    revenue: number;
  };
  trends: {
    jobsCompletedTrend: 'UP' | 'DOWN' | 'STABLE';
    efficiencyTrend: 'UP' | 'DOWN' | 'STABLE';
    satisfactionTrend: 'UP' | 'DOWN' | 'STABLE';
  };
}

interface TechnicianLocation {
  technicianId: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export const useHvacTechnicians = () => {
  // State
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Apollo client for GraphQL operations
  const apolloClient = useApolloClient();

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for real-time technician updates
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/technicians';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Technicians WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeTechnicianUpdate(data);
        } catch (error) {
          console.error('Failed to parse technician WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Technicians WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Technicians WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle real-time technician updates
  const handleRealtimeTechnicianUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'TECHNICIAN_STATUS_UPDATE':
        setTechnicians(prev => 
          prev.map(tech => 
            tech.id === data.technicianId 
              ? { ...tech, status: data.status, lastSeen: new Date() }
              : tech
          )
        );
        break;
      case 'TECHNICIAN_LOCATION_UPDATE':
        setTechnicians(prev => 
          prev.map(tech => 
            tech.id === data.technicianId 
              ? {
                  ...tech,
                  currentLocation: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                    address: data.location.address,
                    lastUpdated: new Date(data.timestamp),
                  },
                  isOnline: true,
                  lastSeen: new Date(),
                }
              : tech
          )
        );
        break;
      case 'TECHNICIAN_JOB_UPDATE':
        setTechnicians(prev => 
          prev.map(tech => 
            tech.id === data.technicianId 
              ? {
                  ...tech,
                  currentJob: data.job,
                  status: data.job ? 'BUSY' : 'AVAILABLE',
                }
              : tech
          )
        );
        break;
      case 'TECHNICIAN_STATS_UPDATE':
        setTechnicians(prev => 
          prev.map(tech => 
            tech.id === data.technicianId 
              ? { ...tech, todayStats: { ...tech.todayStats, ...data.stats } }
              : tech
          )
        );
        break;
      case 'TECHNICIAN_ONLINE':
        setTechnicians(prev => 
          prev.map(tech => 
            tech.id === data.technicianId 
              ? { ...tech, isOnline: true, lastSeen: new Date() }
              : tech
          )
        );
        break;
      case 'TECHNICIAN_OFFLINE':
        setTechnicians(prev => 
          prev.map(tech => 
            tech.id === data.technicianId 
              ? { ...tech, isOnline: false, status: 'OFFLINE' }
              : tech
          )
        );
        break;
      default:
        console.log('Unknown technician update type:', data.type);
    }
    setLastUpdate(new Date());
  }, []);

  // Load technicians
  const loadTechnicians = useCallback(async (filters?: {
    status?: string;
    level?: string;
    skills?: string[];
    available?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // This would be replaced with actual API call
      const mockTechnicians: Technician[] = [
        {
          id: 'tech-1',
          name: 'Jan Kowalski',
          email: 'jan.kowalski@hvac.pl',
          phone: '+48 123 456 789',
          status: 'AVAILABLE',
          level: 'SENIOR',
          skills: ['MAINTENANCE', 'AIR_CONDITIONING', 'HEATING', 'REFRIGERATION'],
          certifications: ['EPA_CERTIFIED', 'HVAC_EXCELLENCE'],
          currentLocation: {
            latitude: 52.2297,
            longitude: 21.0122,
            address: 'Warszawa, Śródmieście',
            lastUpdated: new Date(),
          },
          workingHours: {
            start: '08:00',
            end: '17:00',
          },
          todayStats: {
            jobsCompleted: 3,
            jobsScheduled: 5,
            hoursWorked: 6.5,
            travelTime: 1.2,
            efficiency: 85,
            customerRating: 4.8,
          },
          color: '#3b82f6',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'tech-2',
          name: 'Anna Nowak',
          email: 'anna.nowak@hvac.pl',
          phone: '+48 987 654 321',
          status: 'BUSY',
          level: 'LEAD',
          skills: ['INSTALLATION', 'ELECTRICAL', 'PLUMBING', 'PROJECT_MANAGEMENT'],
          certifications: ['EPA_CERTIFIED', 'ELECTRICAL_LICENSE'],
          currentLocation: {
            latitude: 52.1672,
            longitude: 20.9679,
            address: 'Warszawa, Mokotów',
            lastUpdated: new Date(),
          },
          workingHours: {
            start: '07:00',
            end: '16:00',
          },
          todayStats: {
            jobsCompleted: 2,
            jobsScheduled: 4,
            hoursWorked: 7.0,
            travelTime: 0.8,
            efficiency: 92,
            customerRating: 4.9,
          },
          currentJob: {
            id: 'job-1',
            customerName: 'Firma XYZ',
            serviceType: 'INSTALLATION',
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
            estimatedCompletion: new Date(Date.now() + 1 * 60 * 60 * 1000),
            progress: 65,
          },
          color: '#10b981',
          isOnline: true,
          lastSeen: new Date(),
        },
        // Add more mock technicians as needed
      ];

      // Apply filters
      let filteredTechnicians = mockTechnicians;
      
      if (filters?.status) {
        filteredTechnicians = filteredTechnicians.filter(tech => tech.status === filters.status);
      }
      
      if (filters?.level) {
        filteredTechnicians = filteredTechnicians.filter(tech => tech.level === filters.level);
      }
      
      if (filters?.skills && filters.skills.length > 0) {
        filteredTechnicians = filteredTechnicians.filter(tech => 
          filters.skills!.some(skill => tech.skills.includes(skill))
        );
      }
      
      if (filters?.available !== undefined) {
        filteredTechnicians = filteredTechnicians.filter(tech => 
          filters.available ? tech.status === 'AVAILABLE' : tech.status !== 'AVAILABLE'
        );
      }

      setTechnicians(filteredTechnicians);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get technician by ID
  const getTechnicianById = useCallback((technicianId: string): Technician | null => {
    return technicians.find(tech => tech.id === technicianId) || null;
  }, [technicians]);

  // Get available technicians
  const getAvailableTechnicians = useCallback((requiredSkills?: string[]): Technician[] => {
    let available = technicians.filter(tech => tech.status === 'AVAILABLE' && tech.isOnline);
    
    if (requiredSkills && requiredSkills.length > 0) {
      available = available.filter(tech => 
        requiredSkills.some(skill => tech.skills.includes(skill))
      );
    }
    
    return available.sort((a, b) => b.todayStats.efficiency - a.todayStats.efficiency);
  }, [technicians]);

  // Get technician availability
  const getTechnicianAvailability = useCallback(async (
    technicianId: string,
    date?: Date
  ): Promise<TechnicianAvailability | null> => {
    try {
      const targetDate = date || new Date();
      const response = await fetch(`/api/hvac/technicians/${technicianId}/availability?date=${targetDate.toISOString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to get technician availability');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get technician availability:', err);
      return null;
    }
  }, []);

  // Get technician location
  const getTechnicianLocation = useCallback(async (technicianId: string): Promise<TechnicianLocation | null> => {
    try {
      const response = await fetch(`/api/hvac/technicians/${technicianId}/location`);
      
      if (!response.ok) {
        throw new Error('Failed to get technician location');
      }

      const location = await response.json();
      return {
        ...location,
        timestamp: new Date(location.timestamp),
      };
    } catch (err) {
      console.error('Failed to get technician location:', err);
      return null;
    }
  }, []);

  // Update technician status
  const updateTechnicianStatus = useCallback(async (
    technicianId: string,
    status: Technician['status']
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hvac/technicians/${technicianId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update technician status');
      }

      // Update local state optimistically
      setTechnicians(prev => 
        prev.map(tech => 
          tech.id === technicianId 
            ? { ...tech, status, lastSeen: new Date() }
            : tech
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to update technician status:', err);
      return false;
    }
  }, []);

  // Get technician performance
  const getTechnicianPerformance = useCallback(async (
    technicianId: string,
    period: TechnicianPerformance['period'] = 'TODAY'
  ): Promise<TechnicianPerformance | null> => {
    try {
      const response = await fetch(`/api/hvac/technicians/${technicianId}/performance?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to get technician performance');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get technician performance:', err);
      return null;
    }
  }, []);

  // Find nearest technician
  const findNearestTechnician = useCallback((
    location: { latitude: number; longitude: number },
    requiredSkills?: string[]
  ): Technician | null => {
    let candidates = getAvailableTechnicians(requiredSkills);
    
    if (candidates.length === 0) {
      return null;
    }

    // Calculate distances and find nearest
    const techniciansWithDistance = candidates.map(tech => ({
      technician: tech,
      distance: calculateDistance(location, tech.currentLocation),
    }));

    techniciansWithDistance.sort((a, b) => a.distance - b.distance);
    
    return techniciansWithDistance[0].technician;
  }, [getAvailableTechnicians]);

  // Calculate distance between two points
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

  // Get technicians by skill
  const getTechniciansBySkill = useCallback((skill: string): Technician[] => {
    return technicians.filter(tech => tech.skills.includes(skill));
  }, [technicians]);

  // Get technicians by level
  const getTechniciansByLevel = useCallback((level: Technician['level']): Technician[] => {
    return technicians.filter(tech => tech.level === level);
  }, [technicians]);

  // Get online technicians
  const getOnlineTechnicians = useCallback((): Technician[] => {
    return technicians.filter(tech => tech.isOnline);
  }, [technicians]);

  // Get technician workload
  const getTechnicianWorkload = useCallback((technicianId: string): number => {
    const technician = getTechnicianById(technicianId);
    if (!technician) return 0;
    
    const { jobsCompleted, jobsScheduled } = technician.todayStats;
    return jobsScheduled > 0 ? (jobsCompleted / jobsScheduled) * 100 : 0;
  }, [getTechnicianById]);

  // Auto-refresh technicians every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTechnicians();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTechnicians]);

  // Initial load
  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  return {
    // State
    technicians,
    availableTechnicians: technicians.filter(tech => tech.status === 'AVAILABLE' && tech.isOnline),
    loading,
    error,
    lastUpdate,

    // Actions
    loadTechnicians,
    getTechnicianById,
    getAvailableTechnicians,
    getTechnicianAvailability,
    getTechnicianLocation,
    updateTechnicianStatus,
    getTechnicianPerformance,
    findNearestTechnician,

    // Utilities
    getTechniciansBySkill,
    getTechniciansByLevel,
    getOnlineTechnicians,
    getTechnicianWorkload,
    calculateDistance,
    refreshTechnicians: loadTechnicians,
    clearError: () => setError(null),
  };
};
