import { Injectable } from '@nestjs/common';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { ConfigVariables } from 'src/engine/core-modules/twenty-config/config-variables';

export interface HvacApiConfig {
  url: string;
  apiKey: string;
  version: string;
  timeout: number;
}

export interface WeaviateConfig {
  host: string;
  port: number;
  grpcPort: number;
  scheme: string;
  apiKey?: string;
}

export interface BielikConfig {
  host: string;
  port: number;
  apiKey: string;
  modelName: string;
  maxTokens: number;
}

export interface HvacBusinessConfig {
  companyName: string;
  companyEmail: string;
  companyNip?: string;
  companyRegon?: string;
  timezone: string;
  locale: string;
  currency: string;
}

export interface HvacFeatureFlags {
  scheduling: boolean;
  maintenance: boolean;
  inventory: boolean;
  semanticSearch: boolean;
  aiInsights: boolean;
  customer360: boolean;
}

export interface HvacServiceEndpoints {
  customers: string;
  tickets: string;
  equipment: string;
  maintenance: string;
  semanticSearch: string;
}

@Injectable()
export class HvacConfigService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  getHvacApiConfig(): HvacApiConfig {
    return {
      url: this.twentyConfigService.get('HVAC_API_URL') || 'http://localhost:8000',
      apiKey: this.twentyConfigService.get('HVAC_API_KEY') || '',
      version: this.twentyConfigService.get('HVAC_API_VERSION') || 'v1',
      timeout: this.getNumberConfig('HVAC_API_TIMEOUT', 30000),
    };
  }

  getWeaviateConfig(): WeaviateConfig {
    return {
      host: this.twentyConfigService.get('WEAVIATE_HOST') || 'localhost',
      port: this.getNumberConfig('WEAVIATE_PORT', 8080),
      grpcPort: this.getNumberConfig('WEAVIATE_GRPC_PORT', 50051),
      scheme: this.twentyConfigService.get('WEAVIATE_SCHEME') || 'http',
      apiKey: this.twentyConfigService.get('WEAVIATE_API_KEY'),
    };
  }

  getBielikConfig(): BielikConfig {
    return {
      host: this.twentyConfigService.get('BIELIK_HOST') || 'localhost',
      port: this.getNumberConfig('BIELIK_PORT', 8123),
      apiKey: this.twentyConfigService.get('BIELIK_API_KEY') || '',
      modelName: this.twentyConfigService.get('BIELIK_MODEL_NAME') || 'bielik-v3-4.5b',
      maxTokens: this.getNumberConfig('BIELIK_MAX_TOKENS', 4096),
    };
  }

  getHvacBusinessConfig(): HvacBusinessConfig {
    return {
      companyName: this.twentyConfigService.get('COMPANY_NAME') || 'Fulmark HVAC',
      companyEmail: this.twentyConfigService.get('COMPANY_EMAIL') || 'info@fulmark.pl',
      companyNip: this.twentyConfigService.get('COMPANY_NIP'),
      companyRegon: this.twentyConfigService.get('COMPANY_REGON'),
      timezone: this.twentyConfigService.get('TIMEZONE') || 'Europe/Warsaw',
      locale: this.twentyConfigService.get('LOCALE') || 'pl_PL.UTF-8',
      currency: this.twentyConfigService.get('LOCALIZATION_CURRENCY') || 'PLN',
    };
  }

  getHvacFeatureFlags(): HvacFeatureFlags {
    return {
      scheduling: this.getBooleanConfig('FEATURE_HVAC_SCHEDULING', true),
      maintenance: this.getBooleanConfig('FEATURE_HVAC_MAINTENANCE', true),
      inventory: this.getBooleanConfig('FEATURE_HVAC_INVENTORY', true),
      semanticSearch: this.getBooleanConfig('FEATURE_HVAC_SEMANTIC_SEARCH', true),
      aiInsights: this.getBooleanConfig('FEATURE_HVAC_AI_INSIGHTS', true),
      customer360: this.getBooleanConfig('FEATURE_HVAC_CUSTOMER_360', true),
    };
  }

  getHvacServiceEndpoints(): HvacServiceEndpoints {
    const baseUrl = this.getHvacApiConfig().url;
    const version = this.getHvacApiConfig().version;
    
    return {
      customers: this.twentyConfigService.get('HVAC_CUSTOMER_SERVICE_URL') || 
                `${baseUrl}/api/${version}/customers`,
      tickets: this.twentyConfigService.get('HVAC_TICKET_SERVICE_URL') || 
              `${baseUrl}/api/${version}/tickets`,
      equipment: this.twentyConfigService.get('HVAC_EQUIPMENT_SERVICE_URL') || 
                `${baseUrl}/api/${version}/equipment`,
      maintenance: this.twentyConfigService.get('HVAC_MAINTENANCE_SERVICE_URL') || 
                  `${baseUrl}/api/${version}/maintenance`,
      semanticSearch: this.twentyConfigService.get('HVAC_SEMANTIC_SEARCH_URL') || 
                     `${baseUrl}/api/${version}/search`,
    };
  }

  getCrewAiConfig() {
    return {
      enabled: this.getBooleanConfig('CREWAI_ENABLE', true),
      maxAgents: this.getNumberConfig('CREWAI_MAX_AGENTS', 5),
      timeout: this.getNumberConfig('CREWAI_TIMEOUT', 180),
      verbose: this.getBooleanConfig('CREWAI_VERBOSE', true),
    };
  }

  getPolishComplianceConfig() {
    return {
      gdprEnabled: this.getBooleanConfig('GDPR_ENABLED', true),
      dataRetentionDays: this.getNumberConfig('GDPR_DATA_RETENTION_DAYS', 2555),
      anonymizationEnabled: this.getBooleanConfig('GDPR_ANONYMIZATION_ENABLED', true),
      consentRequired: this.getBooleanConfig('GDPR_CONSENT_REQUIRED', true),
    };
  }

  getCacheConfig() {
    return {
      enabled: this.getBooleanConfig('CACHE_ENABLED', true),
      defaultTtl: this.getNumberConfig('CACHE_TTL_DEFAULT', 3600),
      customerProfileTtl: this.getNumberConfig('CACHE_TTL_CUSTOMER_PROFILE', 1800),
    };
  }

  getPerformanceConfig() {
    return {
      databasePoolSize: this.getNumberConfig('DATABASE_POOL_SIZE', 20),
      databaseMaxOverflow: this.getNumberConfig('DATABASE_MAX_OVERFLOW', 30),
      maxConcurrentRequests: this.getNumberConfig('MAX_CONCURRENT_REQUESTS', 100),
      requestTimeout: this.getNumberConfig('REQUEST_TIMEOUT', 30),
    };
  }

  isHvacFeatureEnabled(feature: keyof HvacFeatureFlags): boolean {
    const flags = this.getHvacFeatureFlags();
    return flags[feature];
  }

  getHvacApiUrl(endpoint: keyof HvacServiceEndpoints): string {
    const endpoints = this.getHvacServiceEndpoints();
    return endpoints[endpoint];
  }

  // Helper method for boolean configuration
  private getBooleanConfig(key: keyof ConfigVariables | string, defaultValue: boolean = false): boolean {
    let value: any;
    try {
      // Try to get the value using the typed key first
      value = this.twentyConfigService.get(key as keyof ConfigVariables);
    } catch {
      // If that fails, try to get from environment directly
      value = process.env[key];
    }

    if (value === undefined || value === null) {
      return defaultValue;
    }
    // Handle different types that could be returned
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return defaultValue;
  }

  // Helper method for number configuration
  private getNumberConfig(key: keyof ConfigVariables | string, defaultValue: number): number {
    let value: any;
    try {
      // Try to get the value using the typed key first
      value = this.twentyConfigService.get(key as keyof ConfigVariables);
    } catch {
      // If that fails, try to get from environment directly
      value = process.env[key];
    }

    if (value === undefined || value === null) {
      return defaultValue;
    }
    // Handle different types that could be returned
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  // Validation methods
  validateHvacConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate HVAC API configuration
    const hvacApi = this.getHvacApiConfig();
    if (!hvacApi.url) {
      errors.push('HVAC_API_URL is required');
    }
    if (!hvacApi.apiKey) {
      errors.push('HVAC_API_KEY is required');
    }

    // Validate Weaviate configuration
    const weaviate = this.getWeaviateConfig();
    if (!weaviate.host) {
      errors.push('WEAVIATE_HOST is required');
    }

    // Validate business configuration
    const business = this.getHvacBusinessConfig();
    if (!business.companyName) {
      errors.push('COMPANY_NAME is required');
    }
    if (!business.companyEmail) {
      errors.push('COMPANY_EMAIL is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Health check method
  async checkHvacServicesHealth(): Promise<{ [service: string]: boolean }> {
    const results: { [service: string]: boolean } = {};

    try {
      // Check HVAC API health
      const hvacApi = this.getHvacApiConfig();
      // Implementation would make actual HTTP calls to check service health
      results.hvacApi = true; // Placeholder

      // Check Weaviate health
      const weaviate = this.getWeaviateConfig();
      results.weaviate = true; // Placeholder

      // Check Bielik health
      const bielik = this.getBielikConfig();
      results.bielik = true; // Placeholder

    } catch (error) {
      console.error('Error checking HVAC services health:', error);
    }

    return results;
  }
}
