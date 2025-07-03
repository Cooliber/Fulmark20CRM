/**
 * HVAC Health Indicator
 * "Pasja rodzi profesjonalizm" - Professional HVAC Health Monitoring
 * 
 * Integrates HVAC health checks with Twenty's health system
 * Monitors HVAC services, APIs, and configurations
 */

import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import { HvacCacheManagerService } from '../services/hvac-cache-manager.service';
import { HvacDataSyncService } from '../services/hvac-data-sync.service';
import { HvacWeaviateService } from '../services/hvac-weaviate.service';

export interface HvacHealthDetails {
  services: {
    hvacApi: {
      status: 'up' | 'down';
      responseTime?: number;
      lastChecked: string;
      error?: string;
    };
    weaviate: {
      status: 'up' | 'down' | 'unknown';
      lastChecked: string;
      error?: string;
    };
    cache: {
      status: 'up' | 'down';
      lastChecked: string;
      error?: string;
    };
    dataSync: {
      status: 'up' | 'down';
      lastSync?: string;
      isRunning: boolean;
      errors: string[];
    };
  };
  configuration: {
    status: 'valid' | 'invalid';
    errors: string[];
  };
  features: {
    scheduling: boolean;
    maintenance: boolean;
    inventory: boolean;
    semanticSearch: boolean;
    aiInsights: boolean;
    customer360: boolean;
  };
  metrics: {
    totalDocuments: number;
    lastSyncTime?: string;
    errorRate: number;
    averageResponseTime: number;
  };
}

@Injectable()
export class HvacHealthIndicator extends HealthIndicator {
  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
    private readonly weaviateService: HvacWeaviateService,
    private readonly cacheService: HvacCacheManagerService,
    private readonly dataSyncService: HvacDataSyncService,
  ) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const healthDetails = await this.checkHvacHealth();
    const isHealthy = healthDetails.services.hvacApi.status === 'up' &&
                     healthDetails.services.weaviate.status === 'up';

    return this.getStatus('hvac', isHealthy, healthDetails);

    try {
      const healthDetails = await this.checkHvacHealth();

      // Determine overall health status
      const isHealthy = this.evaluateOverallHealth(healthDetails);

      if (isHealthy) {
        return this.getStatus('hvac', true, healthDetails);
      } else {
        return this.getStatus('hvac', false, healthDetails);
      }
    } catch (error) {
      return this.getStatus('hvac', false, {
        error: error.message || 'HVAC health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async checkHvacHealth(): Promise<HvacHealthDetails> {
    const timestamp = new Date().toISOString();

    // Check all HVAC services in parallel
    const [
      hvacApiHealth,
      weaviateHealth,
      cacheHealth,
      dataSyncHealth,
      configValidation,
      features,
      metrics,
    ] = await Promise.allSettled([
      this.checkHvacApiHealth(),
      this.checkWeaviateHealth(),
      this.checkCacheHealth(),
      this.checkDataSyncHealth(),
      this.checkConfiguration(),
      this.getFeatureFlags(),
      this.getMetrics(),
    ]);

    return {
      services: {
        hvacApi: this.extractResult(hvacApiHealth, {
          status: 'down' as const,
          responseTime: 0,
          lastChecked: timestamp,
          error: 'Health check failed',
        }),
        weaviate: this.extractResult(weaviateHealth, {
          status: 'down' as const,
          lastChecked: timestamp,
          error: 'Health check failed',
        }),
        cache: this.extractResult(cacheHealth, {
          status: 'down' as const,
          lastChecked: timestamp,
          error: 'Health check failed',
        }),
        dataSync: this.extractResult(dataSyncHealth, {
          status: 'down' as const,
          lastSync: undefined,
          isRunning: false,
          errors: ['Health check failed'],
        }),
      },
      configuration: this.extractResult(configValidation, {
        status: 'invalid' as const,
        errors: ['Configuration validation failed'],
      }),
      features: this.extractResult(features, {
        scheduling: false,
        maintenance: false,
        inventory: false,
        semanticSearch: false,
        aiInsights: false,
        customer360: false,
      }),
      metrics: this.extractResult(metrics, {
        totalDocuments: 0,
        lastSyncTime: undefined,
        errorRate: 100,
        averageResponseTime: 0,
      }),
    };
  }

  private async checkHvacApiHealth() {
    const startTime = Date.now();
    try {
      const isHealthy = await this.hvacApiService.checkApiHealth();
      const responseTime = Date.now() - startTime;

      return {
        status: isHealthy ? ('up' as const) : ('down' as const),
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down' as const,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkWeaviateHealth() {
    try {
      const isHealthy = await this.weaviateService.checkHealth();
      return {
        status: isHealthy ? ('up' as const) : ('down' as const),
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down' as const,
        lastChecked: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkCacheHealth() {
    try {
      // Simple cache health check - try to set and get a test value
      const testKey = 'hvac-health-check';
      const testValue = Date.now().toString();

      await this.cacheService.set(testKey, testValue, { ttl: 10 }); // 10 seconds TTL
      const retrievedValue = await this.cacheService.get(testKey);

      const isHealthy = retrievedValue === testValue;

      return {
        status: isHealthy ? ('up' as const) : ('down' as const),
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down' as const,
        lastChecked: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkDataSyncHealth() {
    try {
      const syncStatus = this.dataSyncService.getSyncStatus();
      return {
        status: syncStatus.errors.length === 0 ? ('up' as const) : ('down' as const),
        lastSync: syncStatus.lastSync ? syncStatus.lastSync.toISOString() : undefined,
        isRunning: syncStatus.isRunning,
        errors: syncStatus.errors,
      };
    } catch (error) {
      return {
        status: 'down' as const,
        lastSync: undefined,
        isRunning: false,
        errors: [error.message],
      };
    }
  }

  private async checkConfiguration() {
    try {
      const validation = this.hvacConfigService.validateHvacConfiguration();
      return {
        status: validation.isValid ? 'valid' as const : 'invalid' as const,
        errors: validation.errors || [],
      };
    } catch (error) {
      return {
        status: 'invalid' as const,
        errors: [error.message],
      };
    }
  }

  private async getFeatureFlags() {
    try {
      return this.hvacConfigService.getHvacFeatureFlags();
    } catch (error) {
      return {
        scheduling: false,
        maintenance: false,
        inventory: false,
        semanticSearch: false,
        aiInsights: false,
        customer360: false,
      };
    }
  }

  private async getMetrics() {
    try {
      // Get metrics from various services
      const syncStatus = this.dataSyncService.getSyncStatus();
      
      return {
        totalDocuments: syncStatus.totalSynced || 0,
        lastSyncTime: syncStatus.lastSync ? syncStatus.lastSync.toISOString() : undefined,
        errorRate: syncStatus.errors.length > 0 ? 100 : 0,
        averageResponseTime: 0, // Would be calculated from actual metrics
      };
    } catch (error) {
      return {
        totalDocuments: 0,
        lastSyncTime: undefined,
        errorRate: 100,
        averageResponseTime: 0,
      };
    }
  }

  private evaluateOverallHealth(healthDetails: HvacHealthDetails): boolean {
    // HVAC is considered healthy if:
    // 1. Configuration is valid
    // 2. At least one core service is up (API or Weaviate)
    // 3. No critical errors in data sync

    const configValid = healthDetails.configuration.status === 'valid';
    const coreServiceUp = 
      healthDetails.services.hvacApi.status === 'up' ||
      healthDetails.services.weaviate.status === 'up';
    const dataSyncOk = healthDetails.services.dataSync.status === 'up';

    return configValid && coreServiceUp && dataSyncOk;
  }

  private extractResult<T>(
    settledResult: PromiseSettledResult<T>,
    fallback: T,
  ): T {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    }
    return fallback;
  }
}
