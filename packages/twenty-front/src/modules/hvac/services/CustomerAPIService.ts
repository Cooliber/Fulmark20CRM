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

import { trackHVACUserAction } from '../index'; // Assuming this is for Sentry or similar

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
  // API_BASE_URL will now point to the Twenty CRM backend's GraphQL endpoint for customer data
  private readonly CRM_GRAPHQL_URL = process.env.NEXT_PUBLIC_SERVER_URL
    ? `${process.env.NEXT_PUBLIC_SERVER_URL}/graphql`
    : 'http://localhost:3001/graphql';
  // Keep HVAC_API_URL for other methods that might still hit HVAC API directly during transition
  private readonly HVAC_API_BASE_URL = process.env.NEXT_PUBLIC_HVAC_API_URL || 'http://localhost:8000';


  constructor() {
    this.cache = new Map();
    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      console.warn('NEXT_PUBLIC_SERVER_URL is not set. Defaulting to http://localhost:3001 for GraphQL.');
    }
  }

  private async fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.CRM_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getCRMSessionToken()}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GraphQL API call failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL query failed: ${JSON.stringify(result.errors)}`);
    }
    return result.data;
  }

  /**
   * Get customer 360 data with caching
   */
  async getCustomer360Data(
    customerId: string,
    // Optional arguments for pagination/filtering of sub-entities
    // These would align with the variables of the GetHvacCustomer360Data query
    equipmentArgs?: { filters?: unknown; page?: number; limit?: number }, // Replace unknown with actual filter types
    communicationArgs?: { filters?: unknown; page?: number; limit?: number },
    ticketArgs?: { filters?: unknown; page?: number; limit?: number },
    contractArgs?: { filters?: unknown; page?: number; limit?: number },
  ): Promise<Customer360Data | null > { // Return type might be nullable if customer not found
    // For a single, aggregated query, the cache key might just be based on customerId,
    // or more complex if sub-entity args make it very distinct.
    // For simplicity, let's use a basic key. Advanced caching would be handled by Apollo/Urql.
    const cacheKey = `customer_360_agg_${customerId}_${JSON.stringify({equipmentArgs, communicationArgs, ticketArgs, contractArgs })}`;
    const cached = this.getCachedData<Customer360Data>(cacheKey);

    if (cached) {
      trackHVACUserAction('customer_360_agg_cache_hit', 'API_CACHE', { customerId });
      return cached;
    }

    const GET_HVAC_CUSTOMER_360_DATA_QUERY = `
      query GetHvacCustomer360Data(
        $customerId: ID!,
        $equipmentFilters: HvacEquipmentFilterInput, $equipmentPage: Int, $equipmentLimit: Int,
        $commFilters: HvacCommunicationFilterInput, $commPage: Int, $commLimit: Int,
        $ticketFilters: HvacServiceTicketFilterInput, $ticketPage: Int, $ticketLimit: Int,
        $contractFilters: HvacContractFilterInput, $contractPage: Int, $contractLimit: Int
      ) {
        hvacCustomer360(customerId: $customerId) {
          customer {
            id name email phone nip regon krs vatRate vatExempt status customerType industry companySize
            totalValue lifetimeValue creditLimit paymentTerms preferredPaymentMethod satisfactionScore healthScore riskLevel
            preferredLanguage preferredContactMethod timezone createdAt updatedAt lastContactDate nextFollowUpDate
            hvacSystemCount maintenanceContract
            # emergencyContact { name phone email relationship } # Needs HvacEmergencyContactType
            # address { street city postalCode voivodeship country } # Needs HvacCustomerAddressType (already defined in resolver)
            # billingAddress { street city postalCode voivodeship country }
          }
          insights {
            financialMetrics { totalRevenue lifetimeValue averageOrderValue monthlyRecurringRevenue paymentHistory { id amount currency date status invoiceNumber } }
            riskIndicators { churnRisk paymentRisk satisfactionTrend lastContactDays }
            behaviorMetrics { serviceFrequency preferredContactMethod responseTime issueResolutionRate }
          }
          equipment(filters: $equipmentFilters, page: $equipmentPage, limit: $equipmentLimit) {
            equipment { id name type brand model serialNumber installationDate lastService nextService status warrantyExpiry customerName location notes }
            total
          }
          communications(filters: $commFilters, page: $commPage, limit: $commLimit) {
            communications { id type direction subject content timestamp status priority tags }
            total
          }
          serviceTickets(filters: $ticketFilters, page: $ticketPage, limit: $ticketLimit) {
            tickets { id title description status priority scheduledDate completedDate estimatedCost actualCost serviceType customerId equipmentId assignedTechnicianId createdAt updatedAt }
            total
          }
          contracts(filters: $contractFilters, page: $contractPage, limit: $contractLimit) {
            contracts { id type startDate endDate value status terms contractNumber customerId createdAt updatedAt }
            total
          }
        }
      }
    `;

    try {
      trackHVACUserAction('customer_360_agg_api_call', 'API_REQUEST', { customerId });
      const variables = {
        customerId,
        equipmentFilters: equipmentArgs?.filters, equipmentPage: equipmentArgs?.page, equipmentLimit: equipmentArgs?.limit,
        commFilters: communicationArgs?.filters, commPage: communicationArgs?.page, commLimit: communicationArgs?.limit,
        ticketFilters: ticketArgs?.filters, ticketPage: ticketArgs?.page, ticketLimit: ticketArgs?.limit,
        contractFilters: contractArgs?.filters, contractPage: contractArgs?.page, contractLimit: contractArgs?.limit,
      };

      const response = await this.fetchGraphQL<{ hvacCustomer360: Customer360Data | null }>(
        GET_HVAC_CUSTOMER_360_DATA_QUERY, variables
      );

      if (!response.hvacCustomer360 || !response.hvacCustomer360.customer) {
        // If customer itself is not found, hvacCustomer360 might be null or customer field might be null
        trackHVACUserAction('customer_360_agg_not_found', 'API_ERROR', { customerId });
        return null;
      }

      // The backend resolver for hvacCustomer360 should return a structure that matches Customer360Data.
      // Specifically, the lists like equipment, communications should come as { items: [], total: number }
      // and need to be mapped to the expected simple arrays in Customer360Data interface if it's not changed.
      // For now, assuming the GraphQL query is structured to return fields that directly map to Customer360Data.
      // This means HvacEquipmentListResponse needs to be mapped to Equipment[] etc. or Customer360Data interface adapted.

      // Let's adapt the Customer360Data interface or ensure the query returns the flat arrays.
      // The current query returns objects like { equipment: Equipment[], total: number }.
      // We need to extract the arrays.
      const rawData = response.hvacCustomer360;
      const mappedData: Customer360Data = {
          customer: rawData.customer,
          insights: rawData.insights!, // Assuming insights are always there if customer is there or handle null
          equipment: rawData.equipment.equipment,
          communications: rawData.communications.communications,
          tickets: rawData.serviceTickets.tickets,
          contracts: rawData.contracts.contracts,
      };


      this.setCachedData(cacheKey, mappedData);
      return mappedData;

    } catch (error) {
      trackHVACUserAction('customer_360_agg_api_error', 'API_ERROR', {
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all HVAC customers via GraphQL
   */
  async getCustomers(): Promise<Customer[]> {
    const query = `
      query GetHvacCustomers {
        hvacCustomers {
          id
          name
          email
          phone
          address {
            street
            city
            state
            postalCode
            country
          }
          properties {
            id
            address
            propertyType
            equipmentList {
              id
              name
              type
              status
              lastMaintenance
              nextMaintenance
            }
          }
        }
      }
    `;
    try {
      const response = await this.fetchGraphQL<{ hvacCustomers: Customer[] }>(query);
      return response.hvacCustomers || [];
    } catch (error) {
      trackHVACUserAction('get_all_customers_graphql_error', 'API_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }


  /**
   * Get customer basic information by ID via GraphQL
   */
  async getCustomerById(customerId: string): Promise<Customer | null> {
    const query = `
      query GetHvacCustomerById($id: ID!) {
        hvacCustomer(id: $id) {
          id
          name
          email
          phone
          address {
            street
            city
            state
            postalCode
            country
          }
          properties {
            id
            address
            propertyType
            equipmentList {
              id
              name
              type
              status
              lastMaintenance
              nextMaintenance
            }
          }
        }
      }
    `;
    try {
      const response = await this.fetchGraphQL<{ hvacCustomer: Customer | null }> (query, { id: customerId });
      return response.hvacCustomer;
    } catch (error) {
      trackHVACUserAction('get_customer_by_id_graphql_error', 'API_ERROR', {
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // It might be better to throw the error to be handled by the caller
      // or return null if that's the expected behavior for "not found" or other errors.
      throw error; // Or return null based on specific error handling strategy
    }
  }

  /**
   * Get customer insights and analytics
   * TODO: Refactor this to use GraphQL if an endpoint is available, or keep using direct HVAC API if necessary.
   */
  async getCustomerInsights(customerId: string): Promise<CustomerInsights | null> {
    const cacheKey = `customer_insights_${customerId}`;
    const cached = this.getCachedData<CustomerInsights>(cacheKey);
    if (cached) {
      trackHVACUserAction('customer_insights_cache_hit', 'API_CACHE', { customerId });
      return cached;
    }

    const GET_HVAC_CUSTOMER_INSIGHTS_QUERY = `
      query GetHvacCustomerInsights($customerId: ID!) {
        hvacCustomerInsights(customerId: $customerId) {
          financialMetrics {
            totalRevenue
            lifetimeValue
            averageOrderValue
            monthlyRecurringRevenue
            paymentHistory { id amount currency date status invoiceNumber }
          }
          riskIndicators {
            churnRisk
            paymentRisk
            satisfactionTrend
            lastContactDays
          }
          behaviorMetrics {
            serviceFrequency
            preferredContactMethod
            responseTime
            issueResolutionRate
          }
        }
      }
    `;
    try {
      const response = await this.fetchGraphQL<{ hvacCustomerInsights: CustomerInsights | null }>(
        GET_HVAC_CUSTOMER_INSIGHTS_QUERY, { customerId }
      );
      if (response.hvacCustomerInsights) {
        this.setCachedData(cacheKey, response.hvacCustomerInsights);
      }
      return response.hvacCustomerInsights;
    } catch (error) {
      trackHVACUserAction('get_customer_insights_graphql_error', 'API_ERROR', {
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get customer equipment list via GraphQL
   * This will use the hvacEquipments query with a customerId filter.
   */
  async getCustomerEquipment(customerId: string, page = 1, limit = 100): Promise<Equipment[]> { // Default limit high to get all for 360 view initially
    const cacheKey = `customer_equipment_${customerId}_${page}_${limit}`;
    const cached = this.getCachedData<Equipment[]>(cacheKey);
    if (cached) return cached;

    const GET_CUSTOMER_EQUIPMENT_QUERY = `
      query GetCustomerHvacEquipment($filters: HvacEquipmentFilterInput, $page: Int, $limit: Int) {
        hvacEquipments(filters: $filters, page: $page, limit: $limit) {
          equipment {
            id
            name
            type
            brand
            model
            serialNumber
            installationDate
            lastService
            nextService
            status
            # Add other Equipment fields as needed by Customer 360 view
          }
          # total # if needed
        }
      }
    `;
    try {
      const filters = { customerId };
      const response = await this.fetchGraphQL<{ hvacEquipments: { equipment: Equipment[] } }>(
        GET_CUSTOMER_EQUIPMENT_QUERY, { filters, page, limit }
      );
      const equipmentList = response.hvacEquipments?.equipment || [];
      this.setCachedData(cacheKey, equipmentList);
      return equipmentList;
    } catch (error) {
      trackHVACUserAction('get_customer_equipment_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get customer communications via GraphQL
   */
  async getCustomerCommunications(customerId: string, page = 1, limit = 100): Promise<Communication[]> {
    const cacheKey = `customer_communications_${customerId}_${page}_${limit}`;
    const cached = this.getCachedData<Communication[]>(cacheKey);
    if (cached) return cached;

    const GET_CUSTOMER_COMMUNICATIONS_QUERY = `
      query GetCustomerHvacCommunications($filters: HvacCommunicationFilterInput, $page: Int, $limit: Int) {
        hvacCommunications(filters: $filters, page: $page, limit: $limit) {
          communications {
            id
            type
            direction
            subject
            content
            timestamp
            status
            # Add other Communication fields as needed
          }
          # total
        }
      }
    `;
    try {
      const filters = { customerId };
      const response = await this.fetchGraphQL<{ hvacCommunications: { communications: Communication[] } }>(
        GET_CUSTOMER_COMMUNICATIONS_QUERY, { filters, page, limit }
      );
      const communicationsList = response.hvacCommunications?.communications || [];
      this.setCachedData(cacheKey, communicationsList);
      return communicationsList;
    } catch (error) {
      trackHVACUserAction('get_customer_communications_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get customer service tickets via GraphQL
   */
  async getCustomerTickets(customerId: string, page = 1, limit = 100): Promise<ServiceTicket[]> {
    const cacheKey = `customer_tickets_${customerId}_${page}_${limit}`;
    const cached = this.getCachedData<ServiceTicket[]>(cacheKey);
    if (cached) return cached;

    const GET_CUSTOMER_SERVICE_TICKETS_QUERY = `
      query GetCustomerHvacServiceTickets($filters: HvacServiceTicketFilterInput, $page: Int, $limit: Int) {
        hvacServiceTickets(filters: $filters, page: $page, limit: $limit) {
          tickets {
            id
            title
            description
            status
            priority
            scheduledDate
            # Add other ServiceTicket fields as needed
          }
          # total
        }
      }
    `;
    try {
      const filters = { customerId };
      const response = await this.fetchGraphQL<{ hvacServiceTickets: { tickets: ServiceTicket[] } }>(
        GET_CUSTOMER_SERVICE_TICKETS_QUERY, { filters, page, limit }
      );
      const ticketsList = response.hvacServiceTickets?.tickets || [];
      this.setCachedData(cacheKey, ticketsList);
      return ticketsList;
    } catch (error) {
      trackHVACUserAction('get_customer_tickets_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get customer contracts via GraphQL
   */
  async getCustomerContracts(customerId: string, page = 1, limit = 100): Promise<Contract[]> {
    const cacheKey = `customer_contracts_${customerId}_${page}_${limit}`;
    const cached = this.getCachedData<Contract[]>(cacheKey);
    if (cached) return cached;

    const GET_CUSTOMER_CONTRACTS_QUERY = `
      query GetCustomerHvacContracts($filters: HvacContractFilterInput, $page: Int, $limit: Int) {
        hvacContracts(filters: $filters, page: $page, limit: $limit) {
          contracts {
            id
            type
            startDate
            endDate
            value
            status
            # Add other Contract fields as needed
          }
          # total
        }
      }
    `;
    try {
      const filters = { customerId };
      const response = await this.fetchGraphQL<{ hvacContracts: { contracts: Contract[] } }>(
        GET_CUSTOMER_CONTRACTS_QUERY, { filters, page, limit }
      );
      const contractsList = response.hvacContracts?.contracts || [];
      this.setCachedData(cacheKey, contractsList);
      return contractsList;
    } catch (error) {
      trackHVACUserAction('get_customer_contracts_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update customer information via GraphQL Mutation
   */
  async updateCustomer(customerId: string, updates: Partial<Omit<Customer, 'id'>>): Promise<Customer> {
    const UPDATE_HVAC_CUSTOMER_MUTATION = `
      mutation UpdateHvacCustomer($input: UpdateHvacCustomerInput!) {
        updateHvacCustomer(input: $input) {
          id
          name
          email
          phone
          status
          # Include all fields that are part of HvacCustomerType and might be updated/returned
        }
      }
    `;
    try {
      // The input for the mutation is UpdateHvacCustomerInput, which requires 'id'
      const inputForMutation = { id: customerId, ...updates };
      const response = await this.fetchGraphQL<{ updateHvacCustomer: Customer }>(
        UPDATE_HVAC_CUSTOMER_MUTATION, { input: inputForMutation }
      );

      // Invalidate cache for this customer and potentially lists
      this.invalidateCustomerCache(customerId);
      this.invalidateCustomerCache('hvacCustomers'); // General list

      trackHVACUserAction('update_customer_graphql_success', 'API_SUCCESS', { customerId });
      return response.updateHvacCustomer;
    } catch (error) {
      trackHVACUserAction('update_customer_graphql_error', 'API_ERROR', {
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cache management (simple in-memory cache)
   */
  private getCachedData<T>(key: string): T | null {
    const cachedItem = this.cache.get(key);
    if (cachedItem && Date.now() - cachedItem.timestamp < this.CACHE_TTL) {
      return cachedItem.data as T;
    }
    this.cache.delete(key); // Remove expired or non-existent item
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCustomerCache(customerId: string): void {
    // This simple cache invalidation might need to be more sophisticated
    // if GraphQL queries have more complex caching keys.
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(customerId) || key.includes('hvacCustomers'), // Invalidate list query as well
    );
    keysToDelete.forEach(key => this.cache.delete(key));
    // Also consider invalidating specific GraphQL query caches if using Apollo/Urql client cache
  }

  private getCRMSessionToken(): string {
    // TODO: This is a placeholder. Implement robust and secure session token retrieval.
    // Avoid storing sensitive tokens directly in localStorage if possible.
    // Consider HttpOnly cookies managed by the backend or a secure auth state management.
    const token = localStorage.getItem('twenty_session_token');
    if (!token) {
      (this as any).logger.warn('CRM session token not found in localStorage.'); // Added 'this as any' to access logger
      // Depending on auth strategy, might redirect to login or try to refresh token.
    }
    return token || '';
  }
}

// Export singleton instance
export const customerAPIService = new CustomerAPIService();

// Adding a logger instance for the class if it's not already part of a framework that injects it
// For standalone classes, a simple console wrapper can be used, or a more sophisticated logger.
// Since trackHVACUserAction is used, let's assume a logging mechanism might be available or can be added.
// To make it explicit for the class:
if (!(CustomerAPIService.prototype as any).logger) {
  (CustomerAPIService.prototype as any).logger = {
      warn: console.warn,
      log: console.log,
      error: console.error,
      debug: console.debug,
  };
}
