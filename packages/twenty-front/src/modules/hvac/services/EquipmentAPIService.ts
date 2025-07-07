/**
 * Equipment API Service - HVAC Equipment Management
 * "Pasja rodzi profesjonalizm" - Professional equipment management service
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 */

import { trackHVACUserAction } from '../index'; // Assuming Sentry or similar

// Equipment types and interfaces
// Keep existing interfaces as they define the shape of data expected by components
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
  type: 'maintenance' | 'repair' | 'inspection' | 'installation';
  description: string;
  technician: string;
  cost: number;
  partsUsed: string[];
  nextServiceDate?: Date;
  photos?: string[];
  documents?: string[];
}

export interface EquipmentFilter {
  customerId?: string;
  type?: string;
  status?: string;
  brand?: string;
  needsService?: boolean;
  warrantyExpiring?: boolean;
}

export interface CreateEquipmentRequest {
  customerId: string;
  name: string;
  type: Equipment['type'];
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: Date;
  warrantyExpiry?: Date;
  technicalSpecs?: Record<string, unknown>;
  location?: string;
  notes?: string;
}

export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  id: string;
  status?: Equipment['status'];
  lastService?: Date;
  nextService?: Date;
}

export interface ScheduleMaintenanceRequest {
  equipmentId: string;
  scheduledDate: Date;
  type: MaintenanceRecord['type'];
  description: string;
  technicianId?: string;
  estimatedCost?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Equipment API Service Class
 * Handles all equipment-related API operations with caching and error handling
 */
export class EquipmentAPIService {
  // CRM_GRAPHQL_URL will point to the Twenty CRM backend's GraphQL endpoint
  private readonly CRM_GRAPHQL_URL = process.env.NEXT_PUBLIC_SERVER_URL
    ? `${process.env.NEXT_PUBLIC_SERVER_URL}/graphql`
    : 'http://localhost:3001/graphql';
  // Keep HVAC_API_BASE_URL for methods not yet refactored (if any, or remove if all refactored)
  // private readonly HVAC_API_BASE_URL = process.env.NEXT_PUBLIC_HVAC_API_URL || 'http://localhost:8000';

  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      console.warn('NEXT_PUBLIC_SERVER_URL is not set for EquipmentAPIService. Defaulting to http://localhost:3001 for GraphQL.');
    }
  }

  private async fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const startTime = Date.now();
    let operationName = 'UnknownGraphQLOperation'; // Default operation name
    try {
        // Attempt to parse operation name from query string for better tracking
        const match = query.match(/(query|mutation)\s+(\w+)/);
        if (match && match[2]) {
            operationName = match[2];
        }

        const response = await fetch(this.CRM_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // TODO: Add Authorization header if required by Twenty CRM backend
                // 'Authorization': `Bearer ${this.getCRMSessionToken()}`,
            },
            body: JSON.stringify({ query, variables }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorBody = await response.text();
            trackHVACUserAction('equipment_graphql_api_error', 'API_ERROR', {
                operationName,
                variables,
                duration,
                status: response.status,
                error: `GraphQL API call failed: ${response.status} ${response.statusText} - ${errorBody}`,
            });
            throw new Error(`GraphQL API call failed: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        if (result.errors) {
            trackHVACUserAction('equipment_graphql_query_error', 'API_ERROR', {
                operationName,
                variables,
                duration,
                errors: result.errors,
            });
            throw new Error(`GraphQL query failed: ${JSON.stringify(result.errors)}`);
        }

        trackHVACUserAction('equipment_graphql_api_success', 'API_SUCCESS', {
            operationName,
            variables,
            duration,
            status: response.status,
        });
        return result.data;

    } catch (error) {
        const duration = Date.now() - startTime;
        trackHVACUserAction('equipment_graphql_fetch_exception', 'API_ERROR', {
            operationName,
            variables,
            duration,
            error: error instanceof Error ? error.message : 'Unknown fetch exception',
        });
        throw error;
    }
  }


  /**
   * Cache management - This simple cache might be superseded by a GraphQL client's cache (e.g., Apollo, Urql)
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get equipment list with filtering and pagination
   */
  async getEquipment(
    filters: EquipmentFilter = {},
    page = 1,
    limit = 20,
  ): Promise<{ equipment: Equipment[]; total: number }> {
    const cacheKey = `equipment_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.getCachedData<{ equipment: Equipment[]; total: number }>(cacheKey);

    if (cached) {
      trackHVACUserAction('equipment_cache_hit', 'API_CACHE', { filters, page, limit });
      return cached;
    }

    const GET_HVAC_EQUIPMENTS_QUERY = `
      query GetHvacEquipments($filters: HvacEquipmentFilterInput, $page: Int, $limit: Int) {
        hvacEquipments(filters: $filters, page: $page, limit: $limit) {
          equipment {
            id
            customerId
            name
            type
            brand
            model
            serialNumber
            installationDate
            lastService
            nextService
            status
            warrantyExpiry
            // technicalSpecs # Consider how to fetch/map this if it's JSON
            manufacturer
            customerName
            location
            notes
          }
          total
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacEquipments: { equipment: Equipment[]; total: number } }>(
        GET_HVAC_EQUIPMENTS_QUERY, { filters, page, limit }
    );

    const responseData = response.hvacEquipments || { equipment: [], total: 0 };
    this.setCachedData(cacheKey, responseData);
    return responseData;
  }

  /**
   * Get equipment by ID via GraphQL
   */
  async getEquipmentById(equipmentId: string): Promise<Equipment | null> {
    const cacheKey = `equipment_${equipmentId}`;
    const cached = this.getCachedData<Equipment>(cacheKey);

    if (cached) {
      return cached;
    }

    const GET_HVAC_EQUIPMENT_BY_ID_QUERY = `
      query GetHvacEquipmentById($id: ID!) {
        hvacEquipment(id: $id) {
          id
          customerId
          name
          type
          brand
          model
          serialNumber
          installationDate
          lastService
          nextService
          status
          warrantyExpiry
          technicalSpecs # Assuming GraphQLJSONObject or similar stringified JSON
          # maintenanceHistory { id date type description } # Example of fetching related data
          manufacturer
          customerName
          location
          notes
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacEquipment: Equipment | null }>(
        GET_HVAC_EQUIPMENT_BY_ID_QUERY, { id: equipmentId }
    );

    if (response.hvacEquipment) {
        this.setCachedData(cacheKey, response.hvacEquipment);
    }
    return response.hvacEquipment;
  }

  /**
   * Create new equipment via GraphQL
   */
  async createEquipment(equipmentData: CreateEquipmentRequest): Promise<Equipment> {
    const CREATE_HVAC_EQUIPMENT_MUTATION = `
      mutation CreateHvacEquipment($input: CreateHvacEquipmentInput!) {
        createHvacEquipment(input: $input) {
          id # and other fields needed after creation
          name
          customerId
          type
          status
        }
      }
    `;
    const response = await this.fetchGraphQL<{ createHvacEquipment: Equipment }>(
        CREATE_HVAC_EQUIPMENT_MUTATION, { input: equipmentData }
    );

    this.invalidateCache('equipment_'); // Invalidate list cache
    if (equipmentData.customerId) {
        this.invalidateCache(`customer_${equipmentData.customerId}_equipments`); // More specific if needed
    }

    trackHVACUserAction('equipment_created_graphql', 'EQUIPMENT_MANAGEMENT', {
      equipmentId: response.createHvacEquipment.id,
      customerId: equipmentData.customerId,
      type: equipmentData.type,
    });
    return response.createHvacEquipment;
  }

  /**
   * Update equipment via GraphQL
   */
  async updateEquipment(equipmentData: UpdateEquipmentRequest): Promise<Equipment> {
    const UPDATE_HVAC_EQUIPMENT_MUTATION = `
      mutation UpdateHvacEquipment($input: UpdateHvacEquipmentInput!) {
        updateHvacEquipment(input: $input) {
          id # and other fields needed after update
          name
          status
          type
        }
      }
    `;
    const response = await this.fetchGraphQL<{ updateHvacEquipment: Equipment }>(
        UPDATE_HVAC_EQUIPMENT_MUTATION, { input: equipmentData }
    );

    this.invalidateCache('equipment_'); // Invalidate list cache
    this.invalidateCache(`equipment_${equipmentData.id}`); // Invalidate specific item cache

    trackHVACUserAction('equipment_updated_graphql', 'EQUIPMENT_MANAGEMENT', {
      equipmentId: equipmentData.id,
      changes: Object.keys(equipmentData),
    });
    return response.updateHvacEquipment;
  }

  /**
   * Delete equipment via GraphQL
   */
  async deleteEquipment(equipmentId: string): Promise<boolean> {
    const DELETE_HVAC_EQUIPMENT_MUTATION = `
      mutation DeleteHvacEquipment($id: ID!) {
        deleteHvacEquipment(id: $id)
      }
    `;
    // Assuming mutation returns boolean for success
    const response = await this.fetchGraphQL<{ deleteHvacEquipment: boolean }>(
        DELETE_HVAC_EQUIPMENT_MUTATION, { id: equipmentId }
    );

    if (response.deleteHvacEquipment) {
        this.invalidateCache('equipment_');
        this.invalidateCache(`equipment_${equipmentId}`);
    }

    trackHVACUserAction('equipment_deleted_graphql', 'EQUIPMENT_MANAGEMENT', { equipmentId });
    return response.deleteHvacEquipment;
  }

  /**
   * Get equipment maintenance history via GraphQL
   */
  async getMaintenanceHistory(equipmentId: string): Promise<MaintenanceRecord[]> {
    const cacheKey = `maintenance_history_${equipmentId}`;
    const cached = this.getCachedData<MaintenanceRecord[]>(cacheKey);
    if (cached) return cached;

    const GET_MAINTENANCE_HISTORY_QUERY = `
      query GetHvacEquipmentMaintenanceHistory($equipmentId: ID!) {
        hvacEquipmentMaintenanceHistory(equipmentId: $equipmentId) {
          id
          date
          type
          description
          technician
          cost
          partsUsed
          nextServiceDate
          // photos
          // documents
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacEquipmentMaintenanceHistory: MaintenanceRecord[] }>(
        GET_MAINTENANCE_HISTORY_QUERY, { equipmentId }
    );

    const history = response.hvacEquipmentMaintenanceHistory || [];
    this.setCachedData(cacheKey, history);
    return history;
  }

  /**
   * Schedule maintenance via GraphQL
   */
  async scheduleMaintenance(maintenanceData: ScheduleMaintenanceRequest): Promise<MaintenanceRecord> {
    const SCHEDULE_MAINTENANCE_MUTATION = `
      mutation ScheduleHvacMaintenance($input: ScheduleHvacMaintenanceInput!) {
        scheduleHvacMaintenance(input: $input) {
          id
          equipmentId
          date
          type
          description
          technician
          priority
        }
      }
    `;
    const response = await this.fetchGraphQL<{ scheduleHvacMaintenance: MaintenanceRecord }>(
        SCHEDULE_MAINTENANCE_MUTATION, { input: maintenanceData }
    );

    this.invalidateCache(`maintenance_history_${maintenanceData.equipmentId}`);
    this.invalidateCache(`equipment_${maintenanceData.equipmentId}`); // Equipment details might change (e.g. nextServiceDate)

    trackHVACUserAction('maintenance_scheduled_graphql', 'EQUIPMENT_MANAGEMENT', {
      equipmentId: maintenanceData.equipmentId,
      scheduledDate: maintenanceData.scheduledDate.toISOString(),
    });
    return response.scheduleHvacMaintenance;
  }

  /**
   * Get equipment needing service via GraphQL
   */
  async getEquipmentNeedingService(): Promise<Equipment[]> {
    const cacheKey = 'equipment_needs_service_graphql';
    const cached = this.getCachedData<Equipment[]>(cacheKey);
    if (cached) return cached;

    const GET_EQUIPMENT_NEEDING_SERVICE_QUERY = `
      query GetHvacEquipmentNeedingService {
        hvacEquipmentNeedingService {
          id
          name
          type
          status
          nextService
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacEquipmentNeedingService: Equipment[] }>(
        GET_EQUIPMENT_NEEDING_SERVICE_QUERY
    );
    
    const equipment = response.hvacEquipmentNeedingService || [];
    this.setCachedData(cacheKey, equipment);
    return equipment;
  }

  /**
   * Get equipment with expiring warranties via GraphQL
   */
  async getEquipmentWithExpiringWarranties(days = 30): Promise<Equipment[]> {
    const cacheKey = `equipment_warranty_expiring_graphql_${days}`;
    const cached = this.getCachedData<Equipment[]>(cacheKey);
    if (cached) return cached;
    
    const GET_EQUIPMENT_EXPIRING_WARRANTIES_QUERY = `
      query GetHvacEquipmentWithExpiringWarranties($days: Int) {
        hvacEquipmentWithExpiringWarranties(days: $days) {
          id
          name
          type
          warrantyExpiry
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacEquipmentWithExpiringWarranties: Equipment[] }>(
        GET_EQUIPMENT_EXPIRING_WARRANTIES_QUERY, { days }
    );

    const equipment = response.hvacEquipmentWithExpiringWarranties || [];
    this.setCachedData(cacheKey, equipment);
    return equipment;
  }
}

// Export singleton instance
export const equipmentAPIService = new EquipmentAPIService();
