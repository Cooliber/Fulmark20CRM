/**
 * HVAC Equipment Management Microservice
 * "Pasja rodzi profesjonalizm" - Professional equipment management for Polish HVAC systems
 *
 * Dedicated microservice for equipment lifecycle, health monitoring, IoT integration,
 * and predictive maintenance specifically designed for Polish HVAC market
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { HvacCircuitBreakerService } from '../services/hvac-circuit-breaker.service';
import { HvacErrorHandlerService } from '../services/hvac-error-handler.service';
import { HvacMetricsService } from '../services/hvac-metrics.service';
import { HvacRedisCacheService } from '../services/hvac-redis-cache.service';
import {
    HvacEquipmentCondition,
    HvacEquipmentStatus,
    HvacEquipmentWorkspaceEntity,
} from '../standard-objects/hvac-equipment.workspace-entity';

// Equipment-specific interfaces
export interface EquipmentHealthData {
  equipmentId: string;
  healthScore: number; // 0-100
  status: HvacEquipmentStatus;
  condition: HvacEquipmentCondition;
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  operationalMetrics: {
    efficiency: number;
    energyConsumption: number;
    runtime: number;
    errorCount: number;
  };
  iotSensorData?: IoTSensorReading[];
  predictiveInsights: {
    failureRisk: 'low' | 'medium' | 'high' | 'critical';
    recommendedActions: string[];
    estimatedLifeRemaining: number; // in months
  };
}

export interface IoTSensorReading {
  sensorId: string;
  timestamp: Date;
  sensorType:
    | 'temperature'
    | 'pressure'
    | 'humidity'
    | 'vibration'
    | 'energy'
    | 'airflow';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  thresholds: {
    min: number;
    max: number;
    optimal: number;
  };
}

export interface PolishEquipmentContext {
  manufacturer:
    | 'Vaillant'
    | 'Viessmann'
    | 'Bosch'
    | 'Junkers'
    | 'Buderus'
    | 'Other';
  model: string;
  serialNumber: string;
  installationYear: number;
  heatingType: 'gas' | 'electric' | 'heat_pump' | 'biomass' | 'hybrid';
  buildingType: 'residential' | 'commercial' | 'industrial';
  region: 'warsaw' | 'krakow' | 'gdansk' | 'wroclaw' | 'poznan' | 'other';
  complianceStandards: string[]; // Polish/EU standards
  energyClass: 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface MaintenanceSchedule {
  equipmentId: string;
  scheduleType: 'preventive' | 'corrective' | 'emergency' | 'seasonal';
  scheduledDate: Date;
  estimatedDuration: number; // in minutes
  technicianId?: string;
  requiredParts: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  seasonalContext?: {
    season: 'heating' | 'cooling' | 'transition';
    weatherForecast: string;
    demandLevel: 'low' | 'medium' | 'high';
  };
}

@Injectable()
export class EquipmentManagementService {
  private readonly logger = new Logger(EquipmentManagementService.name);

  constructor(
    @InjectRepository(HvacEquipmentWorkspaceEntity)
    private readonly equipmentRepository: Repository<HvacEquipmentWorkspaceEntity>,
    private readonly _configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly circuitBreakerService: HvacCircuitBreakerService,
    private readonly errorHandlerService: HvacErrorHandlerService,
    private readonly metricsService: HvacMetricsService,
    private readonly cacheService: HvacRedisCacheService,
  ) {}

  /**
   * Get comprehensive equipment health data with Polish market context
   */
  async getEquipmentHealth(equipmentId: string): Promise<EquipmentHealthData> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.cacheService.generateKey(
        'EQUIPMENT',
        `health:${equipmentId}`,
      );
      const cachedData =
        await this.cacheService.get<EquipmentHealthData>(cacheKey);

      if (cachedData) {
        this.metricsService.recordMetric('equipment_cache_hits', 1);

        return cachedData;
      }

      // Use circuit breaker for database operations
      const healthData = await this.circuitBreakerService.execute(
        'EQUIPMENT_DATABASE',
        async () => {
          const equipment = await this.equipmentRepository.findOne({
            where: { id: equipmentId },
            relations: ['maintenanceRecords', 'serviceTickets'],
          });

          if (!equipment) {
            throw this.errorHandlerService.createEquipmentError(
              `Equipment not found: ${equipmentId}`,
              new Error('Equipment not found'),
              equipmentId,
            );
          }

          return await this.calculateEquipmentHealth(equipment);
        },
        {
          fallbackValue: await this.getEquipmentHealthFallback(equipmentId),
        },
      );

      // Cache the result
      await this.cacheService.set(cacheKey, healthData, {
        ttl: 300, // 5 minutes for equipment health
        tags: ['equipment', equipmentId],
      });

      // Record metrics
      this.metricsService.recordHistogram(
        'equipment_health_response_time',
        Date.now() - startTime,
      );
      this.metricsService.incrementCounter('equipment_health_requests');

      return healthData;
    } catch (error) {
      const hvacError = this.errorHandlerService.createEquipmentError(
        `Failed to get equipment health for ${equipmentId}`,
        error as Error,
        equipmentId,
      );

      // Try to recover with cached data
      const fallbackData =
        await this.errorHandlerService.handleErrorWithRecovery(hvacError, () =>
          this.getEquipmentHealthFallback(equipmentId),
        );

      if (fallbackData) {
        return fallbackData;
      }

      throw hvacError;
    }
  }

  /**
   * Schedule maintenance with Polish seasonal context
   */
  async scheduleMaintenanceCheck(
    equipmentId: string,
    scheduledDate: Date,
    context?: Partial<PolishEquipmentContext>,
  ): Promise<MaintenanceSchedule> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw this.errorHandlerService.createEquipmentError(
          `Equipment not found for scheduling: ${equipmentId}`,
          new Error('Equipment not found'),
          equipmentId,
        );
      }

      // Determine seasonal context for Polish market
      const seasonalContext = this.determineSeasonalContext(
        scheduledDate,
        context,
      );

      // Calculate maintenance priority based on equipment health and season
      const healthData = await this.getEquipmentHealth(equipmentId);
      const priority = this.calculateMaintenancePriority(
        healthData,
        seasonalContext,
      );

      const maintenanceSchedule: MaintenanceSchedule = {
        equipmentId,
        scheduleType: this.determineMaintenanceType(
          healthData,
          seasonalContext,
        ),
        scheduledDate,
        estimatedDuration: this.estimateMaintenanceDuration(
          equipment,
          seasonalContext,
        ),
        requiredParts: await this.identifyRequiredParts(
          equipmentId,
          healthData,
        ),
        priority,
        seasonalContext,
      };

      // Emit event for scheduling service
      this.eventEmitter.emit('maintenance.scheduled', {
        equipmentId,
        schedule: maintenanceSchedule,
        timestamp: new Date(),
      });

      // Cache the schedule
      const cacheKey = this.cacheService.generateKey(
        'MAINTENANCE',
        `schedule:${equipmentId}`,
      );

      await this.cacheService.set(cacheKey, maintenanceSchedule, {
        ttl: 1800, // 30 minutes
        tags: ['maintenance', equipmentId],
      });

      this.logger.log(`Maintenance scheduled for equipment ${equipmentId}`, {
        scheduledDate,
        priority,
        seasonalContext,
      });

      return maintenanceSchedule;
    } catch (error) {
      throw this.errorHandlerService.createMaintenanceError(
        `Failed to schedule maintenance for equipment ${equipmentId}`,
        error as Error,
        undefined,
        undefined,
        { equipmentId },
      );
    }
  }

  /**
   * Get real-time IoT sensor data for Polish HVAC equipment
   */
  async getIoTSensorData(equipmentId: string): Promise<IoTSensorReading[]> {
    try {
      // Use circuit breaker for IoT device communication
      return await this.circuitBreakerService.executeForEquipmentType(
        'IOT_DEVICE',
        async () => {
          const cacheKey = this.cacheService.generateKey(
            'EQUIPMENT',
            `iot_sensors:${equipmentId}`,
          );
          const cachedData =
            await this.cacheService.get<IoTSensorReading[]>(cacheKey);

          if (cachedData) {
            return cachedData;
          }

          // Simulate IoT data collection (in production, this would connect to actual IoT devices)
          const sensorData = await this.collectIoTSensorData(equipmentId);

          // Cache sensor data briefly (real-time data shouldn't be cached too long)
          await this.cacheService.set(cacheKey, sensorData, {
            ttl: 60, // 1 minute for IoT data
            tags: ['iot', equipmentId],
          });

          return sensorData;
        },
        {
          fallbackFunction: () => this.getHistoricalSensorData(equipmentId),
        },
      );
    } catch (error) {
      throw this.errorHandlerService.createIoTDeviceError(
        `Failed to get IoT sensor data for equipment ${equipmentId}`,
        error as Error,
        equipmentId,
      );
    }
  }

  /**
   * Update equipment status with Polish compliance validation
   */
  async updateEquipmentStatus(
    equipmentId: string,
    status: HvacEquipmentStatus,
    context?: PolishEquipmentContext,
  ): Promise<void> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      // Validate status change against Polish regulations
      await this.validateStatusChangeCompliance(equipment, status, context);

      // Update equipment status
      equipment.status = status;
      // Note: updatedAt would be handled by TypeORM automatically

      await this.equipmentRepository.save(equipment);

      // Invalidate related cache entries
      await this.cacheService.invalidateByTags([equipmentId, 'equipment']);

      // Emit status change event
      this.eventEmitter.emit('equipment.status.changed', {
        equipmentId,
        oldStatus: equipment.status,
        newStatus: status,
        timestamp: new Date(),
        context,
      });

      this.logger.log(`Equipment status updated: ${equipmentId} -> ${status}`);
    } catch (error) {
      throw this.errorHandlerService.createEquipmentError(
        `Failed to update equipment status for ${equipmentId}`,
        error as Error,
        equipmentId,
        {},
        context
          ? {
              equipmentBrand: context.manufacturer,
              heatingType:
                context.heatingType === 'hybrid'
                  ? 'heat_pump'
                  : context.heatingType,
              buildingType: context.buildingType,
              region: context.region,
            }
          : undefined,
      );
    }
  }

  // Helper methods

  private async calculateEquipmentHealth(
    equipment: HvacEquipmentWorkspaceEntity,
  ): Promise<EquipmentHealthData> {
    // Calculate health score based on multiple factors
    const ageScore = this.calculateAgeScore(equipment.installationDate);
    const maintenanceScore = this.calculateMaintenanceScore(
      equipment.maintenanceRecords || [],
    );
    const operationalScore = this.calculateOperationalScore(equipment);

    const healthScore = Math.round(
      (ageScore + maintenanceScore + operationalScore) / 3,
    );

    return {
      equipmentId: equipment.id,
      healthScore,
      status: equipment.status,
      condition: equipment.condition,
      lastMaintenanceDate: this.getLastMaintenanceDate(
        equipment.maintenanceRecords || [],
      ),
      nextMaintenanceDate: this.calculateNextMaintenanceDate(equipment),
      operationalMetrics: {
        efficiency: this.calculateEfficiency(equipment),
        energyConsumption:
          typeof equipment.energyRating === 'number'
            ? equipment.energyRating
            : 0,
        runtime: this.calculateRuntime(equipment),
        errorCount: this.getErrorCount(equipment),
      },
      predictiveInsights: {
        failureRisk: this.assessFailureRisk(healthScore),
        recommendedActions: this.generateRecommendations(
          equipment,
          healthScore,
        ),
        estimatedLifeRemaining: this.estimateLifeRemaining(
          equipment,
          healthScore,
        ),
      },
    };
  }

  private calculateAgeScore(installationDate: Date): number {
    const ageInYears =
      (Date.now() - installationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Score decreases with age, typical HVAC equipment lasts 15-20 years
    return Math.max(0, 100 - (ageInYears / 20) * 100);
  }

  private calculateMaintenanceScore(maintenanceRecords: any[]): number {
    if (maintenanceRecords.length === 0) return 50; // No maintenance history

    const recentMaintenance = maintenanceRecords.filter(
      (record) =>
        Date.now() - new Date(record.completedAt).getTime() <
        365 * 24 * 60 * 60 * 1000,
    );

    // Score based on maintenance frequency and recency
    return Math.min(100, recentMaintenance.length * 25);
  }

  private calculateOperationalScore(
    equipment: HvacEquipmentWorkspaceEntity,
  ): number {
    // Base score on equipment condition and status
    let score = 100;

    switch (equipment.condition) {
      case HvacEquipmentCondition.EXCELLENT:
        score = 100;
        break;
      case HvacEquipmentCondition.GOOD:
        score = 80;
        break;
      case HvacEquipmentCondition.FAIR:
        score = 60;
        break;
      case HvacEquipmentCondition.POOR:
        score = 40;
        break;
      default:
        score = 70;
    }

    if (equipment.status !== HvacEquipmentStatus.OPERATIONAL) {
      score *= 0.5; // Reduce score for non-operational equipment
    }

    return score;
  }

  private determineSeasonalContext(
    scheduledDate: Date,
    _context?: Partial<PolishEquipmentContext>,
  ) {
    const month = scheduledDate.getMonth();
    let season: 'heating' | 'cooling' | 'transition';

    // Polish heating season typically October to March
    if (month >= 9 || month <= 2) {
      season = 'heating';
    } else if (month >= 5 && month <= 7) {
      season = 'cooling';
    } else {
      season = 'transition';
    }

    return {
      season,
      weatherForecast: 'Variable', // Would integrate with weather API
      demandLevel:
        season === 'heating' ? 'high' : ('medium' as 'low' | 'medium' | 'high'),
    };
  }

  private calculateMaintenancePriority(
    healthData: EquipmentHealthData,
    seasonalContext: any,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (
      healthData.healthScore < 30 ||
      healthData.predictiveInsights.failureRisk === 'critical'
    ) {
      return 'critical';
    }

    if (healthData.healthScore < 50 || seasonalContext.season === 'heating') {
      return 'high';
    }

    if (healthData.healthScore < 70) {
      return 'medium';
    }

    return 'low';
  }

  private determineMaintenanceType(
    healthData: EquipmentHealthData,
    seasonalContext: any,
  ): 'preventive' | 'corrective' | 'emergency' | 'seasonal' {
    if (healthData.predictiveInsights.failureRisk === 'critical') {
      return 'emergency';
    }

    if (healthData.healthScore < 50) {
      return 'corrective';
    }

    if (
      seasonalContext.season === 'heating' ||
      seasonalContext.season === 'cooling'
    ) {
      return 'seasonal';
    }

    return 'preventive';
  }

  private estimateMaintenanceDuration(
    _equipment: HvacEquipmentWorkspaceEntity,
    seasonalContext: { season: string },
  ): number {
    // Base duration in minutes
    let duration = 120; // 2 hours base

    // Adjust based on equipment type and seasonal context
    if (seasonalContext.season === 'heating') {
      duration += 30; // Extra time for heating season prep
    }

    return duration;
  }

  private async identifyRequiredParts(
    _equipmentId: string,
    healthData: EquipmentHealthData,
  ): Promise<string[]> {
    const parts: string[] = [];

    // Basic maintenance parts
    parts.push('filters', 'lubricants');

    // Add parts based on health score and condition
    if (healthData.healthScore < 70) {
      parts.push('seals', 'sensors');
    }

    if (
      healthData.predictiveInsights.failureRisk === 'high' ||
      healthData.predictiveInsights.failureRisk === 'critical'
    ) {
      parts.push('backup_components', 'emergency_parts');
    }

    return parts;
  }

  private async collectIoTSensorData(
    equipmentId: string,
  ): Promise<IoTSensorReading[]> {
    // Simulate IoT sensor data collection
    // In production, this would connect to actual IoT devices
    const sensorTypes: IoTSensorReading['sensorType'][] = [
      'temperature',
      'pressure',
      'humidity',
      'energy',
    ];

    return sensorTypes.map((type) => ({
      sensorId: `${equipmentId}_${type}`,
      timestamp: new Date(),
      sensorType: type,
      value: this.generateMockSensorValue(type),
      unit: this.getSensorUnit(type),
      status: 'normal' as const,
      thresholds: this.getSensorThresholds(type),
    }));
  }

  private generateMockSensorValue(
    type: IoTSensorReading['sensorType'],
  ): number {
    switch (type) {
      case 'temperature':
        return 20 + Math.random() * 10; // 20-30°C
      case 'pressure':
        return 1 + Math.random() * 0.5; // 1-1.5 bar
      case 'humidity':
        return 40 + Math.random() * 20; // 40-60%
      case 'energy':
        return 1000 + Math.random() * 500; // 1000-1500W
      default:
        return Math.random() * 100;
    }
  }

  private getSensorUnit(type: IoTSensorReading['sensorType']): string {
    switch (type) {
      case 'temperature':
        return '°C';
      case 'pressure':
        return 'bar';
      case 'humidity':
        return '%';
      case 'energy':
        return 'W';
      default:
        return 'unit';
    }
  }

  private getSensorThresholds(type: IoTSensorReading['sensorType']) {
    switch (type) {
      case 'temperature':
        return { min: 15, max: 35, optimal: 22 };
      case 'pressure':
        return { min: 0.8, max: 2.0, optimal: 1.2 };
      case 'humidity':
        return { min: 30, max: 70, optimal: 50 };
      case 'energy':
        return { min: 500, max: 2000, optimal: 1200 };
      default:
        return { min: 0, max: 100, optimal: 50 };
    }
  }

  private async getEquipmentHealthFallback(
    equipmentId: string,
  ): Promise<EquipmentHealthData> {
    // Return basic health data as fallback
    return {
      equipmentId,
      healthScore: 75, // Assume reasonable health
      status: HvacEquipmentStatus.OPERATIONAL,
      condition: HvacEquipmentCondition.GOOD,
      lastMaintenanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      operationalMetrics: {
        efficiency: 80,
        energyConsumption: 1200,
        runtime: 8,
        errorCount: 0,
      },
      predictiveInsights: {
        failureRisk: 'low',
        recommendedActions: ['Schedule routine maintenance'],
        estimatedLifeRemaining: 60, // 5 years
      },
    };
  }

  private async getHistoricalSensorData(
    _equipmentId: string,
  ): Promise<IoTSensorReading[]> {
    // Return historical data as fallback
    return [];
  }

  private async validateStatusChangeCompliance(
    equipment: HvacEquipmentWorkspaceEntity,
    newStatus: HvacEquipmentStatus,
    _context?: PolishEquipmentContext,
  ): Promise<void> {
    // Validate against Polish/EU regulations
    if (
      newStatus === HvacEquipmentStatus.OPERATIONAL &&
      equipment.condition === HvacEquipmentCondition.POOR
    ) {
      throw new Error(
        'Cannot set equipment to operational with poor condition - Polish safety regulations',
      );
    }

    // Additional compliance checks would go here
  }

  // Utility methods
  private getLastMaintenanceDate(maintenanceRecords: any[]): Date {
    if (maintenanceRecords.length === 0) {
      return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    }

    const sortedRecords = maintenanceRecords.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

    return new Date(sortedRecords[0].completedAt);
  }

  private calculateNextMaintenanceDate(
    equipment: HvacEquipmentWorkspaceEntity,
  ): Date {
    // Calculate based on equipment type and condition
    const baseInterval = 90; // 90 days base interval
    let adjustedInterval = baseInterval;

    if (equipment.condition === HvacEquipmentCondition.POOR) {
      adjustedInterval = 30; // More frequent maintenance
    } else if (equipment.condition === HvacEquipmentCondition.EXCELLENT) {
      adjustedInterval = 120; // Less frequent maintenance
    }

    return new Date(Date.now() + adjustedInterval * 24 * 60 * 60 * 1000);
  }

  private calculateEfficiency(equipment: HvacEquipmentWorkspaceEntity): number {
    // Calculate efficiency based on equipment condition and age
    let efficiency = 90; // Base efficiency

    switch (equipment.condition) {
      case HvacEquipmentCondition.EXCELLENT:
        efficiency = 95;
        break;
      case HvacEquipmentCondition.GOOD:
        efficiency = 85;
        break;
      case HvacEquipmentCondition.FAIR:
        efficiency = 75;
        break;
      case HvacEquipmentCondition.POOR:
        efficiency = 60;
        break;
    }

    return efficiency;
  }

  private calculateRuntime(_equipment: HvacEquipmentWorkspaceEntity): number {
    // Calculate daily runtime in hours
    return 8; // Default 8 hours per day
  }

  private getErrorCount(_equipment: HvacEquipmentWorkspaceEntity): number {
    // Count recent errors
    return 0; // Would be calculated from actual error logs
  }

  private assessFailureRisk(
    healthScore: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (healthScore < 30) return 'critical';
    if (healthScore < 50) return 'high';
    if (healthScore < 70) return 'medium';

    return 'low';
  }

  private generateRecommendations(
    equipment: HvacEquipmentWorkspaceEntity,
    healthScore: number,
  ): string[] {
    const recommendations: string[] = [];

    if (healthScore < 50) {
      recommendations.push('Schedule immediate inspection');
      recommendations.push('Consider component replacement');
    }

    if (equipment.condition === HvacEquipmentCondition.POOR) {
      recommendations.push('Urgent maintenance required');
    }

    recommendations.push('Regular filter replacement');
    recommendations.push('Annual efficiency check');

    return recommendations;
  }

  private estimateLifeRemaining(
    equipment: HvacEquipmentWorkspaceEntity,
    healthScore: number,
  ): number {
    // Estimate remaining life in months
    const ageInYears =
      (Date.now() - equipment.installationDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    const typicalLifespan = 20; // 20 years for HVAC equipment
    const remainingYears = Math.max(0, typicalLifespan - ageInYears);

    // Adjust based on health score
    const healthFactor = healthScore / 100;

    return Math.round(remainingYears * 12 * healthFactor);
  }
}
