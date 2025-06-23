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

import { trackHVACUserAction } from '../index';

// Equipment types and interfaces
export interface Equipment {
  id: string;
  customerId: string;
  name: string;
  type: 'klimatyzacja' | 'wentylacja' | 'ogrzewanie' | 'inne';
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: Date;
  lastService: Date;
  nextService: Date;
  status: 'sprawny' | 'wymaga_serwisu' | 'awaria' | 'wyłączony';
  warrantyExpiry?: Date;
  technicalSpecs: Record<string, unknown>;
  maintenanceHistory: MaintenanceRecord[];
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
  private baseURL: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_HVAC_API_URL || 'http://localhost:8000';
    this.cache = new Map();
  }

  /**
   * Make API call with error handling and performance tracking
   */
  private async makeAPICall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HVAC_API_KEY || ''}`,
          ...options.headers,
        },
        ...options,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      trackHVACUserAction('equipment_api_success', 'API_SUCCESS', {
        endpoint,
        duration,
        status: response.status,
      });

      return { data, status: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackHVACUserAction('equipment_api_error', 'API_ERROR', {
        endpoint,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Cache management
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
    limit = 20
  ): Promise<{ equipment: Equipment[]; total: number }> {
    const cacheKey = `equipment_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.getCachedData<{ equipment: Equipment[]; total: number }>(cacheKey);
    
    if (cached) {
      trackHVACUserAction('equipment_cache_hit', 'API_CACHE', { filters, page, limit });
      return cached;
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await this.makeAPICall<{ equipment: Equipment[]; total: number }>(
      `/api/v1/equipment?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get equipment by ID
   */
  async getEquipmentById(equipmentId: string): Promise<Equipment> {
    const cacheKey = `equipment_${equipmentId}`;
    const cached = this.getCachedData<Equipment>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<Equipment>(`/api/v1/equipment/${equipmentId}`);
    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Create new equipment
   */
  async createEquipment(equipmentData: CreateEquipmentRequest): Promise<Equipment> {
    const response = await this.makeAPICall<Equipment>('/api/v1/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    });

    // Invalidate relevant caches
    this.invalidateCache('equipment_');
    this.invalidateCache(`customer_${equipmentData.customerId}`);

    trackHVACUserAction('equipment_created', 'EQUIPMENT_MANAGEMENT', {
      equipmentId: response.data.id,
      customerId: equipmentData.customerId,
      type: equipmentData.type,
    });

    return response.data;
  }

  /**
   * Update equipment
   */
  async updateEquipment(equipmentData: UpdateEquipmentRequest): Promise<Equipment> {
    const response = await this.makeAPICall<Equipment>(`/api/v1/equipment/${equipmentData.id}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    });

    // Invalidate relevant caches
    this.invalidateCache('equipment_');
    this.invalidateCache(`equipment_${equipmentData.id}`);

    trackHVACUserAction('equipment_updated', 'EQUIPMENT_MANAGEMENT', {
      equipmentId: equipmentData.id,
      changes: Object.keys(equipmentData),
    });

    return response.data;
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(equipmentId: string): Promise<void> {
    await this.makeAPICall(`/api/v1/equipment/${equipmentId}`, {
      method: 'DELETE',
    });

    // Invalidate relevant caches
    this.invalidateCache('equipment_');
    this.invalidateCache(`equipment_${equipmentId}`);

    trackHVACUserAction('equipment_deleted', 'EQUIPMENT_MANAGEMENT', {
      equipmentId,
    });
  }

  /**
   * Get equipment maintenance history
   */
  async getMaintenanceHistory(equipmentId: string): Promise<MaintenanceRecord[]> {
    const cacheKey = `maintenance_${equipmentId}`;
    const cached = this.getCachedData<MaintenanceRecord[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<MaintenanceRecord[]>(
      `/api/v1/equipment/${equipmentId}/maintenance`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(maintenanceData: ScheduleMaintenanceRequest): Promise<MaintenanceRecord> {
    const response = await this.makeAPICall<MaintenanceRecord>('/api/v1/maintenance/schedule', {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });

    // Invalidate relevant caches
    this.invalidateCache(`maintenance_${maintenanceData.equipmentId}`);
    this.invalidateCache(`equipment_${maintenanceData.equipmentId}`);

    trackHVACUserAction('maintenance_scheduled', 'EQUIPMENT_MANAGEMENT', {
      equipmentId: maintenanceData.equipmentId,
      scheduledDate: maintenanceData.scheduledDate.toISOString(),
      type: maintenanceData.type,
      priority: maintenanceData.priority,
    });

    return response.data;
  }

  /**
   * Get equipment needing service
   */
  async getEquipmentNeedingService(): Promise<Equipment[]> {
    const cacheKey = 'equipment_needs_service';
    const cached = this.getCachedData<Equipment[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<Equipment[]>('/api/v1/equipment/needs-service');
    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get equipment with expiring warranties
   */
  async getEquipmentWithExpiringWarranties(days = 30): Promise<Equipment[]> {
    const cacheKey = `equipment_warranty_expiring_${days}`;
    const cached = this.getCachedData<Equipment[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<Equipment[]>(
      `/api/v1/equipment/warranty-expiring?days=${days}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }
}

// Export singleton instance
export const equipmentAPIService = new EquipmentAPIService();
