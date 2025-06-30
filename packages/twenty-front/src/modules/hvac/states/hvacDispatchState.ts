/**
 * HVAC Dispatch State Management
 * "Pasja rodzi profesjonalizm" - Professional Dispatch State
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Types over interfaces
 * - Proper Recoil state management
 * - Real-time updates with WebSocket integration
 */

import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { createState } from 'twenty-ui/utilities';

// Types
export type DispatchStatus = 
  | 'PENDING' 
  | 'DISPATCHED' 
  | 'EN_ROUTE' 
  | 'ARRIVED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'DELAYED';

export type TechnicianStatus = 
  | 'AVAILABLE' 
  | 'BUSY' 
  | 'ON_BREAK' 
  | 'OFF_DUTY' 
  | 'EMERGENCY' 
  | 'TRAINING';

export type DispatchPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type DispatchJob = {
  id: string;
  ticketId: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocation: {
    lat: number;
    lng: number;
  };
  priority: DispatchPriority;
  status: DispatchStatus;
  assignedTechnicianId: string | null;
  assignedTechnicianName: string | null;
  scheduledTime: Date;
  estimatedDuration: number; // in minutes
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  description: string;
  requiredSkills: string[];
  requiredParts: string[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  dispatchedBy: string;
  lastModifiedBy: string;
};

export type Technician = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: TechnicianStatus;
  skills: string[];
  certifications: string[];
  currentLocation: {
    lat: number;
    lng: number;
    timestamp: Date;
  } | null;
  homeBase: {
    lat: number;
    lng: number;
    address: string;
  };
  workingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  activeJobId: string | null;
  vehicleId: string | null;
  rating: number;
  completedJobs: number;
  averageJobTime: number; // in minutes
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DispatchMetrics = {
  totalJobs: number;
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  emergencyJobs: number;
  averageResponseTime: number; // in minutes
  averageJobDuration: number; // in minutes
  technicianUtilization: number; // percentage
  customerSatisfaction: number; // 1-5 scale
  onTimePerformance: number; // percentage
  firstTimeFixRate: number; // percentage
};

// Atoms - Primitive state
export const hvacDispatchJobsState = createState<DispatchJob[]>({
  key: 'hvacDispatchJobsState',
  defaultValue: [],
});

export const hvacTechniciansState = createState<Technician[]>({
  key: 'hvacTechniciansState',
  defaultValue: [],
});

export const hvacDispatchLoadingState = createState<boolean>({
  key: 'hvacDispatchLoadingState',
  defaultValue: false,
});

export const hvacDispatchErrorState = createState<string | null>({
  key: 'hvacDispatchErrorState',
  defaultValue: null,
});

export const hvacDispatchMetricsState = createState<DispatchMetrics | null>({
  key: 'hvacDispatchMetricsState',
  defaultValue: null,
});

export const hvacSelectedDispatchJobIdState = createState<string | null>({
  key: 'hvacSelectedDispatchJobIdState',
  defaultValue: null,
});

export const hvacSelectedTechnicianIdState = createState<string | null>({
  key: 'hvacSelectedTechnicianIdState',
  defaultValue: null,
});

export const hvacDispatchFiltersState = createState<{
  status: DispatchStatus[];
  priority: DispatchPriority[];
  technicianId: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}>({
  key: 'hvacDispatchFiltersState',
  defaultValue: {
    status: [],
    priority: [],
    technicianId: [],
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  },
});

export const hvacDispatchRealTimeUpdatesState = createState<boolean>({
  key: 'hvacDispatchRealTimeUpdatesState',
  defaultValue: true,
});

export const hvacDispatchLastUpdateState = createState<Date>({
  key: 'hvacDispatchLastUpdateState',
  defaultValue: new Date(),
});

// Atom families for dynamic data
export const hvacDispatchJobByIdState = atomFamily<DispatchJob | null, string>({
  key: 'hvacDispatchJobByIdState',
  default: null,
});

export const hvacTechnicianByIdState = atomFamily<Technician | null, string>({
  key: 'hvacTechnicianByIdState',
  default: null,
});

export const hvacTechnicianLocationState = atomFamily<{
  lat: number;
  lng: number;
  timestamp: Date;
} | null, string>({
  key: 'hvacTechnicianLocationState',
  default: null,
});

// Selectors - Derived state
export const hvacPendingDispatchJobsSelector = selector({
  key: 'hvacPendingDispatchJobsSelector',
  get: ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    return jobs.filter(job => job.status === 'PENDING');
  },
});

export const hvacActiveDispatchJobsSelector = selector({
  key: 'hvacActiveDispatchJobsSelector',
  get: ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    return jobs.filter(job => 
      ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(job.status)
    );
  },
});

export const hvacEmergencyDispatchJobsSelector = selector({
  key: 'hvacEmergencyDispatchJobsSelector',
  get: ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    return jobs.filter(job => job.priority === 'EMERGENCY');
  },
});

export const hvacAvailableTechniciansSelector = selector({
  key: 'hvacAvailableTechniciansSelector',
  get: ({ get }) => {
    const technicians = get(hvacTechniciansState);
    return technicians.filter(tech => 
      tech.status === 'AVAILABLE' && tech.isOnline
    );
  },
});

export const hvacBusyTechniciansSelector = selector({
  key: 'hvacBusyTechniciansSelector',
  get: ({ get }) => {
    const technicians = get(hvacTechniciansState);
    return technicians.filter(tech => 
      tech.status === 'BUSY' && tech.activeJobId !== null
    );
  },
});

export const hvacFilteredDispatchJobsSelector = selector({
  key: 'hvacFilteredDispatchJobsSelector',
  get: ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    const filters = get(hvacDispatchFiltersState);
    
    return jobs.filter(job => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(job.status)) {
        return false;
      }
      
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(job.priority)) {
        return false;
      }
      
      // Technician filter
      if (filters.technicianId.length > 0 && 
          job.assignedTechnicianId && 
          !filters.technicianId.includes(job.assignedTechnicianId)) {
        return false;
      }
      
      // Date range filter
      const jobDate = new Date(job.scheduledTime);
      if (jobDate < filters.dateRange.start || jobDate > filters.dateRange.end) {
        return false;
      }
      
      return true;
    });
  },
});

export const hvacDispatchEfficiencySelector = selector({
  key: 'hvacDispatchEfficiencySelector',
  get: ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    const technicians = get(hvacTechniciansState);
    const metrics = get(hvacDispatchMetricsState);
    
    const totalTechnicians = technicians.length;
    const activeTechnicians = technicians.filter(t => t.status === 'BUSY').length;
    const utilization = totalTechnicians > 0 ? (activeTechnicians / totalTechnicians) * 100 : 0;
    
    const completedToday = jobs.filter(job => {
      const today = new Date();
      const jobDate = new Date(job.actualEndTime || job.updatedAt);
      return job.status === 'COMPLETED' && 
             jobDate.toDateString() === today.toDateString();
    }).length;
    
    const overdueJobs = jobs.filter(job => {
      const now = new Date();
      return job.status !== 'COMPLETED' && 
             job.status !== 'CANCELLED' && 
             new Date(job.scheduledTime) < now;
    }).length;
    
    return {
      technicianUtilization: Math.round(utilization),
      completedToday,
      overdueJobs,
      averageResponseTime: metrics?.averageResponseTime || 0,
      onTimePerformance: metrics?.onTimePerformance || 0,
      firstTimeFixRate: metrics?.firstTimeFixRate || 0,
    };
  },
});

export const hvacSelectedDispatchJobSelector = selector({
  key: 'hvacSelectedDispatchJobSelector',
  get: ({ get }) => {
    const selectedId = get(hvacSelectedDispatchJobIdState);
    if (!selectedId) return null;
    
    const jobs = get(hvacDispatchJobsState);
    return jobs.find(job => job.id === selectedId) || null;
  },
});

export const hvacSelectedTechnicianSelector = selector({
  key: 'hvacSelectedTechnicianSelector',
  get: ({ get }) => {
    const selectedId = get(hvacSelectedTechnicianIdState);
    if (!selectedId) return null;
    
    const technicians = get(hvacTechniciansState);
    return technicians.find(tech => tech.id === selectedId) || null;
  },
});

// Selector families for dynamic queries
export const hvacDispatchJobsByStatusSelector = selectorFamily({
  key: 'hvacDispatchJobsByStatusSelector',
  get: (status: DispatchStatus) => ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    return jobs.filter(job => job.status === status);
  },
});

export const hvacDispatchJobsByTechnicianSelector = selectorFamily({
  key: 'hvacDispatchJobsByTechnicianSelector',
  get: (technicianId: string) => ({ get }) => {
    const jobs = get(hvacDispatchJobsState);
    return jobs.filter(job => job.assignedTechnicianId === technicianId);
  },
});

export const hvacTechniciansByStatusSelector = selectorFamily({
  key: 'hvacTechniciansByStatusSelector',
  get: (status: TechnicianStatus) => ({ get }) => {
    const technicians = get(hvacTechniciansState);
    return technicians.filter(tech => tech.status === status);
  },
});

export const hvacTechniciansBySkillSelector = selectorFamily({
  key: 'hvacTechniciansBySkillSelector',
  get: (skill: string) => ({ get }) => {
    const technicians = get(hvacTechniciansState);
    return technicians.filter(tech => 
      tech.skills.includes(skill) && tech.status === 'AVAILABLE'
    );
  },
});
