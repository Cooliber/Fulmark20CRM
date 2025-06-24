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

import { HvacSentryService } from './hvac-sentry.service';

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
    try {
      const result = await this.performOptimizedRequest<{
        customers: HvacCustomer[];
      }>('GET', '/customers', undefined, { limit, offset });

      this.logger.debug(
        `Fetched ${result.data.customers?.length || 0} customers`,
        {
          metrics: result.metrics,
          limit,
          offset,
        },
      );

      return result.data.customers || [];
    } catch (error) {
      this.logger.error('Failed to fetch customers from HVAC API', error);
      throw new Error('Failed to fetch customers');
    }
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
  async getEquipment(limit = 50, offset = 0): Promise<HvacEquipmentSummary[]> {
    const result = await this.performOptimizedRequest<{ equipment: HvacEquipmentSummary[] }>(
      'GET',
      '/equipment',
      undefined,
      { limit, offset },
    );
    return result.data.equipment || [];
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
  async getCustomerInsights(customerId: string): Promise<HvacCustomerInsights> {
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
}
