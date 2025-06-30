import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios'; // Added AxiosError
import { firstValueFrom } from 'rxjs';

import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import {
  HvacApiBadRequestError,
  HvacApiForbiddenError,
  HvacApiNetworkError,
  HvacApiNotFoundError,
  HvacApiServerError,
  HvacApiTimeoutError,
  HvacApiUnauthorizedError,
} from '../exceptions/hvac-api.exceptions';
import {
  CreateHvacEquipmentInput,
  HvacEquipmentFilterInput,
  UpdateHvacEquipmentInput,
  ScheduleHvacMaintenanceInput,
} from '../graphql-types/hvac-equipment.types';
import {
  CreateHvacServiceTicketInput,
  UpdateHvacServiceTicketInput,
  HvacServiceTicketFilterInput,
} from '../graphql-types/hvac-service-ticket.types';
import {
  CreateHvacContractInput,
  UpdateHvacContractInput,
  HvacContractFilterInput,
} from '../graphql-types/hvac-contract.types'; // Import for Contract

import { HvacSentryService } from './hvac-sentry.service';

// Define a more specific type for MaintenanceRecord if possible
// This should align with the structure returned by the HVAC API for maintenance records
export interface MaintenanceRecord { // Renamed from internal interface to avoid conflict if any, and made exportable
  id: string;
  equipmentId: string;
  date: Date;
  type: string; // Consider Enum: 'maintenance', 'repair', 'inspection', 'installation'
  description: string;
  technician: string;
  cost: number;
  partsUsed?: string[];
  nextServiceDate?: Date;
  photos?: string[];
  documents?: string[];
  // Add any other fields returned by the HVAC API for a maintenance record
}


export interface HvacCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  properties?: HvacProperty[];
}

export interface HvacProperty {
  id: string;
  address: string;
  propertyType: string;
  equipmentList: HvacEquipmentSummary[];
}

export interface HvacEquipmentSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface HvacServiceTicketData {
  id?: string;
  ticketNumber?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  serviceType: string;
  customerId?: string;
  technicianId?: string;
  equipmentIds?: string[];
  scheduledDate?: Date;
  estimatedCost?: number;
  serviceAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface HvacSearchQuery {
  query: string;
  filters?: {
    type?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    customerId?: string;
    equipmentId?: string;
  };
  limit?: number;
  offset?: number;
}

export interface HvacSearchResult {
  id: string;
  type: 'customer' | 'ticket' | 'equipment' | 'maintenance';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: Record<string, unknown>;
}

export interface HvacCustomerInsights {
  customerId: string;
  totalServiceTickets: number;
  averageResponseTime: number;
  preferredServiceTypes: string[];
  equipmentHealth: {
    equipmentId: string;
    healthScore: number;
    nextMaintenanceDate: Date;
  }[];
  riskFactors: string[];
  recommendations: string[];
}

export interface HvacApiPerformanceMetrics {
  responseTime: number;
  cacheHit: boolean;
  retryCount: number;
  endpoint: string;
}

@Injectable()
export class HvacApiIntegrationService {
  private readonly logger = new Logger(HvacApiIntegrationService.name);
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacSentryService: HvacSentryService,
  ) {}

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';

    return `hvac_api_${endpoint}_${paramString}`;
  }

  private getCachedData<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  private setCachedData(cacheKey: string, data: unknown): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  private async performOptimizedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>,
    useCache = true,
  ): Promise<{ data: T; metrics: HvacApiPerformanceMetrics }> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(endpoint, { ...params, data });
    let retryCount = 0;

    // Check cache first for GET requests
    if (method === 'GET' && useCache) {
      const cachedData = this.getCachedData<T>(cacheKey);

      if (cachedData) {
        return {
          data: cachedData,
          metrics: {
            responseTime: Date.now() - startTime,
            cacheHit: true,
            retryCount: 0,
            endpoint,
          },
        };
      }
    }

    return this.hvacSentryService.monitorHVACApiOperation(
      `${method.toLowerCase()}_${endpoint}`,
      endpoint,
      async () => {
        while (retryCount <= this.MAX_RETRIES) {
          try {
            const url = this.getApiUrl(endpoint);
            const config = {
              headers: this.getApiHeaders(),
              timeout: this.REQUEST_TIMEOUT,
              params,
            };

            let response: AxiosResponse<T>;

            switch (method) {
              case 'GET':
                response = await firstValueFrom(
                  this.httpService.get(url, config),
                );
                break;
              case 'POST':
                response = await firstValueFrom(
                  this.httpService.post(url, data, config),
                );
                break;
              case 'PUT':
                response = await firstValueFrom(
                  this.httpService.put(url, data, config),
                );
                break;
              case 'DELETE':
                response = await firstValueFrom(
                  this.httpService.delete(url, config),
                );
                break;
            }

            // Cache successful GET responses
            if (method === 'GET' && useCache) {
              this.setCachedData(cacheKey, response.data);
            }

            return {
              data: response.data,
              metrics: {
                responseTime: Date.now() - startTime,
                cacheHit: false,
                retryCount,
                endpoint,
              },
            };
          } catch (error) {
            retryCount++;
            const errorDetails = error instanceof AxiosError ? error.response?.data : error.message;

            if (retryCount > this.MAX_RETRIES) {
              this.logger.error(
                `Failed to ${method} ${endpoint} after ${retryCount} retries. Last error: ${error.message}`,
                error.stack,
                errorDetails,
              );
              // Throw specific error based on last attempt's error
              if (error instanceof AxiosError) {
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                  throw new HvacApiTimeoutError(errorDetails);
                }
                if (error.response) {
                  switch (error.response.status) {
                    case 400:
                      throw new HvacApiBadRequestError(error.response.data?.message || 'Bad request', errorDetails);
                    case 401:
                      throw new HvacApiUnauthorizedError(errorDetails);
                    case 403:
                      throw new HvacApiForbiddenError(errorDetails);
                    case 404:
                      throw new HvacApiNotFoundError(endpoint, errorDetails);
                    default:
                      throw new HvacApiServerError(
                        error.response.data?.message || `HVAC API request failed with status ${error.response.status}`,
                        error.response.status,
                        errorDetails
                      );
                  }
                } else if (error.request) {
                  // The request was made but no response was received
                  throw new HvacApiNetworkError(`No response received from HVAC API for ${endpoint}`, errorDetails);
                }
              }
              // Fallback for non-Axios errors or unhandled Axios errors
              throw new HvacApiNetworkError(`Failed to ${method} ${endpoint}: ${error.message}`, errorDetails);
            }

            this.logger.warn(
              `Attempt ${retryCount} failed for ${method} ${endpoint}. Retrying in ${Math.pow(2, retryCount)}s. Error: ${error.message}`,
              errorDetails
            );
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;

            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        throw new HvacApiNetworkError(`Max retries exceeded for ${method} ${endpoint} after ${this.MAX_RETRIES} attempts.`);
      },
    );
  }

  private getApiHeaders() {
    const config = this.hvacConfigService.getHvacApiConfig();

    return {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private getApiUrl(endpoint: string): string {
    const config = this.hvacConfigService.getHvacApiConfig();

    return `${config.url}/api/${config.version}${endpoint}`;
  }

  // Customer Management
  async getCustomers(limit = 50, offset = 0): Promise<HvacCustomer[]> {
    const result = await this.performOptimizedRequest<{ customers: HvacCustomer[] }>(
      'GET',
      '/customers',
      undefined,
      { limit, offset }
    );
    this.logger.debug(
      `Fetched ${result.data.customers?.length || 0} customers`,
      { metrics: result.metrics, limit, offset },
    );
    return result.data.customers || [];
  }

  async getCustomerById(customerId: string): Promise<HvacCustomer | null> {
    try {
      const url = this.getApiUrl(`/customers/${customerId}`);
      // This method now uses performOptimizedRequest, which handles errors and retries.
      // The specific error handling for 404 (returning null) should be done in the calling service or resolver if needed.
      const result = await this.performOptimizedRequest<HvacCustomer>(
        'GET',
        `/customers/${customerId}`,
      );
      return result.data;
    } catch (error) {
      // If performOptimizedRequest throws HvacApiNotFoundError, it will be propagated.
      // Other errors will also be propagated as specific HvacApi exceptions.
      this.logger.error(
        `Failed to fetch customer ${customerId} from HVAC API via performOptimizedRequest`,
        error.stack,
        error.details,
      );
      if (error instanceof HvacApiNotFoundError) {
        return null; // Specific handling for 404 to return null
      }
      throw error; // Re-throw other HVAC API errors
    }
  }

  async createCustomer(
    customerData: Partial<HvacCustomer>,
  ): Promise<HvacCustomer> {
    // This method now uses performOptimizedRequest
    const result = await this.performOptimizedRequest<HvacCustomer>(
      'POST',
      '/customers',
      customerData,
    );
    // TODO: Invalidate cache for getCustomers
    this.clearCacheKeySubstring('/customers');
    return result.data;
  }

  // Service Ticket Management
  async getServiceTickets(
    limit = 50,
    offset = 0,
  ): Promise<HvacServiceTicketData[]> {
    const result = await this.performOptimizedRequest<{ tickets: HvacServiceTicketData[] }>(
      'GET',
      '/tickets',
      undefined,
      { limit, offset },
    );
    return result.data.tickets || [];
  }

  async getServiceTicketById(
    ticketId: string,
  ): Promise<HvacServiceTicketData | null> {
    try {
      const result = await this.performOptimizedRequest<HvacServiceTicketData>(
        'GET',
        `/tickets/${ticketId}`,
      );
      return result.data;
    } catch (error) {
      if (error instanceof HvacApiNotFoundError) {
        return null;
      }
      this.logger.error(
        `Failed to fetch service ticket ${ticketId} from HVAC API`,
        error.stack,
        error.details,
      );
      throw error;
    }
  }

  async createServiceTicket(
    ticketData: HvacServiceTicketData,
  ): Promise<HvacServiceTicketData> {
    const result = await this.performOptimizedRequest<HvacServiceTicketData>(
      'POST',
      '/tickets',
      ticketData,
    );
    this.clearCacheKeySubstring('/tickets');
    return result.data;
  }

  async updateServiceTicket(
    ticketId: string,
    ticketData: Partial<HvacServiceTicketData>,
  ): Promise<HvacServiceTicketData> {
    const result = await this.performOptimizedRequest<HvacServiceTicketData>(
      'PUT',
      `/tickets/${ticketId}`,
      ticketData,
    );
    this.clearCacheKeySubstring(`/tickets/${ticketId}`);
    this.clearCacheKeySubstring('/tickets'); // Also clear list if applicable
    return result.data;
  }

  // Equipment Management
  async getEquipment(
    filters?: HvacEquipmentFilterInput,
    limit = 50,
    offset = 0,
  ): Promise<{ equipment: HvacEquipmentSummary[]; total: number }> {
    const queryParams: Record<string, string | number | boolean> = {
        limit,
        offset,
    };

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      });
    }

    this.logger.debug(`Fetching equipment with query params: ${JSON.stringify(queryParams)}`);

    interface HvacApiEquipmentResponse {
      data?: HvacEquipmentSummary[];
      results?: HvacEquipmentSummary[];
      equipment?: HvacEquipmentSummary[];
      totalCount?: number;
      total?: number;
      total_items?: number;
      meta?: {
        totalCount?: number;
        totalItems?: number;
      };
    }

    const result = await this.performOptimizedRequest<HvacApiEquipmentResponse>(
      'GET',
      '/equipment',
      undefined,
      queryParams,
    );

    const responseData = result.data;
    let equipmentList: HvacEquipmentSummary[] = [];
    let totalItems = 0;

    if (responseData) {
      if (responseData.equipment) {
        equipmentList = responseData.equipment;
      } else if (responseData.data) {
        equipmentList = responseData.data;
      } else if (responseData.results) {
        equipmentList = responseData.results;
      }

      if (responseData.totalCount !== undefined) {
        totalItems = responseData.totalCount;
      } else if (responseData.total !== undefined) {
        totalItems = responseData.total;
      } else if (responseData.total_items !== undefined) {
        totalItems = responseData.total_items;
      } else if (responseData.meta?.totalCount !== undefined) {
        totalItems = responseData.meta.totalCount;
      } else if (responseData.meta?.totalItems !== undefined) {
        totalItems = responseData.meta.totalItems;
      } else {
        totalItems = equipmentList.length;
        if (limit < totalItems || offset > 0) {
             this.logger.warn('HVAC API did not return a total count for paginated equipment. Total count might be inaccurate.');
        }
      }
    }

    this.logger.debug(`Fetched ${equipmentList.length} equipment items. Reported total by API: ${totalItems}`);
    return { equipment: equipmentList, total: totalItems };
  }

  async getEquipmentById(
    equipmentId: string,
  ): Promise<HvacEquipmentSummary | null> {
    try {
      const result = await this.performOptimizedRequest<HvacEquipmentSummary>(
        'GET',
        `/equipment/${equipmentId}`,
      );
      return result.data;
    } catch (error) {
      if (error instanceof HvacApiNotFoundError) {
        this.logger.warn(`Equipment with ID ${equipmentId} not found in HVAC API.`);
        return null;
      }
      this.logger.error(
        `Failed to fetch equipment ${equipmentId} from HVAC API`,
        error.stack,
        error.details,
      );
      throw error;
    }
  }

  async createActualEquipment(input: CreateHvacEquipmentInput): Promise<HvacEquipmentSummary> {
    this.logger.log(`Creating new equipment in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<HvacEquipmentSummary>(
      'POST',
      '/equipment',
      input,
    );
    this.clearCacheKeySubstring('/equipment');
    this.logger.log(`Successfully created equipment, ID: ${result.data.id}`);
    return result.data;
  }

  async updateActualEquipment(id: string, input: Partial<UpdateHvacEquipmentInput>): Promise<HvacEquipmentSummary> {
    this.logger.log(`Updating equipment ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    // Remove id from input object if it exists, as it's part of the URL path
    const payload = { ...input };
    delete payload.id;

    const result = await this.performOptimizedRequest<HvacEquipmentSummary>(
      'PUT',
      `/equipment/${id}`,
      payload,
    );
    this.clearCacheKeySubstring(`/equipment/${id}`);
    this.clearCacheKeySubstring('/equipment');
    this.logger.log(`Successfully updated equipment, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualEquipment(id: string): Promise<boolean> {
    this.logger.log(`Deleting equipment ID ${id} from HVAC API.`);
    await this.performOptimizedRequest(
      'DELETE',
      `/equipment/${id}`,
    );
    this.clearCacheKeySubstring(`/equipment/${id}`);
    this.clearCacheKeySubstring('/equipment');
    this.logger.log(`Successfully deleted equipment ID: ${id}`);
    return true;
  }

  async getMaintenanceHistoryForEquipment(equipmentId: string): Promise<MaintenanceRecord[]> {
    this.logger.debug(`Fetching maintenance history for equipment ID: ${equipmentId}`);
    // Assuming the API returns an object with a 'records' array or similar
    const result = await this.performOptimizedRequest<{ records: MaintenanceRecord[] }>(
      'GET',
      `/equipment/${equipmentId}/maintenance`,
    );
    return result.data.records || [];
  }

  async scheduleActualMaintenance(input: ScheduleHvacMaintenanceInput): Promise<MaintenanceRecord> {
    this.logger.log(`Scheduling maintenance in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<MaintenanceRecord>(
      'POST',
      '/maintenance/schedule',
      input,
    );
    this.clearCacheKeySubstring(`/equipment/${input.equipmentId}/maintenance`);
    this.clearCacheKeySubstring(`/equipment/${input.equipmentId}`);
    this.logger.log(`Successfully scheduled maintenance, ID: ${result.data.id}`);
    return result.data;
  }

  async fetchEquipmentNeedingService(): Promise<HvacEquipmentSummary[]> {
    this.logger.debug('Fetching equipment needing service from HVAC API.');
    const result = await this.performOptimizedRequest<{ equipment: HvacEquipmentSummary[] }>(
      'GET',
      '/equipment/needs-service',
    );
    return result.data.equipment || [];
  }

  async fetchEquipmentWithExpiringWarranties(days: number): Promise<HvacEquipmentSummary[]> {
    this.logger.debug(`Fetching equipment with warranties expiring in ${days} days from HVAC API.`);
    const result = await this.performOptimizedRequest<{ equipment: HvacEquipmentSummary[] }>(
      'GET',
      '/equipment/warranty-expiring',
      undefined,
      { days }
    );
    return result.data.equipment || [];
  }

  // Semantic Search Integration
  async performSemanticSearch(
    searchQuery: HvacSearchQuery,
  ): Promise<HvacSearchResult[]> {
    // Semantic search might not be suitable for standard caching if results are highly dynamic
    // For now, using performOptimizedRequest but with useCache = false (or a very short TTL if implemented)
    const result = await this.performOptimizedRequest<{ results: HvacSearchResult[] }>(
      'POST',
      '/search',
      searchQuery,
      undefined,
      false, // Disable cache for search by default or use a very short TTL
    );
    return result.data.results || [];
  }

  // AI Insights Integration
  async getCustomerInsights(customerId: string): Promise<HvacCustomerInsights> { // Renamed from getCustomerInsights to getCustomerInsightDetails for clarity if needed
    // Insights might be good candidates for caching
    const result = await this.performOptimizedRequest<HvacCustomerInsights>(
      'GET',
      `/customers/${customerId}/insights`,
      undefined,
      undefined,
      true, // Enable cache for insights
    );

    this.logger.debug(`Fetched insights for customer ${customerId}`, {
      metrics: result.metrics,
      customerId,
    });
    return result.data;
  }

  // Health Check
  async checkApiHealth(): Promise<boolean> {
    try {
      const config = this.hvacConfigService.getHvacApiConfig();
      const url = `${config.url}/health`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
          timeout: 5000,
        }),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error('HVAC API health check failed', error);

      return false;
    }
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear();
    this.logger.log('HVAC API cache cleared');
  }

  clearCacheKey(cacheKey: string): void {
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.logger.log(`HVAC API cache key cleared: ${cacheKey}`);
    }
  }

  clearCacheKeySubstring(substring: string): void {
    let clearedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(substring)) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    if (clearedCount > 0) {
      this.logger.log(`Cleared ${clearedCount} HVAC API cache keys containing: ${substring}`);
    }
  }


  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Performance Monitoring
  async getPerformanceMetrics(): Promise<{
    cacheHitRate: number;
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
  }> {
    // This would be implemented with actual metrics collection
    // For now, return placeholder data
    return {
      cacheHitRate: 0.75, // 75% cache hit rate
      averageResponseTime: 150, // 150ms average
      totalRequests: 1000,
      errorRate: 0.02, // 2% error rate
    };
  }

  // Communication Management - Methods to be implemented based on CommunicationAPIService.ts on frontend

  // Corresponds to getCommunications in frontend
  async getCommunicationsList(
    filters?: any, // TODO: Define HvacCommunicationFilterInput or use from GraphQL types
    limit = 50,
    offset = 0,
  ): Promise<{ communications: any[]; total: number }> { // TODO: Use HvacCommunication type
    const queryParams: Record<string, string | number | boolean> = { limit, offset };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      });
    }
    this.logger.debug(`Fetching communications list with query params: ${JSON.stringify(queryParams)}`);
    // Define expected response structure from HVAC API for communications list
    interface HvacApiCommunicationListResponse {
      data?: any[]; // Replace 'any' with a specific Communication interface for HVAC API
      totalCount?: number;
      // Add other possible structures for total count
    }
    const result = await this.performOptimizedRequest<HvacApiCommunicationListResponse>(
      'GET',
      '/communications',
      undefined,
      queryParams,
    );
    const commList = result.data.data || [];
    const total = result.data.totalCount ?? commList.length;
    this.logger.debug(`Fetched ${commList.length} communications, total available: ${total}`);
    return { communications: commList, total };
  }

  // Corresponds to getCommunicationById
  async getCommunicationDetailsById(id: string): Promise<any | null> { // TODO: Use HvacCommunication type
    this.logger.debug(`Fetching communication details for ID: ${id}`);
    try {
      const result = await this.performOptimizedRequest<any>( // Replace 'any'
        'GET',
        `/communications/${id}`,
      );
      return result.data;
    } catch (error) {
      if (error instanceof HvacApiNotFoundError) {
        this.logger.warn(`Communication with ID ${id} not found in HVAC API.`);
        return null;
      }
      throw error;
    }
  }

  // Corresponds to createCommunication
  async createActualCommunicationRecord(input: any): Promise<any> { // TODO: Use CreateHvacCommunicationInput and return HvacCommunication
    this.logger.log(`Creating new communication in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<any>( // Replace 'any'
      'POST',
      '/communications',
      input,
    );
    this.clearCacheKeySubstring('/communications');
    // Also consider invalidating customer-specific communication caches if applicable
    if (input.customerId) {
        this.clearCacheKeySubstring(`/customers/${input.customerId}/communications`); // Example
    }
    this.logger.log(`Successfully created communication, ID: ${result.data.id}`);
    return result.data;
  }

  // Corresponds to getCommunicationStats
  async getCommunicationStatistics(customerId: string): Promise<any | null> { // TODO: Use HvacCommunicationStats type
      this.logger.debug(`Fetching communication statistics for customer ID: ${customerId}`);
      // Define expected response structure from HVAC API for stats
      interface HvacApiCommunicationStatsResponse {
          // Define fields based on HvacCommunicationStatsType
          total?: number;
          // ... other stats fields
      }
      try {
        const result = await this.performOptimizedRequest<HvacApiCommunicationStatsResponse>(
            'GET',
            `/communications/stats/${customerId}`, // Assuming this endpoint exists
        );
        return result.data;
      } catch (error) {
        this.logger.error(`Error fetching communication stats for customer ${customerId}:`, error.message);
        if (error instanceof HvacApiNotFoundError) return null;
        throw error;
      }
  }

  // Corresponds to processEmailWithAI
  async processEmailContentWithAI(emailContent: string, customerId: string): Promise<any | null> { // TODO: Use HvacAIInsights type
      this.logger.log(`Processing email with AI for customer ID: ${customerId}`);
      // Define expected response structure from HVAC API for AI insights
      interface HvacApiAIInsightsResponse {
          // Define fields based on HvacAIInsightsType
          sentiment?: string;
          // ... other insights fields
      }
      try {
        const result = await this.performOptimizedRequest<HvacApiAIInsightsResponse>(
            'POST',
            '/communications/ai-process', // Assuming this endpoint exists
            { content: emailContent, customerId, language: 'pl' } // Body for the request
        );
        return result.data;
      } catch (error) {
        this.logger.error(`Error processing email with AI for customer ${customerId}:`, error.message);
        throw error;
      }
  }

  // Corresponds to getCommunicationTimeline
  async getCommunicationTimelineForCustomer(customerId: string, limit = 50): Promise<any[]> { // TODO: Use HvacCommunication[]
      this.logger.debug(`Fetching communication timeline for customer ID: ${customerId}, limit: ${limit}`);
      interface HvacApiCommunicationTimelineResponse {
          data?: any[]; // Replace 'any' with specific Communication interface
      }
      try {
        const result = await this.performOptimizedRequest<HvacApiCommunicationTimelineResponse>(
            'GET',
            `/communications/timeline/${customerId}`,
            undefined,
            { limit }
        );
        return result.data.data || [];
      } catch (error) {
        this.logger.error(`Error fetching communication timeline for customer ${customerId}:`, error.message);
        throw error;
      }
  }

  // Corresponds to searchCommunications
  async searchCustomerCommunications(query: string, customerId?: string, limit = 20): Promise<any[]> { // TODO: Use HvacCommunication[]
      this.logger.debug(`Searching communications with query "${query}", customerId: ${customerId}, limit: ${limit}`);
      interface HvacApiCommunicationSearchResponse {
          results?: any[]; // Replace 'any' with specific Communication interface
      }
      try {
        const queryParams: Record<string, string | number> = { q: query, limit };
        if (customerId) queryParams.customerId = customerId;

        const result = await this.performOptimizedRequest<HvacApiCommunicationSearchResponse>(
            'GET',
            `/communications/search`,
            undefined,
            queryParams
        );
        return result.data.results || [];
      } catch (error) {
        this.logger.error(`Error searching communications with query "${query}":`, error.message);
        throw error;
      }
  }

  // Corresponds to updateCommunicationStatus
  async updateStatusForCommunication(id: string, status: string): Promise<any | null> { // TODO: Use HvacCommunication type and HvacCommunicationStatusEnum
      this.logger.log(`Updating status for communication ID: ${id} to ${status}`);
      try {
        const result = await this.performOptimizedRequest<any>( // Replace 'any'
            'PATCH', // Or PUT, depending on API design
            `/communications/${id}/status`,
            { status } // Body for the request
        );
        this.clearCacheKeySubstring(`/communications/${id}`);
        this.clearCacheKeySubstring('/communications'); // Invalidate list
        return result.data;
      } catch (error) {
        this.logger.error(`Error updating status for communication ${id}:`, error.message);
        if (error instanceof HvacApiNotFoundError) return null;
        throw error;
      }
  }

  // ServiceTicket Management - Methods to be implemented

  async getServiceTicketsList(
    filters?: HvacServiceTicketFilterInput,
    limit = 50,
    offset = 0,
  ): Promise<{ tickets: HvacServiceTicketData[]; total: number }> {
    const queryParams: Record<string, string | number | boolean> = { limit, offset };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) { // Handle array filters (e.g. status, priority)
            queryParams[key] = value.join(',');
          } else {
            queryParams[key] = String(value);
          }
        }
      });
    }
    this.logger.debug(`Fetching service tickets list with query params: ${JSON.stringify(queryParams)}`);

    interface HvacApiServiceTicketListResponse {
      data?: HvacServiceTicketData[];
      totalCount?: number;
      // Add other possible structures
    }
    const result = await this.performOptimizedRequest<HvacApiServiceTicketListResponse>(
      'GET',
      '/tickets', // Assuming endpoint for service tickets
      undefined,
      queryParams,
    );
    const ticketList = result.data.data || [];
    const total = result.data.totalCount ?? ticketList.length;
    this.logger.debug(`Fetched ${ticketList.length} service tickets, total available: ${total}`);
    return { tickets: ticketList, total };
  }

  async getServiceTicketDetailsById(id: string): Promise<HvacServiceTicketData | null> {
    this.logger.debug(`Fetching service ticket details for ID: ${id}`);
    try {
      const result = await this.performOptimizedRequest<HvacServiceTicketData>(
        'GET',
        `/tickets/${id}`,
      );
      return result.data;
    } catch (error) {
      if (error instanceof HvacApiNotFoundError) {
        this.logger.warn(`Service ticket with ID ${id} not found in HVAC API.`);
        return null;
      }
      throw error;
    }
  }

  async createActualServiceTicketRecord(input: CreateHvacServiceTicketInput): Promise<HvacServiceTicketData> {
    this.logger.log(`Creating new service ticket in HVAC API with data: ${JSON.stringify(input)}`);
    // Map CreateHvacServiceTicketInput to the structure expected by HVAC API if different
    // For now, assuming they are compatible or HvacServiceTicketData is a superset for creation
    const result = await this.performOptimizedRequest<HvacServiceTicketData>(
      'POST',
      '/tickets',
      input,
    );
    this.clearCacheKeySubstring('/tickets');
    if (input.customerId) {
      this.clearCacheKeySubstring(`/customers/${input.customerId}/tickets`); // Example specific invalidation
    }
    this.logger.log(`Successfully created service ticket, ID: ${result.data.id}`);
    return result.data;
  }

  async updateActualServiceTicketRecord(id: string, input: UpdateHvacServiceTicketInput): Promise<HvacServiceTicketData> {
    this.logger.log(`Updating service ticket ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    const payload = { ...input };
    delete payload.id; // ID is in URL

    const result = await this.performOptimizedRequest<HvacServiceTicketData>(
      'PUT', // Or PATCH
      `/tickets/${id}`,
      payload,
    );
    this.clearCacheKeySubstring(`/tickets/${id}`);
    this.clearCacheKeySubstring('/tickets');
    this.logger.log(`Successfully updated service ticket, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualServiceTicketRecord(id: string): Promise<boolean> {
    this.logger.log(`Deleting service ticket ID ${id} from HVAC API.`);
    await this.performOptimizedRequest(
      'DELETE',
      `/tickets/${id}`,
    );
    this.clearCacheKeySubstring(`/tickets/${id}`);
    this.clearCacheKeySubstring('/tickets');
    this.logger.log(`Successfully deleted service ticket ID: ${id}`);
    return true;
  }

  // Contract Management - Methods to be implemented

  async getContractsList(
    filters?: HvacContractFilterInput,
    limit = 50,
    offset = 0,
  ): Promise<{ contracts: any[]; total: number }> { // TODO: Replace 'any' with HvacContractData or similar interface
    const queryParams: Record<string, string | number | boolean> = { limit, offset };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            queryParams[key] = value.join(',');
          } else if (value instanceof Date) {
            queryParams[key] = value.toISOString();
          } else {
            queryParams[key] = String(value);
          }
        }
      });
    }
    this.logger.debug(`Fetching contracts list with query params: ${JSON.stringify(queryParams)}`);

    interface HvacApiContractListResponse { // Define expected response structure
      data?: any[]; // TODO: Replace 'any' with specific Contract interface for HVAC API
      totalCount?: number;
    }
    const result = await this.performOptimizedRequest<HvacApiContractListResponse>(
      'GET',
      '/contracts', // Assuming endpoint for contracts
      undefined,
      queryParams,
    );
    const contractList = result.data.data || [];
    const total = result.data.totalCount ?? contractList.length;
    this.logger.debug(`Fetched ${contractList.length} contracts, total available: ${total}`);
    return { contracts: contractList, total };
  }

  async getContractDetailsById(id: string): Promise<any | null> { // TODO: Replace 'any'
    this.logger.debug(`Fetching contract details for ID: ${id}`);
    try {
      const result = await this.performOptimizedRequest<any>( // Replace 'any'
        'GET',
        `/contracts/${id}`,
      );
      return result.data;
    } catch (error) {
      if (error instanceof HvacApiNotFoundError) {
        this.logger.warn(`Contract with ID ${id} not found in HVAC API.`);
        return null;
      }
      throw error;
    }
  }

  async createActualContractRecord(input: CreateHvacContractInput): Promise<any> { // TODO: Replace 'any'
    this.logger.log(`Creating new contract in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<any>( // Replace 'any'
      'POST',
      '/contracts',
      input,
    );
    this.clearCacheKeySubstring('/contracts');
    if (input.customerId) {
      this.clearCacheKeySubstring(`/customers/${input.customerId}/contracts`);
    }
    this.logger.log(`Successfully created contract, ID: ${result.data.id}`);
    return result.data;
  }

  async updateActualContractRecord(id: string, input: UpdateHvacContractInput): Promise<any> { // TODO: Replace 'any'
    this.logger.log(`Updating contract ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    const payload = { ...input };
    delete payload.id;

    const result = await this.performOptimizedRequest<any>( // Replace 'any'
      'PUT',
      `/contracts/${id}`,
      payload,
    );
    this.clearCacheKeySubstring(`/contracts/${id}`);
    this.clearCacheKeySubstring('/contracts');
    this.logger.log(`Successfully updated contract, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualContractRecord(id: string): Promise<boolean> {
    this.logger.log(`Deleting contract ID ${id} from HVAC API.`);
    await this.performOptimizedRequest(
      'DELETE',
      `/contracts/${id}`,
    );
    this.clearCacheKeySubstring(`/contracts/${id}`);
    this.clearCacheKeySubstring('/contracts');
    this.logger.log(`Successfully deleted contract ID: ${id}`);
    return true;
  }
}
