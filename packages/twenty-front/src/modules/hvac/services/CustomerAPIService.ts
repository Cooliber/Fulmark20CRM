/**
 * Customer API Service - HVAC CRM Customer Data Management
 * "Pasja rodzi profesjonalizm" - Professional API service architecture
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 */

import { trackHVACUserAction } from '../index';

// Enhanced Customer Types with Polish Business Compliance
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;

  // Polish Business Compliance Fields
  nip?: string; // Numer Identyfikacji Podatkowej
  regon?: string; // Rejestr Gospodarki Narodowej
  krs?: string; // Krajowy Rejestr Sądowy
  vatRate: number; // Polish VAT rate (23%, 8%, 5%, 0%)
  vatExempt: boolean; // VAT exemption status

  // Address Information
  address?: CustomerAddress;
  billingAddress?: CustomerAddress;

  // Business Information
  status: CustomerStatus;
  customerType: CustomerType;
  industry?: string;
  companySize?: CompanySize;

  // Financial Information
  totalValue: number;
  lifetimeValue: number;
  creditLimit?: number;
  paymentTerms: number; // Days
  preferredPaymentMethod?: PaymentMethod;

  // Relationship Information
  satisfactionScore: number; // 1-5 scale
  healthScore: number; // 0-100 calculated score
  riskLevel: RiskLevel;

  // Communication Preferences
  preferredLanguage: 'pl' | 'en';
  preferredContactMethod: ContactMethod;
  timezone: string;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;

  // HVAC Specific
  hvacSystemCount?: number;
  maintenanceContract?: boolean;
  emergencyContact?: EmergencyContact;
}

export interface CustomerAddress {
  street: string;
  city: string;
  postalCode: string;
  voivodeship: string; // Polish administrative division
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  VIP = 'vip',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  GOVERNMENT = 'government',
  NON_PROFIT = 'non_profit',
}

export enum CompanySize {
  MICRO = 'micro', // 1-9 employees
  SMALL = 'small', // 10-49 employees
  MEDIUM = 'medium', // 50-249 employees
  LARGE = 'large', // 250+ employees
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CARD = 'card',
  BLIK = 'blik', // Polish mobile payment
  INSTALLMENTS = 'installments',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  IN_PERSON = 'in_person',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface CustomerInsights {
  financialMetrics: {
    totalRevenue: number;
    lifetimeValue: number;
    averageOrderValue: number;
    monthlyRecurringRevenue: number;
    paymentHistory: PaymentRecord[];
  };
  riskIndicators: {
    churnRisk: number;
    paymentRisk: number;
    satisfactionTrend: number;
    lastContactDays: number;
  };
  behaviorMetrics: {
    serviceFrequency: number;
    preferredContactMethod: 'email' | 'phone' | 'sms';
    responseTime: number;
    issueResolutionRate: number;
  };
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  invoiceNumber: string;
}

export interface Equipment {
  id: string;
  customerId: string;
  name: string;
  type: 'AIR_CONDITIONING' | 'HEATING' | 'VENTILATION' | 'REFRIGERATION' | 'HEAT_PUMP';
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: Date;
  lastService: Date;
  nextService: Date;
  status: 'ACTIVE' | 'MAINTENANCE' | 'REPAIR_NEEDED' | 'INACTIVE';
  warrantyExpiry?: Date;
  technicalSpecs: Record<string, unknown>;
  maintenanceHistory: MaintenanceRecord[];
  manufacturer: string;
  customerName: string;
  location?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  date: Date;
  type: 'maintenance' | 'repair' | 'inspection';
  description: string;
  technician: string;
  cost: number;
  partsUsed: string[];
  nextServiceDate?: Date;
}

export interface Communication {
  id: string;
  customerId: string;
  type: 'email' | 'phone' | 'sms' | 'meeting' | 'note';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  date: Date;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiInsights?: string;
}

export interface Customer360Data {
  customer: Customer;
  insights: CustomerInsights;
  equipment: Equipment[];
  communications: Communication[];
  tickets: ServiceTicket[];
  contracts: Contract[];
}

export interface ServiceTicket {
  id: string;
  customerId: string;
  equipmentId?: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  assignedTechnician?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedCost: number;
  actualCost?: number;
}

export interface Contract {
  id: string;
  customerId: string;
  type: 'maintenance' | 'service' | 'installation';
  startDate: Date;
  endDate: Date;
  value: number;
  status: 'active' | 'expired' | 'cancelled';
  terms: string;
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

// API Service Class
export class CustomerAPIService {
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE_URL = process.env.REACT_APP_HVAC_API_URL || 'http://localhost:8000';

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get customer 360 data with caching
   */
  async getCustomer360Data(customerId: string): Promise<Customer360Data> {
    const cacheKey = `customer_360_${customerId}`;
    const cached = this.getCachedData<Customer360Data>(cacheKey);
    
    if (cached) {
      trackHVACUserAction('customer_360_cache_hit', 'API_CACHE', { customerId });
      return cached;
    }

    try {
      trackHVACUserAction('customer_360_api_call', 'API_REQUEST', { customerId });
      
      // Parallel API calls for better performance
      const [customer, insights, equipment, communications, tickets, contracts] = await Promise.all([
        this.getCustomer(customerId),
        this.getCustomerInsights(customerId),
        this.getCustomerEquipment(customerId),
        this.getCustomerCommunications(customerId),
        this.getCustomerTickets(customerId),
        this.getCustomerContracts(customerId),
      ]);

      const data: Customer360Data = {
        customer,
        insights,
        equipment,
        communications,
        tickets,
        contracts,
      };

      this.setCachedData(cacheKey, data);
      return data;
      
    } catch (error) {
      trackHVACUserAction('customer_360_api_error', 'API_ERROR', { 
        customerId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get customer basic information
   */
  async getCustomer(customerId: string): Promise<Customer> {
    const response = await this.makeAPICall<Customer>(`/api/v1/customers/${customerId}`);
    return response.data;
  }

  /**
   * Get customer insights and analytics
   */
  async getCustomerInsights(customerId: string): Promise<CustomerInsights> {
    const response = await this.makeAPICall<CustomerInsights>(`/api/v1/customers/${customerId}/insights`);
    return response.data;
  }

  /**
   * Get customer equipment list
   */
  async getCustomerEquipment(customerId: string): Promise<Equipment[]> {
    const response = await this.makeAPICall<Equipment[]>(`/api/v1/customers/${customerId}/equipment`);
    return response.data;
  }

  /**
   * Get customer communications
   */
  async getCustomerCommunications(customerId: string): Promise<Communication[]> {
    const response = await this.makeAPICall<Communication[]>(`/api/v1/customers/${customerId}/communications`);
    return response.data;
  }

  /**
   * Get customer service tickets
   */
  async getCustomerTickets(customerId: string): Promise<ServiceTicket[]> {
    const response = await this.makeAPICall<ServiceTicket[]>(`/api/v1/customers/${customerId}/tickets`);
    return response.data;
  }

  /**
   * Get customer contracts
   */
  async getCustomerContracts(customerId: string): Promise<Contract[]> {
    const response = await this.makeAPICall<Contract[]>(`/api/v1/customers/${customerId}/contracts`);
    return response.data;
  }

  /**
   * Update customer information
   */
  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    const response = await this.makeAPICall<Customer>(
      `/api/v1/customers/${customerId}`,
      'PUT',
      updates
    );
    
    // Invalidate cache
    this.invalidateCustomerCache(customerId);
    
    return response.data;
  }

  /**
   * Cache management
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCustomerCache(customerId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(customerId)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Generic API call method with error handling and retry logic
   */
  private async makeAPICall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown,
    retries = 3
  ): Promise<APIResponse<T>> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
        
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('API call failed after all retries');
  }

  private getAuthToken(): string {
    // TODO: Implement proper token management
    return localStorage.getItem('hvac_auth_token') || '';
  }
}

// Export singleton instance
export const customerAPIService = new CustomerAPIService();
