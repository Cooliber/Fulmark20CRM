/**
 * Unified HVAC Types - Centralized type definitions
 * "Pasja rodzi profesjonalizm" - Unified type system for HVAC module
 * 
 * This file contains the canonical type definitions for the HVAC module
 * to resolve conflicts between different type definitions across components.
 */

// Technician Types
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  level: 'APPRENTICE' | 'JUNIOR' | 'SENIOR' | 'LEAD' | 'SUPERVISOR';
  skills: string[];
  certifications?: string[];
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
    customerRating?: number;
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
  isOnline?: boolean;
  lastSeen: Date;
}

// Active Dispatch Types
export interface ActiveDispatch {
  id: string;
  ticketId?: string;
  technicianId: string;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dispatchTime: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  completionTime?: Date;
  customerInfo: {
    name: string;
    phone?: string;
    address: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  technicianInfo?: {
    name: string;
    phone: string;
    skills: string[];
  };
  serviceType: string;
  priority: string;
  notes?: string;
  trackingUrl?: string;
}

// Equipment Types
export interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  location: string; // Required field
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REPAIR_NEEDED' | 'DECOMMISSIONED';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  installationDate: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  warrantyExpiration?: Date;
  specifications?: Record<string, unknown>;
  maintenanceHistory?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  technicianId: string;
  date: Date;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
  description: string;
  partsUsed?: string[];
  cost?: number;
  nextMaintenanceDate?: Date;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string | CustomerAddress; // Support both string and object
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'VIP' | 'SUSPENDED' | 'ARCHIVED';
  customerType: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'NON_PROFIT';
  // Polish business fields
  nip?: string;
  regon?: string;
  krs?: string;
  vatRate?: number;
  vatExempt?: boolean;
}

export interface CustomerAddress {
  street: string;
  city: string;
  postalCode: string;
  voivodeship: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Communication Types
export interface Communication {
  id: string;
  customerId: string;
  type: 'email' | 'phone' | 'sms' | 'meeting' | 'note';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  date: Date;
  timestamp?: Date; // Alternative field name
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiInsights?: string;
  participants?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'customer' | 'technician' | 'manager' | 'support';
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Technician Job Types
export interface TechnicianJob {
  id: string;
  ticketId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  serviceType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: Date;
  estimatedDuration: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  description: string;
  requiredSkills: string[];
  equipmentIds?: string[];
  checklist?: ChecklistItem[];
  notes?: string;
  photos?: string[];
  signature?: string;
  customerRating?: number;
  customerFeedback?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  category?: string;
  type?: string;
  required?: boolean;
  assignedTo?: string;
  dueDate?: Date;
  position: number;
}

// Scheduled Job Types
export interface ScheduledJob {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  priority: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: Date;
  estimatedDuration: number;
  technicianId?: string;
  description: string;
  address: string;
  phone?: string;
  email?: string;
}

// Route Optimization Types
export interface RouteOptimization {
  id: string;
  technicianId: string;
  technicianName: string;
  jobs: ScheduledJob[];
  totalDistance: number;
  totalDuration: number;
  estimatedFuelCost: number;
  optimizationScore: number;
  route: Array<{
    jobId: string;
    order: number;
    estimatedArrival: Date;
    estimatedDeparture: Date;
    travelTime: number;
    distance: number;
  }>;
}
