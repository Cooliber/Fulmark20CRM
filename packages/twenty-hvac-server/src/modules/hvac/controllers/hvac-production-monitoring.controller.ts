import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { HvacProductionMonitoringService, SystemHealthMetrics, HealthAlert } from '../services/hvac-production-monitoring.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import { HvacDataSyncService } from '../services/hvac-data-sync.service';

export interface ProductionDashboardData {
  health: SystemHealthMetrics;
  performance: {
    apiMetrics: {
      cacheHitRate: number;
      averageResponseTime: number;
      totalRequests: number;
      errorRate: number;
    };
    syncMetrics: {
      lastSync: Date;
      totalSynced: number;
      errors: number;
      isRunning: boolean;
    };
  };
  alerts: HealthAlert[];
  recommendations: string[];
}

export interface ProductionOptimizationReport {
  currentStatus: 'optimal' | 'needs_attention' | 'critical';
  bottlenecks: {
    service: string;
    issue: string;
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
  }[];
  performanceScore: number;
  uptime: number;
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
  }[];
}

@Controller('hvac/production')
export class HvacProductionMonitoringController {
  constructor(
    private readonly monitoringService: HvacProductionMonitoringService,
    private readonly apiService: HvacApiIntegrationService,
    private readonly syncService: HvacDataSyncService,
  ) {}

  @Get('health')
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    return this.monitoringService.getHealthMetrics();
  }

  @Get('health/detailed')
  async getDetailedHealth(): Promise<SystemHealthMetrics> {
    return this.monitoringService.forceHealthCheck();
  }

  @Get('dashboard')
  async getProductionDashboard(): Promise<ProductionDashboardData> {
    const [health, apiMetrics, syncStats] = await Promise.all([
      this.monitoringService.getHealthMetrics(),
      this.apiService.getPerformanceMetrics(),
      this.syncService.getSemanticSearchStats(),
    ]);

    const alerts = this.monitoringService.getActiveAlerts();
    const recommendations = this.generateRecommendations(health, apiMetrics, syncStats);

    return {
      health,
      performance: {
        apiMetrics,
        syncMetrics: {
          lastSync: syncStats.lastSync,
          totalSynced: syncStats.totalSynced,
          errors: syncStats.errors,
          isRunning: syncStats.isRunning,
        },
      },
      alerts,
      recommendations,
    };
  }

  @Get('optimization-report')
  async getOptimizationReport(): Promise<ProductionOptimizationReport> {
    const health = await this.monitoringService.getHealthMetrics();
    const apiMetrics = await this.apiService.getPerformanceMetrics();
    const syncStats = await this.syncService.getSemanticSearchStats();

    const bottlenecks = this.identifyBottlenecks(health, apiMetrics, syncStats);
    const performanceScore = this.calculatePerformanceScore(health, apiMetrics);
    const uptime = this.calculateUptime(health);
    const recommendations = this.generateOptimizationRecommendations(bottlenecks, performanceScore);

    let currentStatus: 'optimal' | 'needs_attention' | 'critical' = 'optimal';
    if (performanceScore < 70) {
      currentStatus = 'critical';
    } else if (performanceScore < 85) {
      currentStatus = 'needs_attention';
    }

    return {
      currentStatus,
      bottlenecks,
      performanceScore,
      uptime,
      recommendations,
    };
  }

  @Get('alerts')
  async getActiveAlerts(): Promise<HealthAlert[]> {
    return this.monitoringService.getActiveAlerts();
  }

  @Post('alerts/clear-resolved')
  async clearResolvedAlerts(): Promise<{ message: string; clearedCount: number }> {
    const beforeCount = this.monitoringService.getActiveAlerts().length;
    this.monitoringService.clearResolvedAlerts();
    const afterCount = this.monitoringService.getActiveAlerts().length;
    
    return {
      message: 'Resolved alerts cleared successfully',
      clearedCount: beforeCount - afterCount,
    };
  }

  @Post('cache/clear')
  async clearCache(): Promise<{ message: string; previousSize: number }> {
    const stats = this.apiService.getCacheStats();
    const previousSize = stats.size;
    
    this.apiService.clearCache();
    
    return {
      message: 'Cache cleared successfully',
      previousSize,
    };
  }

  @Get('performance/metrics')
  async getPerformanceMetrics(): Promise<{
    api: any;
    sync: any;
    system: SystemHealthMetrics;
  }> {
    const [apiMetrics, syncStats, systemHealth] = await Promise.all([
      this.apiService.getPerformanceMetrics(),
      this.syncService.getSemanticSearchStats(),
      this.monitoringService.getHealthMetrics(),
    ]);

    return {
      api: apiMetrics,
      sync: syncStats,
      system: systemHealth,
    };
  }

  @Get('performance/trends')
  async getPerformanceTrends(@Query('hours') hours = 24): Promise<{
    message: string;
    timeRange: string;
    note: string;
  }> {
    // In production, this would return actual trend data from a time-series database
    return {
      message: 'Performance trends endpoint',
      timeRange: `Last ${hours} hours`,
      note: 'This would return actual performance trends in production with proper time-series data storage',
    };
  }

  private generateRecommendations(
    health: SystemHealthMetrics,
    apiMetrics: any,
    syncStats: any
  ): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (apiMetrics.averageResponseTime > 500) {
      recommendations.push('Consider optimizing API response times - current average is above 500ms');
    }

    if (apiMetrics.cacheHitRate < 0.7) {
      recommendations.push('Cache hit rate is below 70% - consider adjusting cache TTL or warming strategies');
    }

    if (apiMetrics.errorRate > 0.02) {
      recommendations.push('Error rate is above 2% - investigate and fix recurring errors');
    }

    // Sync recommendations
    if (syncStats.errors > 0) {
      recommendations.push('Data synchronization errors detected - check sync service logs');
    }

    // Resource recommendations
    if (health.resources.memoryUsage > 0.8) {
      recommendations.push('Memory usage is high - consider scaling or optimizing memory consumption');
    }

    if (health.resources.diskUsage > 0.85) {
      recommendations.push('Disk usage is high - consider cleanup or storage expansion');
    }

    // Service health recommendations
    Object.entries(health.services).forEach(([serviceName, service]) => {
      if (service.status === 'down') {
        recommendations.push(`${serviceName} service is down - immediate attention required`);
      } else if (service.status === 'degraded') {
        recommendations.push(`${serviceName} service is degraded - investigate performance issues`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('System is performing optimally - no immediate recommendations');
    }

    return recommendations;
  }

  private identifyBottlenecks(health: SystemHealthMetrics, apiMetrics: any, syncStats: any): any[] {
    const bottlenecks: any[] = [];

    // API bottlenecks
    if (apiMetrics.averageResponseTime > 1000) {
      bottlenecks.push({
        service: 'HVAC API',
        issue: 'High response times',
        impact: 'high',
        recommendation: 'Optimize database queries and implement connection pooling',
      });
    }

    // Cache bottlenecks
    if (apiMetrics.cacheHitRate < 0.5) {
      bottlenecks.push({
        service: 'Cache',
        issue: 'Low cache hit rate',
        impact: 'medium',
        recommendation: 'Review cache strategy and increase TTL for stable data',
      });
    }

    // Sync bottlenecks
    if (syncStats.isRunning && syncStats.errors > 5) {
      bottlenecks.push({
        service: 'Data Sync',
        issue: 'High error rate during synchronization',
        impact: 'medium',
        recommendation: 'Implement retry logic and error handling improvements',
      });
    }

    // Resource bottlenecks
    if (health.resources.memoryUsage > 0.9) {
      bottlenecks.push({
        service: 'System Resources',
        issue: 'Memory exhaustion',
        impact: 'high',
        recommendation: 'Scale horizontally or optimize memory usage patterns',
      });
    }

    return bottlenecks;
  }

  private calculatePerformanceScore(health: SystemHealthMetrics, apiMetrics: any): number {
    let score = 100;

    // Deduct points for service issues
    Object.values(health.services).forEach(service => {
      if (service.status === 'down') score -= 25;
      else if (service.status === 'degraded') score -= 10;
    });

    // Deduct points for performance issues
    if (apiMetrics.averageResponseTime > 500) score -= 10;
    if (apiMetrics.averageResponseTime > 1000) score -= 15;
    if (apiMetrics.errorRate > 0.02) score -= 15;
    if (apiMetrics.cacheHitRate < 0.7) score -= 10;

    // Deduct points for resource issues
    if (health.resources.memoryUsage > 0.8) score -= 10;
    if (health.resources.memoryUsage > 0.9) score -= 15;
    if (health.resources.diskUsage > 0.85) score -= 10;

    return Math.max(0, score);
  }

  private calculateUptime(health: SystemHealthMetrics): number {
    const services = Object.values(health.services);
    const totalUptime = services.reduce((sum, service) => sum + service.uptime, 0);
    return totalUptime / services.length;
  }

  private generateOptimizationRecommendations(bottlenecks: any[], performanceScore: number): any[] {
    const recommendations: any[] = [];

    if (performanceScore < 70) {
      recommendations.push({
        priority: 'high',
        action: 'Immediate system optimization required',
        expectedImpact: 'Significant performance improvement and stability',
      });
    }

    bottlenecks.forEach(bottleneck => {
      if (bottleneck.impact === 'high') {
        recommendations.push({
          priority: 'high',
          action: bottleneck.recommendation,
          expectedImpact: `Resolve ${bottleneck.issue} in ${bottleneck.service}`,
        });
      }
    });

    if (performanceScore > 85) {
      recommendations.push({
        priority: 'low',
        action: 'Consider implementing advanced monitoring and alerting',
        expectedImpact: 'Proactive issue detection and prevention',
      });
    }

    return recommendations;
  }
}
