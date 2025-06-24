import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';

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
            if (retryCount > this.MAX_RETRIES) {
              this.logger.error(
                `Failed to ${method} ${endpoint} after ${retryCount} retries`,
                error,
              );
              throw error;
            }

            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;

            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        throw new Error(`Max retries exceeded for ${method} ${endpoint}`);
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
      const response: AxiosResponse<HvacCustomer> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch customer ${customerId} from HVAC API`,
        error,
      );

      return null;
    }
  }

  async createCustomer(
    customerData: Partial<HvacCustomer>,
  ): Promise<HvacCustomer> {
    try {
      const url = this.getApiUrl('/customers');
      const response: AxiosResponse<HvacCustomer> = await firstValueFrom(
        this.httpService.post(url, customerData, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create customer in HVAC API', error);
      throw new Error('Failed to create customer');
    }
  }

  // Service Ticket Management
  async getServiceTickets(
    limit = 50,
    offset = 0,
  ): Promise<HvacServiceTicketData[]> {
    try {
      const url = this.getApiUrl('/tickets');
      const response: AxiosResponse<{ tickets: HvacServiceTicketData[] }> =
        await firstValueFrom(
          this.httpService.get(url, {
            headers: this.getApiHeaders(),
            params: { limit, offset },
          }),
        );

      return response.data.tickets || [];
    } catch (error) {
      this.logger.error('Failed to fetch service tickets from HVAC API', error);
      throw new Error('Failed to fetch service tickets');
    }
  }

  async getServiceTicketById(
    ticketId: string,
  ): Promise<HvacServiceTicketData | null> {
    try {
      const url = this.getApiUrl(`/tickets/${ticketId}`);
      const response: AxiosResponse<HvacServiceTicketData> =
        await firstValueFrom(
          this.httpService.get(url, {
            headers: this.getApiHeaders(),
          }),
        );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch service ticket ${ticketId} from HVAC API`,
        error,
      );

      return null;
    }
  }

  async createServiceTicket(
    ticketData: HvacServiceTicketData,
  ): Promise<HvacServiceTicketData> {
    try {
      const url = this.getApiUrl('/tickets');
      const response: AxiosResponse<HvacServiceTicketData> =
        await firstValueFrom(
          this.httpService.post(url, ticketData, {
            headers: this.getApiHeaders(),
          }),
        );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create service ticket in HVAC API', error);
      throw new Error('Failed to create service ticket');
    }
  }

  async updateServiceTicket(
    ticketId: string,
    ticketData: Partial<HvacServiceTicketData>,
  ): Promise<HvacServiceTicketData> {
    try {
      const url = this.getApiUrl(`/tickets/${ticketId}`);
      const response: AxiosResponse<HvacServiceTicketData> =
        await firstValueFrom(
          this.httpService.put(url, ticketData, {
            headers: this.getApiHeaders(),
          }),
        );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update service ticket ${ticketId} in HVAC API`,
        error,
      );
      throw new Error('Failed to update service ticket');
    }
  }

  // Equipment Management
  async getEquipment(limit = 50, offset = 0): Promise<HvacEquipmentSummary[]> {
    try {
      const url = this.getApiUrl('/equipment');
      const response: AxiosResponse<{ equipment: HvacEquipmentSummary[] }> =
        await firstValueFrom(
          this.httpService.get(url, {
            headers: this.getApiHeaders(),
            params: { limit, offset },
          }),
        );

      return response.data.equipment || [];
    } catch (error) {
      this.logger.error('Failed to fetch equipment from HVAC API', error);
      throw new Error('Failed to fetch equipment');
    }
  }

  async getEquipmentById(
    equipmentId: string,
  ): Promise<HvacEquipmentSummary | null> {
    try {
      const url = this.getApiUrl(`/equipment/${equipmentId}`);
      const response: AxiosResponse<HvacEquipmentSummary> =
        await firstValueFrom(
          this.httpService.get(url, {
            headers: this.getApiHeaders(),
          }),
        );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch equipment ${equipmentId} from HVAC API`,
        error,
      );

      return null;
    }
  }

  // Semantic Search Integration
  async performSemanticSearch(
    searchQuery: HvacSearchQuery,
  ): Promise<HvacSearchResult[]> {
    try {
      const url = this.getApiUrl('/search');
      const response: AxiosResponse<{ results: HvacSearchResult[] }> =
        await firstValueFrom(
          this.httpService.post(url, searchQuery, {
            headers: this.getApiHeaders(),
          }),
        );

      return response.data.results || [];
    } catch (error) {
      this.logger.error('Failed to perform semantic search in HVAC API', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  // AI Insights Integration
  async getCustomerInsights(customerId: string): Promise<HvacCustomerInsights> {
    try {
      const result = await this.performOptimizedRequest<HvacCustomerInsights>(
        'GET',
        `/customers/${customerId}/insights`,
        undefined,
        undefined,
        true, // Use cache for insights
      );

      this.logger.debug(`Fetched insights for customer ${customerId}`, {
        metrics: result.metrics,
        customerId,
      });

      return result.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch customer insights for ${customerId} from HVAC API`,
        error,
      );
      throw new Error('Failed to fetch customer insights');
    }
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
