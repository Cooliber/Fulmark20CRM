/**
 * Enhanced HVAC API Integration Service
 * "Pasja rodzi profesjonalizm" - Professional HVAC API Integration
 * 
 * Integrates with the separated twenty-hvac-server backend
 * Following Twenty CRM patterns and cursor rules
 */

import { ApolloClient, gql, InMemoryCache } from '@apollo/client';
import { trackHVACUserAction, reportHVACError } from '../index';

// Types for HVAC API Integration
export interface HvacApiConfig {
  hvacServerUrl: string;
  twentyServerUrl: string;
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
  cacheTimeout: number;
}

export interface HvacApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  metadata?: {
    responseTime: number;
    cacheHit: boolean;
    retryCount: number;
  };
}

export interface HvacHealthStatus {
  hvacServer: boolean;
  twentyServer: boolean;
  weaviate: boolean;
  redis: boolean;
  overall: boolean;
  lastChecked: Date;
}

// Default configuration
const DEFAULT_CONFIG: HvacApiConfig = {
  hvacServerUrl: process.env.NEXT_PUBLIC_HVAC_SERVER_URL || 'http://localhost:3002',
  twentyServerUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  enableCache: true,
  cacheTimeout: 300000, // 5 minutes
};

/**
 * Enhanced HVAC API Integration Service
 * Provides seamless integration between TwentyCRM frontend and separated HVAC backend
 */
export class HvacApiIntegrationService {
  private config: HvacApiConfig;
  private cache: Map<string, { data: any; timestamp: number }>;
  private apolloClient: ApolloClient<any>;
  private healthStatus: HvacApiResponse<HvacHealthStatus> | null = null;
  private lastHealthCheck: Date | null = null;

  constructor(config: Partial<HvacApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    
    // Initialize Apollo Client for GraphQL operations
    this.apolloClient = new ApolloClient({
      uri: `${this.config.hvacServerUrl}/api/hvac/graphql`,
      cache: new InMemoryCache({
        typePolicies: {
          HvacCustomer: {
            keyFields: ['id'],
          },
          HvacServiceTicket: {
            keyFields: ['id'],
          },
          HvacEquipment: {
            keyFields: ['id'],
          },
        },
      }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
          errorPolicy: 'all',
        },
        query: {
          fetchPolicy: 'cache-first',
          errorPolicy: 'all',
        },
      },
    });

    // Initialize health monitoring
    this.initializeHealthMonitoring();
  }

  /**
   * Initialize health monitoring for all services
   */
  private initializeHealthMonitoring(): void {
    // Check health every 5 minutes
    setInterval(() => {
      this.checkSystemHealth();
    }, 5 * 60 * 1000);

    // Initial health check
    this.checkSystemHealth();
  }

  /**
   * Check overall system health
   */
  async checkSystemHealth(): Promise<HvacApiResponse<HvacHealthStatus>> {
    const startTime = Date.now();
    
    try {
      const [hvacHealth, twentyHealth, weaviateHealth, redisHealth] = await Promise.allSettled([
        this.checkHvacServerHealth(),
        this.checkTwentyServerHealth(),
        this.checkWeaviateHealth(),
        this.checkRedisHealth(),
      ]);

      const healthStatus: HvacHealthStatus = {
        hvacServer: hvacHealth.status === 'fulfilled' && hvacHealth.value,
        twentyServer: twentyHealth.status === 'fulfilled' && twentyHealth.value,
        weaviate: weaviateHealth.status === 'fulfilled' && weaviateHealth.value,
        redis: redisHealth.status === 'fulfilled' && redisHealth.value,
        overall: false,
        lastChecked: new Date(),
      };

      // Overall health is true if all critical services are healthy
      healthStatus.overall = healthStatus.hvacServer && healthStatus.twentyServer;

      this.healthStatus = {
        data: healthStatus,
        success: true,
        metadata: {
          responseTime: Date.now() - startTime,
          cacheHit: false,
          retryCount: 0,
        },
      };

      this.lastHealthCheck = new Date();

      // Track health status
      trackHVACUserAction('system_health_check', 'MONITORING', {
        overall: healthStatus.overall,
        hvacServer: healthStatus.hvacServer,
        twentyServer: healthStatus.twentyServer,
        weaviate: healthStatus.weaviate,
        redis: healthStatus.redis,
        responseTime: Date.now() - startTime,
      });

      return this.healthStatus;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown health check error';
      
      reportHVACError(error as Error, 'SYSTEM_HEALTH', {
        operation: 'checkSystemHealth',
        responseTime: Date.now() - startTime,
      });

      return {
        data: {
          hvacServer: false,
          twentyServer: false,
          weaviate: false,
          redis: false,
          overall: false,
          lastChecked: new Date(),
        },
        success: false,
        message: errorMessage,
        metadata: {
          responseTime: Date.now() - startTime,
          cacheHit: false,
          retryCount: 0,
        },
      };
    }
  }

  /**
   * Check HVAC server health
   */
  private async checkHvacServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.hvacServerUrl}/api/hvac/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout for health checks
      });

      return response.ok;
    } catch (error) {
      console.warn('HVAC server health check failed:', error);
      return false;
    }
  }

  /**
   * Check Twenty server health
   */
  private async checkTwentyServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.twentyServerUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.warn('Twenty server health check failed:', error);
      return false;
    }
  }

  /**
   * Check Weaviate health
   */
  private async checkWeaviateHealth(): Promise<boolean> {
    try {
      const weaviateUrl = process.env.NEXT_PUBLIC_WEAVIATE_URL || 'http://localhost:8080';
      const response = await fetch(`${weaviateUrl}/v1/.well-known/ready`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.warn('Weaviate health check failed:', error);
      return false;
    }
  }

  /**
   * Check Redis health (through HVAC server)
   */
  private async checkRedisHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.hvacServerUrl}/api/hvac/health/redis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.warn('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HvacApiResponse<HvacHealthStatus> | null {
    return this.healthStatus;
  }

  /**
   * Get Apollo Client instance for GraphQL operations
   */
  getApolloClient(): ApolloClient<any> {
    return this.apolloClient;
  }

  /**
   * Execute GraphQL query with error handling and caching
   */
  async executeGraphQLQuery<T>(
    query: string,
    variables?: Record<string, any>,
    options?: {
      useCache?: boolean;
      cacheKey?: string;
      retryAttempts?: number;
    }
  ): Promise<HvacApiResponse<T>> {
    const startTime = Date.now();
    const cacheKey = options?.cacheKey || `gql_${btoa(query)}_${JSON.stringify(variables || {})}`;
    const useCache = options?.useCache ?? this.config.enableCache;
    const retryAttempts = options?.retryAttempts ?? this.config.retryAttempts;

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        trackHVACUserAction('graphql_cache_hit', 'PERFORMANCE', {
          query: query.substring(0, 100),
          cacheKey,
          responseTime: Date.now() - startTime,
        });

        return {
          data: cached.data,
          success: true,
          metadata: {
            responseTime: Date.now() - startTime,
            cacheHit: true,
            retryCount: 0,
          },
        };
      }
    }

    // Execute query with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await this.apolloClient.query({
          query: gql(query),
          variables,
          fetchPolicy: attempt === 0 ? 'cache-first' : 'network-only',
          errorPolicy: 'all',
        });

        if (result.errors && result.errors.length > 0) {
          throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
        }

        // Cache successful result
        if (useCache) {
          this.cache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
          });
        }

        trackHVACUserAction('graphql_query_success', 'API', {
          query: query.substring(0, 100),
          variables: Object.keys(variables || {}),
          responseTime: Date.now() - startTime,
          retryCount: attempt,
        });

        return {
          data: result.data,
          success: true,
          metadata: {
            responseTime: Date.now() - startTime,
            cacheHit: false,
            retryCount: attempt,
          },
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown GraphQL error');

        if (attempt < retryAttempts) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    reportHVACError(lastError!, 'GRAPHQL_QUERY', {
      query: query.substring(0, 100),
      variables,
      retryAttempts,
      responseTime: Date.now() - startTime,
    });

    return {
      data: null as T,
      success: false,
      message: lastError?.message || 'GraphQL query failed',
      errors: [lastError?.message || 'Unknown error'],
      metadata: {
        responseTime: Date.now() - startTime,
        cacheHit: false,
        retryCount: retryAttempts,
      },
    };
  }

  /**
   * Execute GraphQL mutation with error handling
   */
  async executeGraphQLMutation<T>(
    mutation: string,
    variables?: Record<string, any>,
    options?: {
      retryAttempts?: number;
      invalidateCache?: boolean;
    }
  ): Promise<HvacApiResponse<T>> {
    const startTime = Date.now();
    const retryAttempts = options?.retryAttempts ?? this.config.retryAttempts;
    const invalidateCache = options?.invalidateCache ?? true;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await this.apolloClient.mutate({
          mutation: gql(mutation),
          variables,
          errorPolicy: 'all',
        });

        if (result.errors && result.errors.length > 0) {
          throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
        }

        // Invalidate cache after successful mutation
        if (invalidateCache) {
          this.cache.clear();
        }

        trackHVACUserAction('graphql_mutation_success', 'API', {
          mutation: mutation.substring(0, 100),
          variables: Object.keys(variables || {}),
          responseTime: Date.now() - startTime,
          retryCount: attempt,
        });

        return {
          data: result.data,
          success: true,
          metadata: {
            responseTime: Date.now() - startTime,
            cacheHit: false,
            retryCount: attempt,
          },
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown GraphQL error');

        if (attempt < retryAttempts) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    reportHVACError(lastError!, 'GRAPHQL_MUTATION', {
      mutation: mutation.substring(0, 100),
      variables,
      retryAttempts,
      responseTime: Date.now() - startTime,
    });

    return {
      data: null as T,
      success: false,
      message: lastError?.message || 'GraphQL mutation failed',
      errors: [lastError?.message || 'Unknown error'],
      metadata: {
        responseTime: Date.now() - startTime,
        cacheHit: false,
        retryCount: retryAttempts,
      },
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    trackHVACUserAction('cache_cleared', 'PERFORMANCE', {
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const hvacApiIntegrationService = new HvacApiIntegrationService();
