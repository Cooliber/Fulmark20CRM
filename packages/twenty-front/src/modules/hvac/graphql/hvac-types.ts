/**
 * Enhanced HVAC GraphQL Types
 * "Pasja rodzi profesjonalizm" - Professional TypeScript Types
 * 
 * Type definitions for HVAC GraphQL operations
 * Following Twenty CRM patterns and TypeScript best practices
 */

// Base types
export interface HvacAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DateRangeInput {
  startDate: string;
  endDate: string;
}

// Customer types
export interface HvacCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  nip?: string;
  regon?: string;
  address?: HvacAddress;
  status: HvacCustomerStatus;
  type: HvacCustomerType;
  createdAt: string;
  updatedAt: string;
  serviceTickets?: HvacServiceTicket[];
  equipment?: HvacEquipment[];
  contracts?: HvacContract[];
}

export enum HvacCustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PROSPECT = 'PROSPECT'
}

export enum HvacCustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL'
}

export interface CreateHvacCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  nip?: string;
  regon?: string;
  address?: HvacAddress;
  type: HvacCustomerType;
  status?: HvacCustomerStatus;
}

export interface UpdateHvacCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  nip?: string;
  regon?: string;
  address?: HvacAddress;
  type?: HvacCustomerType;
  status?: HvacCustomerStatus;
}

export interface HvacCustomerFilter {
  status?: HvacCustomerStatus;
  type?: HvacCustomerType;
  search?: string;
  city?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface HvacCustomerSort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'status';
  direction: 'ASC' | 'DESC';
}

// Service ticket types
export interface HvacServiceTicket {
  id: string;
  title: string;
  description: string;
  status: HvacServiceTicketStatus;
  priority: HvacServiceTicketPriority;
  type: HvacServiceTicketType;
  customerId: string;
  technicianId?: string;
  equipmentId?: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: HvacCustomer;
  technician?: HvacTechnician;
  equipment?: HvacEquipment;
  communications?: HvacCommunication[];
  attachments?: HvacAttachment[];
}

export enum HvacServiceTicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum HvacServiceTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum HvacServiceTicketType {
  INSTALLATION = 'INSTALLATION',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  EMERGENCY = 'EMERGENCY'
}

export interface CreateHvacServiceTicketInput {
  title: string;
  description: string;
  priority: HvacServiceTicketPriority;
  type: HvacServiceTicketType;
  customerId: string;
  equipmentId?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
}

export interface UpdateHvacServiceTicketInput {
  title?: string;
  description?: string;
  status?: HvacServiceTicketStatus;
  priority?: HvacServiceTicketPriority;
  technicianId?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  cost?: number;
  notes?: string;
}

// Equipment types
export interface HvacEquipment {
  id: string;
  name: string;
  type: HvacEquipmentType;
  brand: string;
  model: string;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpiry?: string;
  customerId: string;
  location: string;
  specifications?: Record<string, any>;
  maintenanceSchedule?: string;
  status: HvacEquipmentStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
  customer?: HvacCustomer;
  maintenanceRecords?: HvacMaintenanceRecord[];
}

export enum HvacEquipmentType {
  HEATING_SYSTEM = 'HEATING_SYSTEM',
  COOLING_SYSTEM = 'COOLING_SYSTEM',
  VENTILATION = 'VENTILATION',
  HEAT_PUMP = 'HEAT_PUMP',
  BOILER = 'BOILER',
  AIR_CONDITIONER = 'AIR_CONDITIONER',
  THERMOSTAT = 'THERMOSTAT'
}

export enum HvacEquipmentStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

// Technician types
export interface HvacTechnician {
  id: string;
  name: string;
  phone: string;
  email: string;
  specializations: string[];
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: HvacTechnicianStatus;
  rating?: number;
  completedTickets?: number;
}

export enum HvacTechnicianStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFF_DUTY = 'OFF_DUTY',
  ON_BREAK = 'ON_BREAK'
}

// Communication types
export interface HvacCommunication {
  id: string;
  ticketId: string;
  type: HvacCommunicationType;
  direction: HvacCommunicationDirection;
  content: string;
  timestamp: string;
  participant: HvacParticipant;
  aiAnalysis?: HvacAIAnalysis;
}

export enum HvacCommunicationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SMS = 'SMS',
  CHAT = 'CHAT',
  NOTE = 'NOTE'
}

export enum HvacCommunicationDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export interface HvacParticipant {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface HvacAIAnalysis {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keywords: string[];
  summary: string;
}

// Search types
export interface HvacSemanticSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  highlights: string[];
}

export interface HvacSearchFilters {
  type?: string[];
  dateRange?: DateRangeInput;
  customerId?: string;
  technicianId?: string;
}

// Analytics types
export interface HvacDashboardAnalytics {
  summary: HvacAnalyticsSummary;
  charts: HvacAnalyticsCharts;
  kpis: HvacAnalyticsKPIs;
}

export interface HvacAnalyticsSummary {
  totalCustomers: number;
  activeServiceTickets: number;
  completedTicketsToday: number;
  upcomingMaintenances: number;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
}

export interface HvacAnalyticsCharts {
  ticketsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  ticketsByPriority: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  revenueOverTime: Array<{
    date: string;
    amount: number;
    ticketCount: number;
  }>;
  technicianPerformance: Array<{
    technicianId: string;
    name: string;
    completedTickets: number;
    averageRating: number;
    efficiency: number;
  }>;
}

export interface HvacAnalyticsKPIs {
  averageResponseTime: number;
  customerSatisfaction: number;
  firstTimeFixRate: number;
  equipmentUptime: number;
  maintenanceCompliance: number;
}

// Additional utility types
export interface HvacContract {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  value: number;
  status: string;
}

export interface HvacMaintenanceRecord {
  id: string;
  type: string;
  date: string;
  description: string;
  cost: number;
  technicianId: string;
}

export interface HvacAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}
