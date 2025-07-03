import { Controller, Get } from '@nestjs/common';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';

export interface HvacHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    hvacApi: {
      status: 'up' | 'down';
      responseTime?: number;
      lastChecked: string;
    };
    weaviate: {
      status: 'up' | 'down' | 'unknown';
      lastChecked: string;
    };
    bielik: {
      status: 'up' | 'down' | 'unknown';
      lastChecked: string;
    };
    configuration: {
      status: 'valid' | 'invalid';
      errors: string[];
    };
  };
  features: {
    scheduling: boolean;
    maintenance: boolean;
    inventory: boolean;
    semanticSearch: boolean;
    aiInsights: boolean;
  };
}

@Controller('hvac/health')
export class HvacHealthController {
  constructor(
    private readonly hvacApiService: HvacApiIntegrationService,
    private readonly hvacConfigService: HvacConfigService,
  ) {}

  @Get()
  async getHealthStatus(): Promise<HvacHealthStatus> {
    const timestamp = new Date().toISOString();
    
    // Check HVAC API health
    const hvacApiStartTime = Date.now();
    const hvacApiHealthy = await this.hvacApiService.checkApiHealth();
    const hvacApiResponseTime = Date.now() - hvacApiStartTime;

    // Check configuration validity
    const configValidation = this.hvacConfigService.validateHvacConfiguration();

    // Check HVAC services health (would be implemented with actual health checks)
    const servicesHealth = await this.hvacConfigService.checkHvacServicesHealth();

    // Get feature flags
    const features = this.hvacConfigService.getHvacFeatureFlags();

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (!hvacApiHealthy || !configValidation.isValid) {
      overallStatus = 'unhealthy';
    } else if (!servicesHealth.weaviate || !servicesHealth.bielik) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp,
      services: {
        hvacApi: {
          status: hvacApiHealthy ? 'up' : 'down',
          responseTime: hvacApiResponseTime,
          lastChecked: timestamp,
        },
        weaviate: {
          status: servicesHealth.weaviate ? 'up' : 'down',
          lastChecked: timestamp,
        },
        bielik: {
          status: servicesHealth.bielik ? 'up' : 'down',
          lastChecked: timestamp,
        },
        configuration: {
          status: configValidation.isValid ? 'valid' : 'invalid',
          errors: configValidation.errors,
        },
      },
      features: {
        scheduling: features.scheduling,
        maintenance: features.maintenance,
        inventory: features.inventory,
        semanticSearch: features.semanticSearch,
        aiInsights: features.aiInsights,
      },
    };
  }

  @Get('config')
  async getConfigurationStatus() {
    const hvacApiConfig = this.hvacConfigService.getHvacApiConfig();
    const weaviateConfig = this.hvacConfigService.getWeaviateConfig();
    const bielikConfig = this.hvacConfigService.getBielikConfig();
    const businessConfig = this.hvacConfigService.getHvacBusinessConfig();
    const features = this.hvacConfigService.getHvacFeatureFlags();

    return {
      hvacApi: {
        url: hvacApiConfig.url,
        version: hvacApiConfig.version,
        timeout: hvacApiConfig.timeout,
        hasApiKey: !!hvacApiConfig.apiKey,
      },
      weaviate: {
        host: weaviateConfig.host,
        port: weaviateConfig.port,
        scheme: weaviateConfig.scheme,
        hasApiKey: !!weaviateConfig.apiKey,
      },
      bielik: {
        host: bielikConfig.host,
        port: bielikConfig.port,
        modelName: bielikConfig.modelName,
        maxTokens: bielikConfig.maxTokens,
        hasApiKey: !!bielikConfig.apiKey,
      },
      business: {
        companyName: businessConfig.companyName,
        companyEmail: businessConfig.companyEmail,
        timezone: businessConfig.timezone,
        locale: businessConfig.locale,
        currency: businessConfig.currency,
      },
      features,
    };
  }

  @Get('endpoints')
  async getEndpointsStatus() {
    const endpoints = this.hvacConfigService.getHvacServiceEndpoints();
    
    return {
      endpoints,
      timestamp: new Date().toISOString(),
    };
  }
}
