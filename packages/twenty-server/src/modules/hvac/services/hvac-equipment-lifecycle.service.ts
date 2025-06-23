/**
 * HVAC Equipment Lifecycle Service
 * "Pasja rodzi profesjonalizm" - Professional equipment lifecycle management
 * 
 * Handles equipment installation, maintenance scheduling, health monitoring,
 * and end-of-life management for HVAC systems.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HvacEquipmentWorkspaceEntity, HvacEquipmentStatus, HvacEquipmentCondition } from '../standard-objects/hvac-equipment.workspace-entity';
import { HvacMaintenanceRecordWorkspaceEntity, HvacMaintenanceType, HvacMaintenanceStatus } from '../standard-objects/hvac-maintenance-record.workspace-entity';

export interface EquipmentHealthScore {
  overall: number; // 0-100
  performance: number;
  reliability: number;
  efficiency: number;
  maintenanceCompliance: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface MaintenanceSchedule {
  equipmentId: string;
  nextMaintenanceDate: Date;
  maintenanceType: HvacMaintenanceType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // hours
  requiredParts: string[];
  specialInstructions?: string;
}

export interface EquipmentLifecycleEvent {
  equipmentId: string;
  eventType: 'installation' | 'maintenance' | 'repair' | 'upgrade' | 'retirement';
  date: Date;
  description: string;
  cost?: number;
  technician?: string;
  impact: 'positive' | 'neutral' | 'negative';
}

@Injectable()
export class HvacEquipmentLifecycleService {
  private readonly logger = new Logger(HvacEquipmentLifecycleService.name);

  constructor(
    @InjectRepository(HvacEquipmentWorkspaceEntity)
    private readonly equipmentRepository: Repository<HvacEquipmentWorkspaceEntity>,
    @InjectRepository(HvacMaintenanceRecordWorkspaceEntity)
    private readonly maintenanceRepository: Repository<HvacMaintenanceRecordWorkspaceEntity>,
  ) {}

  /**
   * Calculate equipment health score based on multiple factors
   */
  async calculateHealthScore(equipmentId: string): Promise<EquipmentHealthScore> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
        relations: ['maintenanceRecords'],
      });

      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const maintenanceRecords = equipment.maintenanceRecords || [];
      const now = new Date();
      const installationAge = this.calculateAgeInYears(equipment.installationDate, now);

      // Performance score (based on recent maintenance and age)
      const performance = this.calculatePerformanceScore(maintenanceRecords, installationAge);

      // Reliability score (based on failure frequency)
      const reliability = this.calculateReliabilityScore(maintenanceRecords);

      // Efficiency score (based on energy rating and maintenance compliance)
      const efficiency = this.calculateEfficiencyScore(equipment, maintenanceRecords);

      // Maintenance compliance score
      const maintenanceCompliance = this.calculateMaintenanceComplianceScore(maintenanceRecords);

      // Overall score (weighted average)
      const overall = Math.round(
        (performance * 0.3 + reliability * 0.25 + efficiency * 0.25 + maintenanceCompliance * 0.2)
      );

      // Risk factors and recommendations
      const { riskFactors, recommendations } = this.generateRiskAssessment(
        equipment,
        maintenanceRecords,
        { performance, reliability, efficiency, maintenanceCompliance }
      );

      return {
        overall,
        performance,
        reliability,
        efficiency,
        maintenanceCompliance,
        riskFactors,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate health score for equipment ${equipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Generate predictive maintenance schedule
   */
  async generateMaintenanceSchedule(equipmentId: string): Promise<MaintenanceSchedule[]> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
        relations: ['maintenanceRecords'],
      });

      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const schedule: MaintenanceSchedule[] = [];
      const healthScore = await this.calculateHealthScore(equipmentId);
      const lastMaintenance = this.getLastMaintenanceDate(equipment.maintenanceRecords || []);

      // Routine maintenance (quarterly)
      const nextRoutine = this.calculateNextMaintenanceDate(lastMaintenance, 'routine');
      schedule.push({
        equipmentId,
        nextMaintenanceDate: nextRoutine,
        maintenanceType: HvacMaintenanceType.ROUTINE,
        priority: healthScore.overall < 70 ? 'high' : 'medium',
        estimatedDuration: 2,
        requiredParts: this.getRoutineMaintenanceParts(equipment.equipmentType),
      });

      // Preventive maintenance (annually)
      const nextPreventive = this.calculateNextMaintenanceDate(lastMaintenance, 'preventive');
      schedule.push({
        equipmentId,
        nextMaintenanceDate: nextPreventive,
        maintenanceType: HvacMaintenanceType.PREVENTIVE,
        priority: 'medium',
        estimatedDuration: 4,
        requiredParts: this.getPreventiveMaintenanceParts(equipment.equipmentType),
      });

      // Emergency maintenance (if health score is critical)
      if (healthScore.overall < 50) {
        schedule.push({
          equipmentId,
          nextMaintenanceDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          maintenanceType: HvacMaintenanceType.EMERGENCY,
          priority: 'critical',
          estimatedDuration: 6,
          requiredParts: [],
          specialInstructions: 'Critical health score detected. Immediate inspection required.',
        });
      }

      return schedule.sort((a, b) => a.nextMaintenanceDate.getTime() - b.nextMaintenanceDate.getTime());
    } catch (error) {
      this.logger.error(`Failed to generate maintenance schedule for equipment ${equipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Track equipment lifecycle events
   */
  async recordLifecycleEvent(event: EquipmentLifecycleEvent): Promise<void> {
    try {
      this.logger.log(`Recording lifecycle event for equipment ${event.equipmentId}: ${event.eventType}`);
      
      // Update equipment status based on event type
      await this.updateEquipmentStatusFromEvent(event);
      
      // Log event for audit trail
      this.logger.log(`Lifecycle event recorded: ${JSON.stringify(event)}`);
    } catch (error) {
      this.logger.error(`Failed to record lifecycle event:`, error);
      throw error;
    }
  }

  /**
   * Predict equipment replacement needs
   */
  async predictReplacementNeeds(equipmentId: string): Promise<{
    replacementRecommended: boolean;
    timeframe: 'immediate' | 'within_6_months' | 'within_1_year' | 'within_2_years';
    reasons: string[];
    estimatedCost: number;
  }> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
        relations: ['maintenanceRecords'],
      });

      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const healthScore = await this.calculateHealthScore(equipmentId);
      const age = this.calculateAgeInYears(equipment.installationDate, new Date());
      const maintenanceCosts = this.calculateMaintenanceCosts(equipment.maintenanceRecords || []);

      const reasons: string[] = [];
      let replacementRecommended = false;
      let timeframe: 'immediate' | 'within_6_months' | 'within_1_year' | 'within_2_years' = 'within_2_years';

      // Age-based assessment
      if (age > 15) {
        reasons.push('Equipment age exceeds recommended lifespan');
        replacementRecommended = true;
        timeframe = 'within_1_year';
      }

      // Health score assessment
      if (healthScore.overall < 40) {
        reasons.push('Critical health score indicates imminent failure risk');
        replacementRecommended = true;
        timeframe = 'immediate';
      } else if (healthScore.overall < 60) {
        reasons.push('Poor health score indicates declining performance');
        replacementRecommended = true;
        timeframe = 'within_6_months';
      }

      // Maintenance cost assessment
      if (maintenanceCosts.annual > equipment.purchasePrice * 0.3) {
        reasons.push('Annual maintenance costs exceed 30% of equipment value');
        replacementRecommended = true;
        if (timeframe === 'within_2_years') timeframe = 'within_1_year';
      }

      // Efficiency assessment
      if (healthScore.efficiency < 50) {
        reasons.push('Energy efficiency below acceptable standards');
        replacementRecommended = true;
        if (timeframe === 'within_2_years') timeframe = 'within_1_year';
      }

      const estimatedCost = this.estimateReplacementCost(equipment);

      return {
        replacementRecommended,
        timeframe,
        reasons,
        estimatedCost,
      };
    } catch (error) {
      this.logger.error(`Failed to predict replacement needs for equipment ${equipmentId}:`, error);
      throw error;
    }
  }

  // Private helper methods
  private calculateAgeInYears(installationDate: Date, currentDate: Date): number {
    return (currentDate.getTime() - installationDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }

  private calculatePerformanceScore(maintenanceRecords: any[], age: number): number {
    // Base score decreases with age
    let score = Math.max(100 - (age * 3), 20);
    
    // Adjust based on recent maintenance
    const recentMaintenance = maintenanceRecords.filter(
      record => new Date(record.completedDate).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000)
    );
    
    if (recentMaintenance.length > 0) {
      score += 10; // Bonus for recent maintenance
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  private calculateReliabilityScore(maintenanceRecords: any[]): number {
    const emergencyRepairs = maintenanceRecords.filter(
      record => record.maintenanceType === HvacMaintenanceType.EMERGENCY
    );
    
    // Start with perfect score, deduct for emergency repairs
    let score = 100 - (emergencyRepairs.length * 15);
    
    return Math.min(Math.max(score, 0), 100);
  }

  private calculateEfficiencyScore(equipment: any, maintenanceRecords: any[]): number {
    // Base score from energy rating
    let score = equipment.energyRating ? 80 : 60;
    
    // Adjust based on maintenance frequency
    const regularMaintenance = maintenanceRecords.filter(
      record => record.maintenanceType === HvacMaintenanceType.ROUTINE
    );
    
    if (regularMaintenance.length > 2) {
      score += 20; // Well-maintained equipment is more efficient
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  private calculateMaintenanceComplianceScore(maintenanceRecords: any[]): number {
    // Calculate based on maintenance frequency and timeliness
    const routineMaintenance = maintenanceRecords.filter(
      record => record.maintenanceType === HvacMaintenanceType.ROUTINE
    );
    
    // Should have at least 4 routine maintenance per year
    const expectedAnnualMaintenance = 4;
    const actualAnnualMaintenance = routineMaintenance.length;
    
    const complianceRatio = Math.min(actualAnnualMaintenance / expectedAnnualMaintenance, 1);
    
    return Math.round(complianceRatio * 100);
  }

  private generateRiskAssessment(equipment: any, maintenanceRecords: any[], scores: any): {
    riskFactors: string[];
    recommendations: string[];
  } {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (scores.performance < 60) {
      riskFactors.push('Declining performance');
      recommendations.push('Schedule comprehensive inspection');
    }

    if (scores.reliability < 70) {
      riskFactors.push('Frequent emergency repairs');
      recommendations.push('Implement preventive maintenance program');
    }

    if (scores.efficiency < 60) {
      riskFactors.push('Poor energy efficiency');
      recommendations.push('Consider energy efficiency upgrade');
    }

    if (scores.maintenanceCompliance < 80) {
      riskFactors.push('Inadequate maintenance schedule');
      recommendations.push('Increase maintenance frequency');
    }

    return { riskFactors, recommendations };
  }

  private getLastMaintenanceDate(maintenanceRecords: any[]): Date {
    if (maintenanceRecords.length === 0) {
      return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    }
    
    const sortedRecords = maintenanceRecords.sort(
      (a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
    
    return new Date(sortedRecords[0].completedDate);
  }

  private calculateNextMaintenanceDate(lastMaintenance: Date, type: 'routine' | 'preventive'): Date {
    const intervalDays = type === 'routine' ? 90 : 365; // 3 months or 1 year
    return new Date(lastMaintenance.getTime() + (intervalDays * 24 * 60 * 60 * 1000));
  }

  private getRoutineMaintenanceParts(equipmentType: string): string[] {
    const commonParts = ['Air Filter', 'Cleaning Supplies', 'Lubricants'];
    
    switch (equipmentType) {
      case 'AIR_CONDITIONER':
        return [...commonParts, 'Refrigerant', 'Coil Cleaner'];
      case 'HEAT_PUMP':
        return [...commonParts, 'Refrigerant', 'Defrost Control'];
      case 'FURNACE':
        return [...commonParts, 'Igniter', 'Flame Sensor'];
      default:
        return commonParts;
    }
  }

  private getPreventiveMaintenanceParts(equipmentType: string): string[] {
    const routineParts = this.getRoutineMaintenanceParts(equipmentType);
    const additionalParts = ['Belts', 'Bearings', 'Electrical Contacts'];
    
    return [...routineParts, ...additionalParts];
  }

  private async updateEquipmentStatusFromEvent(event: EquipmentLifecycleEvent): Promise<void> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id: event.equipmentId },
    });

    if (!equipment) return;

    switch (event.eventType) {
      case 'installation':
        equipment.status = HvacEquipmentStatus.OPERATIONAL;
        equipment.condition = HvacEquipmentCondition.EXCELLENT;
        break;
      case 'maintenance':
        if (equipment.condition === HvacEquipmentCondition.POOR) {
          equipment.condition = HvacEquipmentCondition.FAIR;
        }
        break;
      case 'repair':
        equipment.status = HvacEquipmentStatus.OPERATIONAL;
        break;
      case 'retirement':
        equipment.status = HvacEquipmentStatus.DECOMMISSIONED;
        break;
    }

    await this.equipmentRepository.save(equipment);
  }

  private calculateMaintenanceCosts(maintenanceRecords: any[]): { annual: number; total: number } {
    const total = maintenanceRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    const annual = total / Math.max(1, maintenanceRecords.length / 4); // Assuming quarterly maintenance
    
    return { annual, total };
  }

  private estimateReplacementCost(equipment: any): number {
    // Base cost estimation by equipment type
    const baseCosts = {
      'AIR_CONDITIONER': 5000,
      'HEAT_PUMP': 7000,
      'FURNACE': 4000,
      'BOILER': 8000,
      'CHILLER': 15000,
    };
    
    const baseCost = baseCosts[equipment.equipmentType] || 5000;
    
    // Adjust for capacity and features
    const capacityMultiplier = equipment.capacity ? 1.2 : 1.0;
    const efficiencyMultiplier = equipment.energyRating ? 1.3 : 1.0;
    
    return Math.round(baseCost * capacityMultiplier * efficiencyMultiplier);
  }
}
