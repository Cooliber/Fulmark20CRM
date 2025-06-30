/**
 * HVAC Production Configuration
 * "Pasja rodzi profesjonalizm" - Professional HVAC Production Setup
 * 
 * Comprehensive production configuration for HVAC modules
 * Includes security, performance, monitoring, and deployment settings
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsUrl, IsOptional, IsNumber, IsBoolean, IsString, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

export interface HvacProductionConfig {
  // Core API Configuration
  api: {
    url: string;
    key: string;
    version: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // Weaviate Configuration
  weaviate: {
    host: string;
    port: number;
    scheme: string;
    apiKey?: string;
    timeout: number;
    maxConnections: number;
  };

  // Security Configuration
  security: {
    enableHttps: boolean;
    sslCertPath?: string;
    sslKeyPath?: string;
    corsOrigins: string[];
    rateLimitWindow: number;
    rateLimitMax: number;
    enableApiKeyAuth: boolean;
    enableJwtAuth: boolean;
  };

  // Performance Configuration
  performance: {
    cacheEnabled: boolean;
    cacheTtl: number;
    maxConcurrentRequests: number;
    requestTimeout: number;
    enableCompression: boolean;
    enableKeepAlive: boolean;
  };

  // Monitoring Configuration
  monitoring: {
    enableHealthChecks: boolean;
    healthCheckInterval: number;
    enableMetrics: boolean;
    metricsPort: number;
    enableLogging: boolean;
    logLevel: string;
    enableSentry: boolean;
    sentryDsn?: string;
  };

  // Feature Flags
  features: {
    scheduling: boolean;
    maintenance: boolean;
    inventory: boolean;
    semanticSearch: boolean;
    aiInsights: boolean;
    customer360: boolean;
    mobileApp: boolean;
    offlineSync: boolean;
  };

  // Database Configuration
  database: {
    enableConnectionPooling: boolean;
    maxConnections: number;
    connectionTimeout: number;
    enableSsl: boolean;
    enableReadReplicas: boolean;
  };

  // Polish Market Specific
  localization: {
    defaultLanguage: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    enablePolishIntegrations: boolean;
  };
}

export class HvacProductionConfigValidator {
  @IsUrl()
  @IsOptional()
  HVAC_API_URL: string = 'https://api.hvac.fulmark.pl';

  @IsString()
  @IsOptional()
  HVAC_API_KEY: string;

  @IsString()
  @IsOptional()
  HVAC_API_VERSION: string = 'v1';

  @IsNumber()
  @IsOptional()
  HVAC_API_TIMEOUT: number = 30000;

  @IsNumber()
  @IsOptional()
  HVAC_API_RETRY_ATTEMPTS: number = 3;

  @IsNumber()
  @IsOptional()
  HVAC_API_RETRY_DELAY: number = 1000;

  @IsString()
  @IsOptional()
  WEAVIATE_HOST: string = 'weaviate.hvac.fulmark.pl';

  @IsNumber()
  @IsOptional()
  WEAVIATE_PORT: number = 443;

  @IsString()
  @IsOptional()
  WEAVIATE_SCHEME: string = 'https';

  @IsString()
  @IsOptional()
  WEAVIATE_API_KEY: string;

  @IsBoolean()
  @IsOptional()
  HVAC_ENABLE_HTTPS: boolean = true;

  @IsString()
  @IsOptional()
  HVAC_SSL_CERT_PATH: string;

  @IsString()
  @IsOptional()
  HVAC_SSL_KEY_PATH: string;

  @IsString()
  @IsOptional()
  HVAC_CORS_ORIGINS: string = 'https://crm.fulmark.pl,https://app.fulmark.pl';

  @IsNumber()
  @IsOptional()
  HVAC_RATE_LIMIT_WINDOW: number = 900000; // 15 minutes

  @IsNumber()
  @IsOptional()
  HVAC_RATE_LIMIT_MAX: number = 1000;

  @IsBoolean()
  @IsOptional()
  HVAC_CACHE_ENABLED: boolean = true;

  @IsNumber()
  @IsOptional()
  HVAC_CACHE_TTL: number = 300000; // 5 minutes

  @IsNumber()
  @IsOptional()
  HVAC_MAX_CONCURRENT_REQUESTS: number = 100;

  @IsBoolean()
  @IsOptional()
  HVAC_ENABLE_HEALTH_CHECKS: boolean = true;

  @IsNumber()
  @IsOptional()
  HVAC_HEALTH_CHECK_INTERVAL: number = 30000; // 30 seconds

  @IsBoolean()
  @IsOptional()
  HVAC_ENABLE_METRICS: boolean = true;

  @IsNumber()
  @IsOptional()
  HVAC_METRICS_PORT: number = 9090;

  @IsString()
  @IsOptional()
  HVAC_LOG_LEVEL: string = 'info';

  @IsBoolean()
  @IsOptional()
  HVAC_ENABLE_SENTRY: boolean = true;

  @IsString()
  @IsOptional()
  HVAC_SENTRY_DSN: string;

  @IsString()
  @IsOptional()
  HVAC_DEFAULT_LANGUAGE: string = 'pl';

  @IsString()
  @IsOptional()
  HVAC_CURRENCY: string = 'PLN';

  @IsString()
  @IsOptional()
  HVAC_TIMEZONE: string = 'Europe/Warsaw';

  @IsBoolean()
  @IsOptional()
  HVAC_ENABLE_POLISH_INTEGRATIONS: boolean = true;
}

@Injectable()
export class HvacProductionConfigService {
  private config: HvacProductionConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadAndValidateConfig();
  }

  private loadAndValidateConfig(): HvacProductionConfig {
    // Load environment variables
    const envConfig = {
      HVAC_API_URL: this.configService.get('HVAC_API_URL'),
      HVAC_API_KEY: this.configService.get('HVAC_API_KEY'),
      HVAC_API_VERSION: this.configService.get('HVAC_API_VERSION'),
      HVAC_API_TIMEOUT: this.configService.get('HVAC_API_TIMEOUT'),
      HVAC_API_RETRY_ATTEMPTS: this.configService.get('HVAC_API_RETRY_ATTEMPTS'),
      HVAC_API_RETRY_DELAY: this.configService.get('HVAC_API_RETRY_DELAY'),
      WEAVIATE_HOST: this.configService.get('WEAVIATE_HOST'),
      WEAVIATE_PORT: this.configService.get('WEAVIATE_PORT'),
      WEAVIATE_SCHEME: this.configService.get('WEAVIATE_SCHEME'),
      WEAVIATE_API_KEY: this.configService.get('WEAVIATE_API_KEY'),
      HVAC_ENABLE_HTTPS: this.configService.get('HVAC_ENABLE_HTTPS'),
      HVAC_SSL_CERT_PATH: this.configService.get('HVAC_SSL_CERT_PATH'),
      HVAC_SSL_KEY_PATH: this.configService.get('HVAC_SSL_KEY_PATH'),
      HVAC_CORS_ORIGINS: this.configService.get('HVAC_CORS_ORIGINS'),
      HVAC_RATE_LIMIT_WINDOW: this.configService.get('HVAC_RATE_LIMIT_WINDOW'),
      HVAC_RATE_LIMIT_MAX: this.configService.get('HVAC_RATE_LIMIT_MAX'),
      HVAC_CACHE_ENABLED: this.configService.get('HVAC_CACHE_ENABLED'),
      HVAC_CACHE_TTL: this.configService.get('HVAC_CACHE_TTL'),
      HVAC_MAX_CONCURRENT_REQUESTS: this.configService.get('HVAC_MAX_CONCURRENT_REQUESTS'),
      HVAC_ENABLE_HEALTH_CHECKS: this.configService.get('HVAC_ENABLE_HEALTH_CHECKS'),
      HVAC_HEALTH_CHECK_INTERVAL: this.configService.get('HVAC_HEALTH_CHECK_INTERVAL'),
      HVAC_ENABLE_METRICS: this.configService.get('HVAC_ENABLE_METRICS'),
      HVAC_METRICS_PORT: this.configService.get('HVAC_METRICS_PORT'),
      HVAC_LOG_LEVEL: this.configService.get('HVAC_LOG_LEVEL'),
      HVAC_ENABLE_SENTRY: this.configService.get('HVAC_ENABLE_SENTRY'),
      HVAC_SENTRY_DSN: this.configService.get('HVAC_SENTRY_DSN'),
      HVAC_DEFAULT_LANGUAGE: this.configService.get('HVAC_DEFAULT_LANGUAGE'),
      HVAC_CURRENCY: this.configService.get('HVAC_CURRENCY'),
      HVAC_TIMEZONE: this.configService.get('HVAC_TIMEZONE'),
      HVAC_ENABLE_POLISH_INTEGRATIONS: this.configService.get('HVAC_ENABLE_POLISH_INTEGRATIONS'),
    };

    // Validate configuration
    const validatedConfig = plainToClass(HvacProductionConfigValidator, envConfig);
    const errors = validateSync(validatedConfig);

    if (errors.length > 0) {
      throw new Error(`HVAC Production Configuration validation failed: ${errors.map(e => e.toString()).join(', ')}`);
    }

    // Build production configuration
    return {
      api: {
        url: validatedConfig.HVAC_API_URL,
        key: validatedConfig.HVAC_API_KEY,
        version: validatedConfig.HVAC_API_VERSION,
        timeout: validatedConfig.HVAC_API_TIMEOUT,
        retryAttempts: validatedConfig.HVAC_API_RETRY_ATTEMPTS,
        retryDelay: validatedConfig.HVAC_API_RETRY_DELAY,
      },
      weaviate: {
        host: validatedConfig.WEAVIATE_HOST,
        port: validatedConfig.WEAVIATE_PORT,
        scheme: validatedConfig.WEAVIATE_SCHEME,
        apiKey: validatedConfig.WEAVIATE_API_KEY,
        timeout: 30000,
        maxConnections: 10,
      },
      security: {
        enableHttps: validatedConfig.HVAC_ENABLE_HTTPS,
        sslCertPath: validatedConfig.HVAC_SSL_CERT_PATH,
        sslKeyPath: validatedConfig.HVAC_SSL_KEY_PATH,
        corsOrigins: validatedConfig.HVAC_CORS_ORIGINS?.split(',') || [],
        rateLimitWindow: validatedConfig.HVAC_RATE_LIMIT_WINDOW,
        rateLimitMax: validatedConfig.HVAC_RATE_LIMIT_MAX,
        enableApiKeyAuth: true,
        enableJwtAuth: true,
      },
      performance: {
        cacheEnabled: validatedConfig.HVAC_CACHE_ENABLED,
        cacheTtl: validatedConfig.HVAC_CACHE_TTL,
        maxConcurrentRequests: validatedConfig.HVAC_MAX_CONCURRENT_REQUESTS,
        requestTimeout: validatedConfig.HVAC_API_TIMEOUT,
        enableCompression: true,
        enableKeepAlive: true,
      },
      monitoring: {
        enableHealthChecks: validatedConfig.HVAC_ENABLE_HEALTH_CHECKS,
        healthCheckInterval: validatedConfig.HVAC_HEALTH_CHECK_INTERVAL,
        enableMetrics: validatedConfig.HVAC_ENABLE_METRICS,
        metricsPort: validatedConfig.HVAC_METRICS_PORT,
        enableLogging: true,
        logLevel: validatedConfig.HVAC_LOG_LEVEL,
        enableSentry: validatedConfig.HVAC_ENABLE_SENTRY,
        sentryDsn: validatedConfig.HVAC_SENTRY_DSN,
      },
      features: {
        scheduling: true,
        maintenance: true,
        inventory: true,
        semanticSearch: true,
        aiInsights: true,
        customer360: true,
        mobileApp: true,
        offlineSync: true,
      },
      database: {
        enableConnectionPooling: true,
        maxConnections: 20,
        connectionTimeout: 30000,
        enableSsl: true,
        enableReadReplicas: false,
      },
      localization: {
        defaultLanguage: validatedConfig.HVAC_DEFAULT_LANGUAGE,
        currency: validatedConfig.HVAC_CURRENCY,
        timezone: validatedConfig.HVAC_TIMEZONE,
        dateFormat: 'DD.MM.YYYY',
        enablePolishIntegrations: validatedConfig.HVAC_ENABLE_POLISH_INTEGRATIONS,
      },
    };
  }

  getConfig(): HvacProductionConfig {
    return this.config;
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  validateProductionReadiness(): { isReady: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check required production settings
    if (!this.config.api.key) {
      issues.push('HVAC_API_KEY is required for production');
    }

    if (!this.config.security.enableHttps) {
      issues.push('HTTPS should be enabled in production');
    }

    if (!this.config.security.sslCertPath || !this.config.security.sslKeyPath) {
      issues.push('SSL certificate and key paths are required for HTTPS');
    }

    if (!this.config.monitoring.enableSentry || !this.config.monitoring.sentryDsn) {
      issues.push('Sentry monitoring should be configured for production');
    }

    if (this.config.monitoring.logLevel === 'debug') {
      issues.push('Log level should not be debug in production');
    }

    return {
      isReady: issues.length === 0,
      issues,
    };
  }

  getEnvironmentVariables(): Record<string, string> {
    return {
      // API Configuration
      HVAC_API_URL: this.config.api.url,
      HVAC_API_KEY: this.config.api.key || '',
      HVAC_API_VERSION: this.config.api.version,
      HVAC_API_TIMEOUT: this.config.api.timeout.toString(),

      // Weaviate Configuration
      WEAVIATE_HOST: this.config.weaviate.host,
      WEAVIATE_PORT: this.config.weaviate.port.toString(),
      WEAVIATE_SCHEME: this.config.weaviate.scheme,
      WEAVIATE_API_KEY: this.config.weaviate.apiKey || '',

      // Security Configuration
      HVAC_ENABLE_HTTPS: this.config.security.enableHttps.toString(),
      HVAC_SSL_CERT_PATH: this.config.security.sslCertPath || '',
      HVAC_SSL_KEY_PATH: this.config.security.sslKeyPath || '',
      HVAC_CORS_ORIGINS: this.config.security.corsOrigins.join(','),

      // Performance Configuration
      HVAC_CACHE_ENABLED: this.config.performance.cacheEnabled.toString(),
      HVAC_CACHE_TTL: this.config.performance.cacheTtl.toString(),
      HVAC_MAX_CONCURRENT_REQUESTS: this.config.performance.maxConcurrentRequests.toString(),

      // Monitoring Configuration
      HVAC_ENABLE_HEALTH_CHECKS: this.config.monitoring.enableHealthChecks.toString(),
      HVAC_HEALTH_CHECK_INTERVAL: this.config.monitoring.healthCheckInterval.toString(),
      HVAC_ENABLE_METRICS: this.config.monitoring.enableMetrics.toString(),
      HVAC_METRICS_PORT: this.config.monitoring.metricsPort.toString(),
      HVAC_LOG_LEVEL: this.config.monitoring.logLevel,
      HVAC_ENABLE_SENTRY: this.config.monitoring.enableSentry.toString(),
      HVAC_SENTRY_DSN: this.config.monitoring.sentryDsn || '',

      // Localization Configuration
      HVAC_DEFAULT_LANGUAGE: this.config.localization.defaultLanguage,
      HVAC_CURRENCY: this.config.localization.currency,
      HVAC_TIMEZONE: this.config.localization.timezone,
      HVAC_ENABLE_POLISH_INTEGRATIONS: this.config.localization.enablePolishIntegrations.toString(),
    };
  }
}
}
