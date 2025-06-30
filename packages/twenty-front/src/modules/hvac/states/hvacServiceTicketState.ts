/**
 * HVAC Service Ticket State Management
 * "Pasja rodzi profesjonalizm" - Professional Service Ticket State
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Types over interfaces
 * - Proper Recoil state management
 * - Atom families for dynamic data
 */

import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { createState } from 'twenty-ui/utilities';

// Types
export type ServiceTicketStatus = 
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'PENDING_PARTS' 
  | 'PENDING_CUSTOMER' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'ON_HOLD';

export type ServiceTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type ServiceTicketType = 
  | 'INSTALLATION' 
  | 'MAINTENANCE' 
  | 'REPAIR' 
  | 'INSPECTION' 
  | 'EMERGENCY' 
  | 'WARRANTY';

export type ServiceTicket = {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: ServiceTicketStatus;
  priority: ServiceTicketPriority;
  serviceType: ServiceTicketType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  technicianId: string | null;
  technicianName: string | null;
  scheduledDate: Date | null;
  completedDate: Date | null;
  estimatedCost: number;
  actualCost: number | null;
  estimatedDuration: number; // in minutes
  actualDuration: number | null; // in minutes
  equipmentIds: string[];
  notes: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
};

export type ServiceTicketFilters = {
  status: ServiceTicketStatus[];
  priority: ServiceTicketPriority[];
  serviceType: ServiceTicketType[];
  technicianId: string[];
  customerId: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  searchQuery: string;
};

export type ServiceTicketSortOptions = {
  field: keyof ServiceTicket;
  direction: 'asc' | 'desc';
};

// Atoms - Primitive state
export const hvacServiceTicketsState = createState<ServiceTicket[]>({
  key: 'hvacServiceTicketsState',
  defaultValue: [],
});

export const hvacServiceTicketsLoadingState = createState<boolean>({
  key: 'hvacServiceTicketsLoadingState',
  defaultValue: false,
});

export const hvacServiceTicketsErrorState = createState<string | null>({
  key: 'hvacServiceTicketsErrorState',
  defaultValue: null,
});

export const hvacServiceTicketFiltersState = createState<ServiceTicketFilters>({
  key: 'hvacServiceTicketFiltersState',
  defaultValue: {
    status: [],
    priority: [],
    serviceType: [],
    technicianId: [],
    customerId: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    searchQuery: '',
  },
});

export const hvacServiceTicketSortState = createState<ServiceTicketSortOptions>({
  key: 'hvacServiceTicketSortState',
  defaultValue: {
    field: 'createdAt',
    direction: 'desc',
  },
});

export const hvacSelectedServiceTicketIdState = createState<string | null>({
  key: 'hvacSelectedServiceTicketIdState',
  defaultValue: null,
});

export const hvacServiceTicketPaginationState = createState<{
  page: number;
  pageSize: number;
  totalCount: number;
}>({
  key: 'hvacServiceTicketPaginationState',
  defaultValue: {
    page: 0,
    pageSize: 20,
    totalCount: 0,
  },
});

// Atom families for dynamic data
export const hvacServiceTicketByIdState = atomFamily<ServiceTicket | null, string>({
  key: 'hvacServiceTicketByIdState',
  default: null,
});

export const hvacServiceTicketNotesState = atomFamily<string[], string>({
  key: 'hvacServiceTicketNotesState',
  default: [],
});

export const hvacServiceTicketAttachmentsState = atomFamily<string[], string>({
  key: 'hvacServiceTicketAttachmentsState',
  default: [],
});

// Selectors - Derived state
export const hvacFilteredServiceTicketsSelector = selector({
  key: 'hvacFilteredServiceTicketsSelector',
  get: ({ get }) => {
    const tickets = get(hvacServiceTicketsState);
    const filters = get(hvacServiceTicketFiltersState);
    const sort = get(hvacServiceTicketSortState);
    
    let filteredTickets = tickets.filter(ticket => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(ticket.status)) {
        return false;
      }
      
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(ticket.priority)) {
        return false;
      }
      
      // Service type filter
      if (filters.serviceType.length > 0 && !filters.serviceType.includes(ticket.serviceType)) {
        return false;
      }
      
      // Technician filter
      if (filters.technicianId.length > 0 && ticket.technicianId && !filters.technicianId.includes(ticket.technicianId)) {
        return false;
      }
      
      // Customer filter
      if (filters.customerId.length > 0 && !filters.customerId.includes(ticket.customerId)) {
        return false;
      }
      
      // Date range filter
      const ticketDate = new Date(ticket.createdAt);
      if (ticketDate < filters.dateRange.start || ticketDate > filters.dateRange.end) {
        return false;
      }
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          ticket.ticketNumber,
          ticket.title,
          ticket.description,
          ticket.customerName,
          ticket.technicianName || '',
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Apply sorting
    filteredTickets.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });
    
    return filteredTickets;
  },
});

export const hvacServiceTicketStatsSelector = selector({
  key: 'hvacServiceTicketStatsSelector',
  get: ({ get }) => {
    const tickets = get(hvacServiceTicketsState);
    
    const stats = {
      total: tickets.length,
      open: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      emergency: 0,
      overdue: 0,
      unassigned: 0,
      averageResolutionTime: 0,
      customerSatisfaction: 0,
    };
    
    let totalResolutionTime = 0;
    let completedTicketsCount = 0;
    const now = new Date();
    
    tickets.forEach(ticket => {
      // Status counts
      switch (ticket.status) {
        case 'OPEN':
          stats.open++;
          break;
        case 'IN_PROGRESS':
          stats.inProgress++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }
      
      // Priority counts
      if (ticket.priority === 'EMERGENCY') {
        stats.emergency++;
      }
      
      // Unassigned tickets
      if (!ticket.technicianId) {
        stats.unassigned++;
      }
      
      // Overdue tickets (scheduled date passed and not completed)
      if (ticket.scheduledDate && 
          new Date(ticket.scheduledDate) < now && 
          ticket.status !== 'COMPLETED' && 
          ticket.status !== 'CANCELLED') {
        stats.overdue++;
      }
      
      // Resolution time calculation
      if (ticket.status === 'COMPLETED' && ticket.completedDate) {
        const resolutionTime = new Date(ticket.completedDate).getTime() - new Date(ticket.createdAt).getTime();
        totalResolutionTime += resolutionTime;
        completedTicketsCount++;
      }
    });
    
    // Calculate average resolution time in hours
    if (completedTicketsCount > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / completedTicketsCount / (1000 * 60 * 60));
    }
    
    return stats;
  },
});

export const hvacSelectedServiceTicketSelector = selector({
  key: 'hvacSelectedServiceTicketSelector',
  get: ({ get }) => {
    const selectedId = get(hvacSelectedServiceTicketIdState);
    if (!selectedId) return null;
    
    const tickets = get(hvacServiceTicketsState);
    return tickets.find(ticket => ticket.id === selectedId) || null;
  },
});

// Selector families for dynamic derived state
export const hvacServiceTicketWithDetailsSelector = selectorFamily({
  key: 'hvacServiceTicketWithDetailsSelector',
  get: (ticketId: string) => ({ get }) => {
    const ticket = get(hvacServiceTicketByIdState(ticketId));
    if (!ticket) return null;
    
    const notes = get(hvacServiceTicketNotesState(ticketId));
    const attachments = get(hvacServiceTicketAttachmentsState(ticketId));
    
    return {
      ...ticket,
      notes,
      attachments,
    };
  },
});

export const hvacServiceTicketsByStatusSelector = selectorFamily({
  key: 'hvacServiceTicketsByStatusSelector',
  get: (status: ServiceTicketStatus) => ({ get }) => {
    const tickets = get(hvacServiceTicketsState);
    return tickets.filter(ticket => ticket.status === status);
  },
});

export const hvacServiceTicketsByTechnicianSelector = selectorFamily({
  key: 'hvacServiceTicketsByTechnicianSelector',
  get: (technicianId: string) => ({ get }) => {
    const tickets = get(hvacServiceTicketsState);
    return tickets.filter(ticket => ticket.technicianId === technicianId);
  },
});
