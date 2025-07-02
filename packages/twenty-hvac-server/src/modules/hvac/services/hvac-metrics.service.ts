/**
 * HVAC Performance Monitoring and Metrics Service
 * "Pasja rodzi profesjonalizm" - Professional monitoring for Polish HVAC systems
 * 
 * Implements comprehensive metrics collection with Prometheus integration,
 * KPI tracking, and performance alerts for optimal system monitoring
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HvacSentryService, HVACErrorContext } from './hvac-sentry.service';

// Metrics interfaces
export interface HvacKpiMetrics {
  // Performance KPIs
  apiResponseTime: number;
  cacheHitRate: number;
  equipmentConnectivity: number;
  systemUptime: number;
  
  // Business KPIs
  customerSatisfaction: number;
  technicianProductivity: number;
  maintenanceEfficiency: number;
  energyOptimization: number;
  
  // Polish market specific KPIs
  heatingSeasonReadiness: number;
  complianceScore: number;
  weatherAdaptation: number;
  emergencyResponseTime: number;
}

export interface HvacPerformanceMetrics {
  timestamp: number;
  
  // API Performance
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Cache Performance
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  cacheMemoryUsage: number;
  
  // Equipment Metrics
  connectedEquipment: number;
  totalEquipment: number;
  equipmentErrors: number;
  maintenanceAlerts: number;
  
  // Business Metrics
  activeCustomers: number;
  scheduledMaintenance: number;
  completedMaintenance: number;
  technicianUtilization: number;
  
  // Polish specific metrics
  heatingDemand: number;
  coolingDemand: number;
  energyConsumption: number;
  weatherImpact: number;
}

export interface AlertRule {
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  description: string;
}

export interface MetricAlert {
  id: string;
  rule: AlertRule;
  value: number;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

@Injectable()
export class HvacMetricsService implements OnModuleInit {
  private readonly logger = new Logger(HvacMetricsService.name);
  private readonly metrics = new Map<string, number>();
  private readonly timeSeries = new Map<string, Array<{ timestamp: number; value: number }>>();
  private readonly alerts = new Map<string, MetricAlert>();
  private readonly alertCooldowns = new Map<string, number>();
  
  // Metric collection intervals
  private metricsInterval: NodeJS.Timeout;
  private alertsInterval: NodeJS.Timeout;
  
  // Alert rules for Polish HVAC systems
  private readonly ALERT_RULES: AlertRule[] = [
    {
      name: 'High API Response Time',
      metric: 'api_response_time_avg',
      threshold: 200, // 200ms
      operator: 'gt',
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 5,
      description: 'API response time exceeds acceptable threshold'
    },
    {
      name: 'Low Cache Hit Rate',
      metric: 'cache_hit_rate',
      threshold: 0.7, // 70%
      operator: 'lt',
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 10,
      description: 'Cache hit rate below optimal threshold'
    },
    {
      name: 'Equipment Connectivity Issues',
      metric: 'equipment_connectivity_rate',
      threshold: 0.95, // 95%
      operator: 'lt',
      severity: 'high',
      enabled: true,
      cooldownMinutes: 2,
      description: 'Equipment connectivity below acceptable threshold'
    },
    {
      name: 'High Error Rate',
      metric: 'error_rate',
      threshold: 0.05, // 5%
      operator: 'gt',
      severity: 'high',
      enabled: true,
      cooldownMinutes: 3,
      description: 'Error rate exceeds acceptable threshold'
    },
    {
      name: 'Critical System Downtime',
      metric: 'system_uptime',
      threshold: 0.99, // 99%
      operator: 'lt',
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 1,
      description: 'System uptime below critical threshold'
    },
    {
      name: 'Heating Season Readiness',
      metric: 'heating_season_readiness',
      threshold: 0.9, // 90%
      operator: 'lt',
      severity: 'high',
      enabled: true,
      cooldownMinutes: 60,
      description: 'Heating season readiness below required threshold'
    },
    {
      name: 'Emergency Response Time',
      metric: 'emergency_response_time',
      threshold: 30, // 30 minutes
      operator: 'gt',
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 15,
      description: 'Emergency response time exceeds maximum allowed'
    }
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly hvacSentryService: HvacSentryService
  ) {}

  async onModuleInit(): Promise<void> {
    this.startMetricsCollection();
    this.startAlertMonitoring();
    this.logger.log('HVAC Metrics Service initialized');
  }

  private startMetricsCollection(): void {
    const intervalMs = this.configService.get<number>('HVAC_METRICS_INTERVAL_MS', 30000); // 30 seconds
    
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    this.logger.log(`Started metrics collection with ${intervalMs}ms interval`);
  }

  private startAlertMonitoring(): void {
    const intervalMs = this.configService.get<number>('HVAC_ALERTS_INTERVAL_MS', 60000); // 1 minute
    
    this.alertsInterval = setInterval(() => {
      this.checkAlerts();
    }, intervalMs);
    
    this.logger.log(`Started alert monitoring with ${intervalMs}ms interval`);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Collect performance metrics
      await this.collectApiMetrics();
      await this.collectCacheMetrics();
      await this.collectEquipmentMetrics();
      await this.collectBusinessMetrics();
      await this.collectPolishSpecificMetrics();
      
      // Store timestamp for this collection cycle
      this.recordMetric('last_collection_timestamp', timestamp);
      
      this.logger.debug('Metrics collection completed', { timestamp });
      
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'metrics_collection'
        },
        'warning'
      );
    }
  }

  private async collectApiMetrics(): Promise<void> {
    // In production, these would be collected from actual API monitoring
    // For now, we'll use placeholder values that would be replaced with real metrics
    
    const totalRequests = this.getMetric('total_requests') || 0;
    const successfulRequests = this.getMetric('successful_requests') || 0;
    const failedRequests = this.getMetric('failed_requests') || 0;
    
    // Calculate derived metrics
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 1;
    
    this.recordMetric('error_rate', errorRate);
    this.recordMetric('success_rate', successRate);
    
    // Response time metrics (would be collected from actual monitoring)
    const avgResponseTime = this.getMetric('api_response_time_avg') || 150;
    const p95ResponseTime = this.getMetric('api_response_time_p95') || 250;
    const p99ResponseTime = this.getMetric('api_response_time_p99') || 400;
    
    this.recordTimeSeries('api_response_time_avg', avgResponseTime);
    this.recordTimeSeries('api_response_time_p95', p95ResponseTime);
    this.recordTimeSeries('api_response_time_p99', p99ResponseTime);
  }

  private async collectCacheMetrics(): Promise<void> {
    // Cache metrics (would be collected from Redis and L1 cache)
    const cacheHits = this.getMetric('cache_hits') || 0;
    const cacheMisses = this.getMetric('cache_misses') || 0;
    const totalCacheRequests = cacheHits + cacheMisses;
    
    const cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0;
    
    this.recordMetric('cache_hit_rate', cacheHitRate);
    this.recordTimeSeries('cache_hit_rate', cacheHitRate);
    
    // Memory usage (would be collected from actual cache monitoring)
    const cacheMemoryUsage = this.getMetric('cache_memory_usage') || 0;
    this.recordTimeSeries('cache_memory_usage', cacheMemoryUsage);
  }

  private async collectEquipmentMetrics(): Promise<void> {
    // Equipment connectivity metrics
    const connectedEquipment = this.getMetric('connected_equipment') || 0;
    const totalEquipment = this.getMetric('total_equipment') || 1;
    
    const connectivityRate = connectedEquipment / totalEquipment;
    this.recordMetric('equipment_connectivity_rate', connectivityRate);
    this.recordTimeSeries('equipment_connectivity_rate', connectivityRate);
    
    // Equipment health metrics
    const equipmentErrors = this.getMetric('equipment_errors') || 0;
    const maintenanceAlerts = this.getMetric('maintenance_alerts') || 0;
    
    this.recordTimeSeries('equipment_errors', equipmentErrors);
    this.recordTimeSeries('maintenance_alerts', maintenanceAlerts);
  }

  private async collectBusinessMetrics(): Promise<void> {
    // Business KPIs
    const activeCustomers = this.getMetric('active_customers') || 0;
    const scheduledMaintenance = this.getMetric('scheduled_maintenance') || 0;
    const completedMaintenance = this.getMetric('completed_maintenance') || 0;
    
    const maintenanceCompletionRate = scheduledMaintenance > 0 ? 
      completedMaintenance / scheduledMaintenance : 1;
    
    this.recordMetric('maintenance_completion_rate', maintenanceCompletionRate);
    this.recordTimeSeries('active_customers', activeCustomers);
    this.recordTimeSeries('maintenance_completion_rate', maintenanceCompletionRate);
    
    // Technician productivity
    const technicianUtilization = this.getMetric('technician_utilization') || 0.8;
    this.recordTimeSeries('technician_utilization', technicianUtilization);
  }

  private async collectPolishSpecificMetrics(): Promise<void> {
    // Polish market specific metrics
    const currentMonth = new Date().getMonth();
    const isHeatingSeasonMonth = currentMonth >= 9 || currentMonth <= 3; // Oct-Mar
    
    // Heating season readiness (higher importance during heating season)
    const heatingReadiness = this.calculateHeatingSeasonReadiness(isHeatingSeasonMonth);
    this.recordMetric('heating_season_readiness', heatingReadiness);
    this.recordTimeSeries('heating_season_readiness', heatingReadiness);
    
    // Energy optimization metrics
    const energyOptimization = this.getMetric('energy_optimization') || 0.85;
    this.recordTimeSeries('energy_optimization', energyOptimization);
    
    // Weather adaptation metrics
    const weatherAdaptation = this.getMetric('weather_adaptation') || 0.9;
    this.recordTimeSeries('weather_adaptation', weatherAdaptation);
    
    // Emergency response time (critical for Polish winter conditions)
    const emergencyResponseTime = this.getMetric('emergency_response_time') || 25; // minutes
    this.recordTimeSeries('emergency_response_time', emergencyResponseTime);
  }

  private calculateHeatingSeasonReadiness(isHeatingSeasonMonth: boolean): number {
    // Calculate readiness based on multiple factors
    const equipmentReadiness = this.getMetric('equipment_connectivity_rate') || 0.95;
    const maintenanceUpToDate = this.getMetric('maintenance_completion_rate') || 0.9;
    const inventoryReadiness = this.getMetric('inventory_readiness') || 0.85;
    const technicianAvailability = this.getMetric('technician_availability') || 0.8;
    
    // Weight factors differently during heating season
    const weights = isHeatingSeasonMonth ? 
      { equipment: 0.4, maintenance: 0.3, inventory: 0.2, technician: 0.1 } :
      { equipment: 0.3, maintenance: 0.3, inventory: 0.2, technician: 0.2 };
    
    return (
      equipmentReadiness * weights.equipment +
      maintenanceUpToDate * weights.maintenance +
      inventoryReadiness * weights.inventory +
      technicianAvailability * weights.technician
    );
  }

  private checkAlerts(): void {
    const now = Date.now();

    for (const rule of this.ALERT_RULES) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(rule.name);
      if (lastAlert && (now - lastAlert) < (rule.cooldownMinutes * 60 * 1000)) {
        continue;
      }

      const currentValue = this.getMetric(rule.metric);
      if (currentValue === undefined) continue;

      const shouldAlert = this.evaluateAlertCondition(currentValue, rule);

      if (shouldAlert) {
        this.triggerAlert(rule, currentValue);
        this.alertCooldowns.set(rule.name, now);
      }
    }
  }

  private evaluateAlertCondition(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'eq': return value === rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lte': return value <= rule.threshold;
      default: return false;
    }
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    const alertId = `${rule.name}_${Date.now()}`;
    const alert: MetricAlert = {
      id: alertId,
      rule,
      value,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.set(alertId, alert);

    this.logger.warn(`HVAC Alert triggered: ${rule.name}`, {
      alertId,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity
    });

    // Report to Sentry for high and critical alerts
    if (rule.severity === 'high' || rule.severity === 'critical') {
      this.hvacSentryService.reportHVACError(
        new Error(`HVAC Alert: ${rule.name}`),
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'alert_triggered',
          additionalData: {
            alertId,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            severity: rule.severity
          }
        },
        rule.severity === 'critical' ? 'error' : 'warning'
      );
    }
  }

  // Public API methods

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
    this.recordTimeSeries(name, value);
  }

  /**
   * Get current metric value
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Record time series data point
   */
  recordTimeSeries(name: string, value: number): void {
    if (!this.timeSeries.has(name)) {
      this.timeSeries.set(name, []);
    }

    const series = this.timeSeries.get(name)!;
    series.push({ timestamp: Date.now(), value });

    // Keep only last 1000 data points
    if (series.length > 1000) {
      series.splice(0, series.length - 1000);
    }
  }

  /**
   * Get time series data for a metric
   */
  getTimeSeries(name: string, limit?: number): Array<{ timestamp: number; value: number }> {
    const series = this.timeSeries.get(name) || [];
    return limit ? series.slice(-limit) : series;
  }

  /**
   * Get current KPI metrics
   */
  getCurrentKpis(): HvacKpiMetrics {
    return {
      // Performance KPIs
      apiResponseTime: this.getMetric('api_response_time_avg') || 0,
      cacheHitRate: this.getMetric('cache_hit_rate') || 0,
      equipmentConnectivity: this.getMetric('equipment_connectivity_rate') || 0,
      systemUptime: this.getMetric('system_uptime') || 1,

      // Business KPIs
      customerSatisfaction: this.getMetric('customer_satisfaction') || 0.85,
      technicianProductivity: this.getMetric('technician_utilization') || 0.8,
      maintenanceEfficiency: this.getMetric('maintenance_completion_rate') || 0.9,
      energyOptimization: this.getMetric('energy_optimization') || 0.85,

      // Polish market specific KPIs
      heatingSeasonReadiness: this.getMetric('heating_season_readiness') || 0.9,
      complianceScore: this.getMetric('compliance_score') || 0.95,
      weatherAdaptation: this.getMetric('weather_adaptation') || 0.9,
      emergencyResponseTime: this.getMetric('emergency_response_time') || 25
    };
  }

  /**
   * Get current performance metrics
   */
  getCurrentPerformanceMetrics(): HvacPerformanceMetrics {
    return {
      timestamp: Date.now(),

      // API Performance
      totalRequests: this.getMetric('total_requests') || 0,
      successfulRequests: this.getMetric('successful_requests') || 0,
      failedRequests: this.getMetric('failed_requests') || 0,
      averageResponseTime: this.getMetric('api_response_time_avg') || 0,
      p95ResponseTime: this.getMetric('api_response_time_p95') || 0,
      p99ResponseTime: this.getMetric('api_response_time_p99') || 0,

      // Cache Performance
      cacheHits: this.getMetric('cache_hits') || 0,
      cacheMisses: this.getMetric('cache_misses') || 0,
      cacheEvictions: this.getMetric('cache_evictions') || 0,
      cacheMemoryUsage: this.getMetric('cache_memory_usage') || 0,

      // Equipment Metrics
      connectedEquipment: this.getMetric('connected_equipment') || 0,
      totalEquipment: this.getMetric('total_equipment') || 0,
      equipmentErrors: this.getMetric('equipment_errors') || 0,
      maintenanceAlerts: this.getMetric('maintenance_alerts') || 0,

      // Business Metrics
      activeCustomers: this.getMetric('active_customers') || 0,
      scheduledMaintenance: this.getMetric('scheduled_maintenance') || 0,
      completedMaintenance: this.getMetric('completed_maintenance') || 0,
      technicianUtilization: this.getMetric('technician_utilization') || 0,

      // Polish specific metrics
      heatingDemand: this.getMetric('heating_demand') || 0,
      coolingDemand: this.getMetric('cooling_demand') || 0,
      energyConsumption: this.getMetric('energy_consumption') || 0,
      weatherImpact: this.getMetric('weather_impact') || 0
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MetricAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolvedAt);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.logger.log(`Alert acknowledged: ${alertId}`);
    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolvedAt = Date.now();
    this.logger.log(`Alert resolved: ${alertId}`);
    return true;
  }

  /**
   * Get metrics for Prometheus export
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Add help and type information
    lines.push('# HELP hvac_api_response_time_seconds API response time in seconds');
    lines.push('# TYPE hvac_api_response_time_seconds gauge');

    // Export current metrics in Prometheus format
    for (const [name, value] of this.metrics.entries()) {
      const prometheusName = `hvac_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      lines.push(`${prometheusName} ${value}`);
    }

    return lines.join('\n');
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1): void {
    const current = this.getMetric(name) || 0;
    this.recordMetric(name, current + value);
  }

  /**
   * Record a histogram value (simplified implementation)
   */
  recordHistogram(name: string, value: number): void {
    // Record the value
    this.recordMetric(`${name}_current`, value);

    // Update count
    this.incrementCounter(`${name}_count`);

    // Update sum
    const currentSum = this.getMetric(`${name}_sum`) || 0;
    this.recordMetric(`${name}_sum`, currentSum + value);

    // Calculate average
    const count = this.getMetric(`${name}_count`) || 1;
    const sum = this.getMetric(`${name}_sum`) || value;
    this.recordMetric(`${name}_avg`, sum / count);
  }

  /**
   * Get health status based on KPIs
   */
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: Record<string, unknown> } {
    const kpis = this.getCurrentKpis();
    const activeAlerts = this.getActiveAlerts();

    const criticalAlerts = activeAlerts.filter(a => a.rule.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.rule.severity === 'high');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (criticalAlerts.length > 0 || kpis.systemUptime < 0.99) {
      status = 'unhealthy';
    } else if (highAlerts.length > 0 || kpis.equipmentConnectivity < 0.95) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        kpis,
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length,
        lastUpdate: this.getMetric('last_collection_timestamp')
      }
    };
  }

  /**
   * Cleanup method for module destruction
   */
  onModuleDestroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }
    this.logger.log('HVAC Metrics Service destroyed');
  }
}
