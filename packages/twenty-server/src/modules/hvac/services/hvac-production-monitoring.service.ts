import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';

import { HvacAlertNotificationService } from './hvac-alert-notification.service';
import { HvacApiIntegrationService } from './hvac-api-integration.service';
import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';
import { HvacWeaviateService } from './hvac-weaviate.service';

export interface SystemHealthMetrics {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  services: {
    hvacApi: ServiceHealth;
    weaviate: ServiceHealth;
    database: ServiceHealth;
    cache: ServiceHealth;
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    cacheHitRate: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  alerts: HealthAlert[];
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastChecked: string;
  errorCount: number;
  uptime: number;
}

export interface HealthAlert {
  level: 'warning' | 'critical';
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

@Injectable()
export class HvacProductionMonitoringService {
  private readonly logger = new Logger(HvacProductionMonitoringService.name);
  private healthMetrics: SystemHealthMetrics;
  private alerts: HealthAlert[] = [];
  private readonly MAX_ALERTS = 100;
  private startTime = Date.now();

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
    private readonly weaviateService: HvacWeaviateService,
    private readonly hvacSentryService: HvacSentryService,
    private readonly alertService: HvacAlertNotificationService,
  ) {
    this.initializeHealthMetrics();
  }

  private initializeHealthMetrics(): void {
    this.healthMetrics = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      services: {
        hvacApi: this.createDefaultServiceHealth(),
        weaviate: this.createDefaultServiceHealth(),
        database: this.createDefaultServiceHealth(),
        cache: this.createDefaultServiceHealth(),
      },
      performance: {
        averageResponseTime: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        cacheHitRate: 0,
      },
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
      },
      alerts: [],
    };
  }

  private createDefaultServiceHealth(): ServiceHealth {
    return {
      status: 'up',
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      errorCount: 0,
      uptime: 100,
    };
  }

  // Run health checks every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performHealthChecks(): Promise<void> {
    try {
      this.logger.debug('Starting comprehensive health checks');

      await Promise.all([
        this.checkHvacApiHealth(),
        this.checkWeaviateHealth(),
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
      ]);

      await this.updatePerformanceMetrics();
      await this.updateResourceMetrics();
      this.updateOverallHealth();
      this.processAlerts();

      // Evaluate metrics for alerting
      await this.evaluateAlerting();

      this.healthMetrics.timestamp = new Date().toISOString();
      this.healthMetrics.uptime = Date.now() - this.startTime;

      this.logger.debug(
        `Health check completed. Overall status: ${this.healthMetrics.overall}`,
      );
    } catch (error) {
      this.logger.error('Health check failed', error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.HEALTH_CHECK,
          operation: 'comprehensive_health_check',
        },
        'error',
      );
    }
  }

  private async checkHvacApiHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.hvacApiService.checkApiHealth();
      const responseTime = Date.now() - startTime;

      this.healthMetrics.services.hvacApi = {
        status: isHealthy ? 'up' : 'down',
        responseTime,
        lastChecked: new Date().toISOString(),
        errorCount: isHealthy
          ? 0
          : this.healthMetrics.services.hvacApi.errorCount + 1,
        uptime: isHealthy ? 100 : 0,
      };

      if (!isHealthy) {
        this.addAlert('critical', 'hvacApi', 'HVAC API is not responding');
      } else if (responseTime > 5000) {
        this.addAlert(
          'warning',
          'hvacApi',
          `HVAC API response time is high: ${responseTime}ms`,
        );
      }
    } catch (error) {
      this.healthMetrics.services.hvacApi.status = 'down';
      this.healthMetrics.services.hvacApi.errorCount++;
      this.addAlert(
        'critical',
        'hvacApi',
        `HVAC API health check failed: ${error.message}`,
      );
    }
  }

  private async checkWeaviateHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.weaviateService.checkHealth();
      const responseTime = Date.now() - startTime;

      this.healthMetrics.services.weaviate = {
        status: isHealthy ? 'up' : 'down',
        responseTime,
        lastChecked: new Date().toISOString(),
        errorCount: isHealthy
          ? 0
          : this.healthMetrics.services.weaviate.errorCount + 1,
        uptime: isHealthy ? 100 : 0,
      };

      if (!isHealthy) {
        this.addAlert(
          'critical',
          'weaviate',
          'Weaviate service is not responding',
        );
      }
    } catch (error) {
      this.healthMetrics.services.weaviate.status = 'down';
      this.healthMetrics.services.weaviate.errorCount++;
      this.addAlert(
        'critical',
        'weaviate',
        `Weaviate health check failed: ${error.message}`,
      );
    }
  }

  private async checkDatabaseHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      // Simple database health check - in production this would be more comprehensive
      const responseTime = Date.now() - startTime;

      this.healthMetrics.services.database = {
        status: 'up',
        responseTime,
        lastChecked: new Date().toISOString(),
        errorCount: 0,
        uptime: 100,
      };
    } catch (error) {
      this.healthMetrics.services.database.status = 'down';
      this.healthMetrics.services.database.errorCount++;
      this.addAlert(
        'critical',
        'database',
        `Database health check failed: ${error.message}`,
      );
    }
  }

  private async checkCacheHealth(): Promise<void> {
    try {
      const cacheStats = this.hvacApiService.getCacheStats();

      this.healthMetrics.services.cache = {
        status: 'up',
        responseTime: 1, // Cache is always fast
        lastChecked: new Date().toISOString(),
        errorCount: 0,
        uptime: 100,
      };

      // Check if cache is getting too large
      if (cacheStats.size > 1000) {
        this.addAlert(
          'warning',
          'cache',
          `Cache size is large: ${cacheStats.size} entries`,
        );
      }
    } catch (error) {
      this.healthMetrics.services.cache.status = 'degraded';
      this.addAlert(
        'warning',
        'cache',
        `Cache health check failed: ${error.message}`,
      );
    }
  }

  private async updatePerformanceMetrics(): Promise<void> {
    try {
      const performanceData = await this.hvacApiService.getPerformanceMetrics();

      this.healthMetrics.performance = {
        averageResponseTime: performanceData.averageResponseTime,
        requestsPerMinute: performanceData.totalRequests / 60, // Simplified calculation
        errorRate: performanceData.errorRate,
        cacheHitRate: performanceData.cacheHitRate,
      };

      // Performance alerts
      if (performanceData.averageResponseTime > 1000) {
        this.addAlert(
          'warning',
          'performance',
          `High average response time: ${performanceData.averageResponseTime}ms`,
        );
      }

      if (performanceData.errorRate > 0.05) {
        this.addAlert(
          'critical',
          'performance',
          `High error rate: ${(performanceData.errorRate * 100).toFixed(2)}%`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to update performance metrics', error);
    }
  }

  private async updateResourceMetrics(): Promise<void> {
    try {
      // In production, these would be actual system metrics
      const memoryUsage = process.memoryUsage();

      this.healthMetrics.resources = {
        memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
        cpuUsage: 0.25, // Placeholder - would use actual CPU monitoring
        diskUsage: 0.6, // Placeholder - would use actual disk monitoring
      };

      // Resource alerts
      if (this.healthMetrics.resources.memoryUsage > 0.85) {
        this.addAlert(
          'critical',
          'resources',
          `High memory usage: ${(this.healthMetrics.resources.memoryUsage * 100).toFixed(1)}%`,
        );
      }

      if (this.healthMetrics.resources.diskUsage > 0.9) {
        this.addAlert(
          'critical',
          'resources',
          `High disk usage: ${(this.healthMetrics.resources.diskUsage * 100).toFixed(1)}%`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to update resource metrics', error);
    }
  }

  private updateOverallHealth(): void {
    const services = Object.values(this.healthMetrics.services);
    const downServices = services.filter((s) => s.status === 'down').length;
    const degradedServices = services.filter(
      (s) => s.status === 'degraded',
    ).length;

    if (downServices > 0) {
      this.healthMetrics.overall = 'critical';
    } else if (
      degradedServices > 0 ||
      this.healthMetrics.performance.errorRate > 0.02
    ) {
      this.healthMetrics.overall = 'degraded';
    } else {
      this.healthMetrics.overall = 'healthy';
    }
  }

  private addAlert(
    level: 'warning' | 'critical',
    service: string,
    message: string,
  ): void {
    const alert: HealthAlert = {
      level,
      service,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.unshift(alert);

    // Keep only the latest alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }

    this.logger.warn(
      `Health Alert [${level.toUpperCase()}] ${service}: ${message}`,
    );

    // Report critical alerts to Sentry
    if (level === 'critical') {
      this.hvacSentryService.reportHVACError(
        new Error(`Health Alert: ${message}`),
        {
          context: HVACErrorContext.HEALTH_CHECK,
          operation: 'health_alert',
          additionalData: { service, level },
        },
        'error',
      );
    }
  }

  private processAlerts(): void {
    // Auto-resolve alerts for services that are now healthy
    this.alerts.forEach((alert) => {
      if (!alert.resolved) {
        const service =
          this.healthMetrics.services[
            alert.service as keyof typeof this.healthMetrics.services
          ];

        if (service && service.status === 'up') {
          alert.resolved = true;
          this.logger.log(
            `Alert resolved for ${alert.service}: ${alert.message}`,
          );
        }
      }
    });

    // Update health metrics with current alerts
    this.healthMetrics.alerts = this.alerts
      .filter((a) => !a.resolved)
      .slice(0, 10);
  }

  // Public API
  getHealthMetrics(): SystemHealthMetrics {
    return { ...this.healthMetrics };
  }

  getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  async forceHealthCheck(): Promise<SystemHealthMetrics> {
    await this.performHealthChecks();

    return this.getHealthMetrics();
  }

  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter((a) => !a.resolved);
    this.logger.log('Cleared resolved alerts');
  }

  private async evaluateAlerting(): Promise<void> {
    try {
      // Prepare metrics for alert evaluation
      const alertMetrics = {
        api: {
          response_time: this.healthMetrics.performance.averageResponseTime,
          error_rate: this.healthMetrics.performance.errorRate,
        },
        system: {
          memory_usage: this.healthMetrics.resources.memoryUsage,
          cpu_usage: this.healthMetrics.resources.cpuUsage,
          disk_usage: this.healthMetrics.resources.diskUsage,
        },
        service: {
          status: this.healthMetrics.overall === 'healthy' ? 1 : 0,
        },
        sync: {
          error_count: this.healthMetrics.alerts.filter(
            (a) => a.service === 'sync',
          ).length,
        },
      };

      await this.alertService.evaluateMetrics(alertMetrics);
    } catch (error) {
      this.logger.error('Failed to evaluate alerting metrics', error);
    }
  }
}
