import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios'; // Added AxiosError
import { firstValueFrom } from 'rxjs';

import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
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
  HvacContractType, // Assuming this is the main object type for a contract
} from '../graphql-types/hvac-contract.types';

import {
  HvacCommunicationType,
  CreateHvacCommunicationInput,
  // UpdateHvacCommunicationInput, // Assuming an update input type exists
  HvacCommunicationFilterInput,
  HvacCommunicationStatsType,
  HvacAIInsightsType,
} from '../graphql-types/hvac-communication.types';

import {
  HvacQuote,
  CreateHvacQuoteInput,
  UpdateHvacQuoteInput,
  HvacQuoteFilterInput,
} from '../graphql-types/hvac-quote.types';

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
  customerId?: string; // Added customerId
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
  private readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  // Metrics Collection
  private totalApiRequests = 0;
  private totalCacheHits = 0;
  private totalApiErrors = 0;
  private apiResponseTimes: number[] = [];


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
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', // Added PATCH
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>,
    useCache = true,
  ): Promise<{ data: T; metrics: HvacApiPerformanceMetrics }> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(endpoint, { ...params, data });
    let retryCount = 0;
    this.totalApiRequests++;

    // Check cache first for GET requests
    if (method === 'GET' && useCache) {
      const cachedData = this.getCachedData<T>(cacheKey);

      if (cachedData) {
        this.totalCacheHits++;
        const responseTime = Date.now() - startTime;
        // this.apiResponseTimes.push(responseTime); // Cache hits are also responses
        return {
          data: cachedData,
          metrics: {
            responseTime,
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
            const requestStartTime = Date.now(); // For measuring actual API call time
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
              case 'PATCH': // Added PATCH case
                response = await firstValueFrom(
                  this.httpService.patch(url, data, config),
                );
                break;
            }

            // Cache successful GET responses
            if (method === 'GET' && useCache) {
              this.setCachedData(cacheKey, response.data);
            }
            const responseTime = Date.now() - requestStartTime;
            this.apiResponseTimes.push(responseTime);

            return {
              data: response.data,
              metrics: {
                responseTime: Date.now() - startTime, // Overall time including cache check
                cacheHit: false,
                retryCount,
                endpoint,
              },
            };
          } catch (error) {
            retryCount++;
            const errorDetails = error instanceof AxiosError ? error.response?.data : error.message;

            if (retryCount > this.MAX_RETRIES) {
              this.totalApiErrors++;
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
  async getCustomers(limit = 50, offset = 0): Promise<{ customers: HvacCustomer[]; total: number }> {
    interface HvacApiCustomerListResponse {
      data?: HvacCustomer[];
      customers?: HvacCustomer[]; // Allow for 'customers' key as well
      totalCount?: number;
      total?: number;
    }

    const result = await this.performOptimizedRequest<HvacApiCustomerListResponse>(
      'GET',
      '/customers',
      undefined,
      { limit, offset }
    );

    const customerList = result.data.customers || result.data.data || [];
    const total = result.data.totalCount ?? result.data.total ?? customerList.length; // Fallback to list length if total not provided

    this.logger.debug(
      `Fetched ${customerList.length} customers, total available: ${total}`,
      { metrics: result.metrics, limit, offset },
    );
    return { customers: customerList, total };
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
    this.clearCacheKeySubstring('/customers'); // Clears any list like /customers?limit=x&offset=y
    // No need to clear individual customer cache as this is a create operation
    return result.data;
  }

  async updateActualCustomer(customerId: string, customerData: Partial<HvacCustomer>): Promise<HvacCustomer> {
    this.logger.log(`Updating customer ID ${customerId} in HVAC API with data: ${JSON.stringify(customerData)}`);
    const result = await this.performOptimizedRequest<HvacCustomer>(
      'PUT',
      `/customers/${customerId}`,
      customerData,
    );
    this.clearCacheKeySubstring(`/customers/${customerId}`); // Clear specific customer cache
    this.clearCacheKeySubstring('/customers'); // Clear list cache
    this.logger.log(`Successfully updated customer, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualCustomer(customerId: string): Promise<boolean> {
    this.logger.log(`Deleting customer ID ${customerId} from HVAC API.`);
    await this.performOptimizedRequest(
      'DELETE',
      `/customers/${customerId}`,
    );
    this.clearCacheKeySubstring(`/customers/${customerId}`); // Clear specific customer cache
    this.clearCacheKeySubstring('/customers'); // Clear list cache
    this.logger.log(`Successfully deleted customer ID: ${customerId}`);
    return true;
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
    this.clearCacheKeySubstring('/tickets'); // Clears any list like /tickets?filter=x
    // If tickets are cached by customerId, clear that too if customerId is in ticketData
    if (ticketData.customerId) {
      this.clearCacheKeySubstring(`/customers/${ticketData.customerId}/tickets`);
    }
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
    this.clearCacheKeySubstring(`/tickets/${ticketId}`); // Clear specific ticket
    this.clearCacheKeySubstring('/tickets'); // Clear list
    // If tickets are cached by customerId, clear that too
    if (ticketData.customerId || result.data.customerId) {
      const customerId = ticketData.customerId || result.data.customerId;
      this.clearCacheKeySubstring(`/customers/${customerId}/tickets`);
    }
    return result.data;
  }

  // deleteServiceTicket is missing, but if added, should follow similar cache clearing.
  // async deleteServiceTicket(ticketId: string): Promise<boolean> {
  //   const ticket = await this.getServiceTicketById(ticketId); // Fetch to get customerId if needed for cache
  //   await this.performOptimizedRequest('DELETE', `/tickets/${ticketId}`);
  //   this.clearCacheKeySubstring(`/tickets/${ticketId}`);
  //   this.clearCacheKeySubstring('/tickets');
  //   if (ticket?.customerId) {
  //     this.clearCacheKeySubstring(`/customers/${ticket.customerId}/tickets`);
  //   }
  //   return true;
  // }

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
    this.clearCacheKeySubstring('/equipment'); // Clears list caches like /equipment?filter=x
    // If equipment is cached by customerId, clear that too
    if (input.customerId) {
        this.clearCacheKeySubstring(`/customers/${input.customerId}/equipment`);
    }
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
    this.clearCacheKeySubstring(`/equipment/${id}`); // Clear specific equipment
    this.clearCacheKeySubstring('/equipment'); // Clear list
    // If equipment is cached by customerId, clear that too
    // This might need fetching the equipment first if customerId is not in payload
    if (input.customerId || result.data.customerId) {
        const customerId = input.customerId || result.data.customerId;
        this.clearCacheKeySubstring(`/customers/${customerId}/equipment`);
    }
    this.logger.log(`Successfully updated equipment, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualEquipment(id: string): Promise<boolean> {
    this.logger.log(`Deleting equipment ID ${id} from HVAC API.`);
    const equipment = await this.getEquipmentById(id); // Fetch to get customerId if needed for cache

    await this.performOptimizedRequest(
      'DELETE',
      `/equipment/${id}`,
    );
    this.clearCacheKeySubstring(`/equipment/${id}`);
    this.clearCacheKeySubstring('/equipment');
    if (equipment?.customerId) { // Assuming HvacEquipmentSummary has customerId
        this.clearCacheKeySubstring(`/customers/${equipment.customerId}/equipment`);
    }
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
      '/maintenance/schedule', // Assuming this creates a new maintenance record
      input,
    );
    // Clear maintenance history for the specific equipment
    this.clearCacheKeySubstring(`/equipment/${input.equipmentId}/maintenance`);
    // Potentially clear cache for the equipment itself if its status or next maintenance date changes
    this.clearCacheKeySubstring(`/equipment/${input.equipmentId}`);
    // Potentially clear list of equipment if this action affects list views (e.g. needs-service)
    this.clearCacheKeySubstring('/equipment/needs-service');
    this.clearCacheKeySubstring('/equipment');


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
      const url = `${config.url}/health`; // Ensure this is the correct health endpoint for the external HVAC API
      const response = await firstValueFrom(
        this.httpService.get(url, {
          // headers: this.getApiHeaders(), // Health checks might not require auth, depends on the API
          timeout: 5000, // Keep a reasonable timeout for health checks
        }),
      );
      return response.status === 200;
    } catch (error) {
      // Log the error for diagnostics but return false to indicate unhealthy
      if (error instanceof AxiosError) {
        this.logger.error(
            `HVAC API health check failed: ${error.message}`,
            { status: error.response?.status, data: error.response?.data, code: error.code }
        );
      } else {
        this.logger.error(`HVAC API health check failed: ${error.message}`, error.stack);
      }
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
    const totalRequests = this.totalApiRequests;
    const cacheHitRate = totalRequests > 0 ? this.totalCacheHits / totalRequests : 0;
    const errorRate = totalRequests > 0 ? this.totalApiErrors / totalRequests : 0;

    let averageResponseTime = 0;
    if (this.apiResponseTimes.length > 0) {
      averageResponseTime = this.apiResponseTimes.reduce((sum, time) => sum + time, 0) / this.apiResponseTimes.length;
    }

    // Optionally, cap the size of apiResponseTimes to avoid memory issues over long periods
    if (this.apiResponseTimes.length > 10000) { // Keep last 10k response times
        this.apiResponseTimes = this.apiResponseTimes.slice(this.apiResponseTimes.length - 10000);
    }

    return {
      cacheHitRate,
      averageResponseTime,
      totalRequests,
      errorRate,
    };
  }

  // Communication Management
  async getCommunicationsList(
    filters?: HvacCommunicationFilterInput,
    limit = 50,
    offset = 0,
  ): Promise<{ communications: HvacCommunicationType[]; total: number }> {
    const queryParams: Record<string, string | number | boolean | string[]> = { limit, offset };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = Array.isArray(value) ? value.join(',') : String(value);
        }
      });
    }
    this.logger.debug(`Fetching communications list with query params: ${JSON.stringify(queryParams)}`);

    interface HvacApiCommunicationListResponse {
      data?: HvacCommunicationType[];
      totalCount?: number;
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

  async getCommunicationDetailsById(id: string): Promise<HvacCommunicationType | null> {
    this.logger.debug(`Fetching communication details for ID: ${id}`);
    try {
      const result = await this.performOptimizedRequest<HvacCommunicationType>(
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

  async createActualCommunicationRecord(input: CreateHvacCommunicationInput): Promise<HvacCommunicationType> {
    this.logger.log(`Creating new communication in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<HvacCommunicationType>(
      'POST',
      '/communications',
      input,
    );
    this.clearCacheKeySubstring('/communications'); // Clears general list
    if (input.customerId) {
        this.clearCacheKeySubstring(`/customers/${input.customerId}/communications`); // Clears customer specific list
        this.clearCacheKeySubstring(`/communications/timeline/${input.customerId}`); // Clears timeline for customer
        this.clearCacheKeySubstring(`/communications/stats/${input.customerId}`); // Clears stats for customer
    }
    this.logger.log(`Successfully created communication, ID: ${result.data.id}`);
    return result.data;
  }

  // Assuming UpdateHvacCommunicationInput exists and is similar to CreateHvacCommunicationInput but with ID
  async updateActualCommunicationRecord(id: string, input: Partial<CreateHvacCommunicationInput>): Promise<HvacCommunicationType> {
    this.logger.log(`Updating communication ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    // Fetch existing record if customerId might change or is needed for cache invalidation and not in input
    const existingComm = await this.getCommunicationDetailsById(id);

    const result = await this.performOptimizedRequest<HvacCommunicationType>(
      'PUT', // Or PATCH
      `/communications/${id}`,
      input,
    );
    this.clearCacheKeySubstring(`/communications/${id}`); // Clear specific item
    this.clearCacheKeySubstring('/communications'); // Clear general list

    const customerId = input.customerId || existingComm?.customerId || result.data.customerId;
    if (customerId) {
        this.clearCacheKeySubstring(`/customers/${customerId}/communications`);
        this.clearCacheKeySubstring(`/communications/timeline/${customerId}`);
        this.clearCacheKeySubstring(`/communications/stats/${customerId}`);
    }
    this.logger.log(`Successfully updated communication, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualCommunicationRecord(id: string): Promise<boolean> {
    this.logger.log(`Deleting communication ID ${id} from HVAC API.`);
    const comm = await this.getCommunicationDetailsById(id); // Fetch to get customerId for cache
    await this.performOptimizedRequest(
      'DELETE',
      `/communications/${id}`,
    );
    this.clearCacheKeySubstring(`/communications/${id}`);
    this.clearCacheKeySubstring('/communications');
    if (comm?.customerId) {
        this.clearCacheKeySubstring(`/customers/${comm.customerId}/communications`);
        this.clearCacheKeySubstring(`/communications/timeline/${comm.customerId}`);
        this.clearCacheKeySubstring(`/communications/stats/${comm.customerId}`);
    }
    this.logger.log(`Successfully deleted communication ID: ${id}`);
    return true;
  }


  async getCommunicationStatistics(customerId: string): Promise<HvacCommunicationStatsType | null> {
      this.logger.debug(`Fetching communication statistics for customer ID: ${customerId}`);
      try {
        // Assuming the API response structure matches HvacCommunicationStatsType
        const result = await this.performOptimizedRequest<HvacCommunicationStatsType>(
            'GET',
            `/communications/stats/${customerId}`,
        );
        return result.data;
      } catch (error) {
        this.logger.error(`Error fetching communication stats for customer ${customerId}:`, error.message);
        if (error instanceof HvacApiNotFoundError) return null;
        throw error;
      }
  }

  async processEmailContentWithAI(emailContent: string, customerId: string): Promise<HvacAIInsightsType | null> {
      this.logger.log(`Processing email with AI for customer ID: ${customerId}`);
      try {
        // Assuming the API response structure matches HvacAIInsightsType
        const result = await this.performOptimizedRequest<HvacAIInsightsType>(
            'POST',
            '/communications/ai-process',
            { content: emailContent, customerId, language: 'pl' }
        );
        return result.data;
      } catch (error) {
        this.logger.error(`Error processing email with AI for customer ${customerId}:`, error.message);
        throw error;
      }
  }

  async getCommunicationTimelineForCustomer(customerId: string, limit = 50): Promise<HvacCommunicationType[]> {
      this.logger.debug(`Fetching communication timeline for customer ID: ${customerId}, limit: ${limit}`);
      interface HvacApiCommunicationTimelineResponse {
          data?: HvacCommunicationType[];
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

  async searchCustomerCommunications(query: string, customerId?: string, limit = 20): Promise<HvacCommunicationType[]> {
      this.logger.debug(`Searching communications with query "${query}", customerId: ${customerId}, limit: ${limit}`);
      interface HvacApiCommunicationSearchResponse {
          results?: HvacCommunicationType[];
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

  async updateStatusForCommunication(id: string, status: string /* Consider HvacCommunicationStatusEnum */): Promise<HvacCommunicationType | null> {
      this.logger.log(`Updating status for communication ID: ${id} to ${status}`);
      try {
        const result = await this.performOptimizedRequest<HvacCommunicationType>(
            'PATCH',
            `/communications/${id}/status`,
            { status }
        );
        this.clearCacheKeySubstring(`/communications/${id}`);
        this.clearCacheKeySubstring('/communications');
        // Also need to clear customer specific communication caches
        const comm = await this.getCommunicationDetailsById(id); // Re-fetch or use result.data if it's the full object
        if (result.data.customerId) { // Assuming status update returns the full object with customerId
             this.clearCacheKeySubstring(`/customers/${result.data.customerId}/communications`);
             this.clearCacheKeySubstring(`/communications/timeline/${result.data.customerId}`);
             this.clearCacheKeySubstring(`/communications/stats/${result.data.customerId}`);
        } else if (comm?.customerId) {
            this.clearCacheKeySubstring(`/customers/${comm.customerId}/communications`);
            this.clearCacheKeySubstring(`/communications/timeline/${comm.customerId}`);
            this.clearCacheKeySubstring(`/communications/stats/${comm.customerId}`);
        }
        return result.data;
      } catch (error) {
        this.logger.error(`Error updating status for communication ${id}:`, error.message);
        if (error instanceof HvacApiNotFoundError) return null;
        throw error;
      }
  }

  // ServiceTicket Management
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
      this.clearCacheKeySubstring(`/customers/${input.customerId}/tickets`);
    }
    // If there's a view for tickets by equipment, clear that too
    if (input.equipmentIds && input.equipmentIds.length > 0) {
        input.equipmentIds.forEach(eqId => this.clearCacheKeySubstring(`/equipment/${eqId}/tickets`));
    }
    this.logger.log(`Successfully created service ticket, ID: ${result.data.id}`);
    return result.data;
  }

  async updateActualServiceTicketRecord(id: string, input: UpdateHvacServiceTicketInput): Promise<HvacServiceTicketData> {
    this.logger.log(`Updating service ticket ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    const existingTicket = await this.getServiceTicketDetailsById(id); // For cache invalidation if IDs change or are not in input
    const payload = { ...input };
    delete payload.id;

    const result = await this.performOptimizedRequest<HvacServiceTicketData>(
      'PUT',
      `/tickets/${id}`,
      payload,
    );
    this.clearCacheKeySubstring(`/tickets/${id}`);
    this.clearCacheKeySubstring('/tickets');

    const customerId = input.customerId || existingTicket?.customerId || result.data.customerId;
    if (customerId) {
      this.clearCacheKeySubstring(`/customers/${customerId}/tickets`);
    }
    const equipmentIds = input.equipmentIds || existingTicket?.equipmentIds || result.data.equipmentIds;
    if (equipmentIds && equipmentIds.length > 0) {
        equipmentIds.forEach(eqId => this.clearCacheKeySubstring(`/equipment/${eqId}/tickets`));
    }
    // If status change affects other aggregate views (e.g. "open tickets"), clear those too.
    this.logger.log(`Successfully updated service ticket, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualServiceTicketRecord(id: string): Promise<boolean> {
    this.logger.log(`Deleting service ticket ID ${id} from HVAC API.`);
    const ticket = await this.getServiceTicketDetailsById(id); // Fetch for cache invalidation details
    await this.performOptimizedRequest(
      'DELETE',
      `/tickets/${id}`,
    );
    this.clearCacheKeySubstring(`/tickets/${id}`);
    this.clearCacheKeySubstring('/tickets');
    if (ticket?.customerId) {
      this.clearCacheKeySubstring(`/customers/${ticket.customerId}/tickets`);
    }
    if (ticket?.equipmentIds && ticket.equipmentIds.length > 0) {
        ticket.equipmentIds.forEach(eqId => this.clearCacheKeySubstring(`/equipment/${eqId}/tickets`));
    }
    this.logger.log(`Successfully deleted service ticket ID: ${id}`);
    return true;
  }

  // Contract Management

  async getContractsList(
    filters?: HvacContractFilterInput,
    limit = 50,
    offset = 0,
  ): Promise<{ contracts: HvacContractType[]; total: number }> {
    const queryParams: Record<string, string | number | boolean | string[]> = { limit, offset };
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

    interface HvacApiContractListResponse {
      data?: HvacContractType[];
      totalCount?: number;
    }
    const result = await this.performOptimizedRequest<HvacApiContractListResponse>(
      'GET',
      '/contracts',
      undefined,
      queryParams,
    );
    const contractList = result.data.data || [];
    const total = result.data.totalCount ?? contractList.length;
    this.logger.debug(`Fetched ${contractList.length} contracts, total available: ${total}`);
    return { contracts: contractList, total };
  }

  async getContractDetailsById(id: string): Promise<HvacContractType | null> {
    this.logger.debug(`Fetching contract details for ID: ${id}`);
    try {
      const result = await this.performOptimizedRequest<HvacContractType>(
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

  async createActualContractRecord(input: CreateHvacContractInput): Promise<HvacContractType> {
    this.logger.log(`Creating new contract in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<HvacContractType>(
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

  async updateActualContractRecord(id: string, input: UpdateHvacContractInput): Promise<HvacContractType> {
    this.logger.log(`Updating contract ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    const existingContract = await this.getContractDetailsById(id); // For cache invalidation if customerId changes
    const payload = { ...input };

    const result = await this.performOptimizedRequest<HvacContractType>(
      'PUT',
      `/contracts/${id}`,
      payload,
    );
    this.clearCacheKeySubstring(`/contracts/${id}`);
    this.clearCacheKeySubstring('/contracts');
    const customerId = input.customerId || existingContract?.customerId || result.data.customerId;
    if (customerId) {
      this.clearCacheKeySubstring(`/customers/${customerId}/contracts`);
    }
    this.logger.log(`Successfully updated contract, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualContractRecord(id: string): Promise<boolean> {
    this.logger.log(`Deleting contract ID ${id} from HVAC API.`);
    const contract = await this.getContractDetailsById(id); // Fetch for customerId
    await this.performOptimizedRequest(
      'DELETE',
      `/contracts/${id}`,
    );
    this.clearCacheKeySubstring(`/contracts/${id}`);
    this.clearCacheKeySubstring('/contracts');
    if (contract?.customerId) {
      this.clearCacheKeySubstring(`/customers/${contract.customerId}/contracts`);
    }
    this.logger.log(`Successfully deleted contract ID: ${id}`);
    return true;
  }

  // Quote Management
  async getQuotesList(
    filters?: HvacQuoteFilterInput,
    limit = 50,
    offset = 0,
  ): Promise<{ quotes: HvacQuote[]; total: number }> {
    const queryParams: Record<string, string | number | boolean | string[]> = { limit, offset };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = Array.isArray(value) ? value.join(',') : String(value);
        }
      });
    }
    this.logger.debug(`Fetching quotes list with query params: ${JSON.stringify(queryParams)}`);

    interface HvacApiQuoteListResponse {
      data?: HvacQuote[];
      totalCount?: number;
    }
    const result = await this.performOptimizedRequest<HvacApiQuoteListResponse>(
      'GET',
      '/quotes', // Assuming endpoint for quotes
      undefined,
      queryParams,
    );
    const quoteList = result.data.data || [];
    const total = result.data.totalCount ?? quoteList.length;
    this.logger.debug(`Fetched ${quoteList.length} quotes, total available: ${total}`);
    return { quotes: quoteList, total };
  }

  async getQuoteDetailsById(id: string): Promise<HvacQuote | null> {
    this.logger.debug(`Fetching quote details for ID: ${id}`);
    try {
      const result = await this.performOptimizedRequest<HvacQuote>(
        'GET',
        `/quotes/${id}`,
      );
      return result.data;
    } catch (error) {
      if (error instanceof HvacApiNotFoundError) {
        this.logger.warn(`Quote with ID ${id} not found in HVAC API.`);
        return null;
      }
      throw error;
    }
  }

  async createActualQuoteRecord(input: CreateHvacQuoteInput): Promise<HvacQuote> {
    this.logger.log(`Creating new quote in HVAC API with data: ${JSON.stringify(input)}`);
    const result = await this.performOptimizedRequest<HvacQuote>(
      'POST',
      '/quotes',
      input,
    );
    this.clearCacheKeySubstring('/quotes'); // Clear general list of quotes
    if (input.customerId) {
      this.clearCacheKeySubstring(`/customers/${input.customerId}/quotes`); // Clear customer-specific quotes
    }
    this.logger.log(`Successfully created quote, ID: ${result.data.id}`);
    return result.data;
  }

  async updateActualQuoteRecord(id: string, input: UpdateHvacQuoteInput): Promise<HvacQuote> {
    this.logger.log(`Updating quote ID ${id} in HVAC API with data: ${JSON.stringify(input)}`);
    const existingQuote = await this.getQuoteDetailsById(id); // For cache invalidation if customerId changes
    const payload = { ...input };

    const result = await this.performOptimizedRequest<HvacQuote>(
      'PUT',
      `/quotes/${id}`,
      payload,
    );
    this.clearCacheKeySubstring(`/quotes/${id}`); // Clear specific quote
    this.clearCacheKeySubstring('/quotes'); // Clear general list
    const customerId = input.customerId || existingQuote?.customerId || result.data.customerId;
    if (customerId) {
      this.clearCacheKeySubstring(`/customers/${customerId}/quotes`);
    }
    this.logger.log(`Successfully updated quote, ID: ${result.data.id}`);
    return result.data;
  }

  async deleteActualQuoteRecord(id: string): Promise<boolean> {
    this.logger.log(`Deleting quote ID ${id} from HVAC API.`);
    const quote = await this.getQuoteDetailsById(id); // Fetch for customerId
    await this.performOptimizedRequest(
      'DELETE',
      `/quotes/${id}`,
    );
    this.clearCacheKeySubstring(`/quotes/${id}`);
    this.clearCacheKeySubstring('/quotes');
    if (quote?.customerId) {
      this.clearCacheKeySubstring(`/customers/${quote.customerId}/quotes`);
    }
    this.logger.log(`Successfully deleted quote ID: ${id}`);
    return true;
  }
}
