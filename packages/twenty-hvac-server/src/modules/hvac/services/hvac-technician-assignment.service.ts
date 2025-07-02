/**
 * HVAC Technician Assignment Service
 * "Pasja rodzi profesjonalizm" - Intelligent technician assignment algorithms
 *
 * Handles optimal technician assignment based on skills, location, workload,
 * availability, and performance metrics using advanced algorithms.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { HvacEquipmentWorkspaceEntity } from '../../hvac-equipment/hvac-equipment.workspace-entity';
import {
    HvacServiceTicketPriority,
    HvacServiceTicketStatus,
    HvacServiceTicketWorkspaceEntity,
} from '../../hvac-service-ticket/hvac-service-ticket.workspace-entity';
import {
    HvacTechnicianStatus,
    HvacTechnicianWorkspaceEntity,
} from '../../hvac-technician/hvac-technician.workspace-entity';

export interface TechnicianScore {
  technicianId: string;
  totalScore: number;
  skillsScore: number;
  locationScore: number;
  workloadScore: number;
  performanceScore: number;
  availabilityScore: number;
  reasoning: string[];
}

export interface AssignmentCriteria {
  requiredSkills: string[];
  equipmentType?: string;
  priority: HvacServiceTicketPriority;
  location: string;
  estimatedDuration: number;
  preferredTechnician?: string;
  excludeTechnicians?: string[];
}

export interface WorkloadBalance {
  technicianId: string;
  currentTasks: number;
  scheduledHours: number;
  capacity: number;
  utilizationRate: number;
  nextAvailableSlot: Date;
}

export interface AssignmentResult {
  assignedTechnicianId: string;
  confidence: number; // 0-100
  alternativeTechnicians: string[];
  estimatedArrival: Date;
  reasoning: string;
  warnings?: string[];
}

@Injectable()
export class HvacTechnicianAssignmentService {
  private readonly logger = new Logger(HvacTechnicianAssignmentService.name);

  constructor(
    @InjectRepository(HvacTechnicianWorkspaceEntity)
    private readonly technicianRepository: Repository<HvacTechnicianWorkspaceEntity>,
    @InjectRepository(HvacServiceTicketWorkspaceEntity)
    private readonly ticketRepository: Repository<HvacServiceTicketWorkspaceEntity>,
    @InjectRepository(HvacEquipmentWorkspaceEntity)
    private readonly equipmentRepository: Repository<HvacEquipmentWorkspaceEntity>,
  ) {}

  /**
   * Find optimal technician assignment using multi-criteria algorithm
   */
  async findOptimalTechnician(
    criteria: AssignmentCriteria,
  ): Promise<AssignmentResult> {
    try {
      this.logger.log(
        `Finding optimal technician for criteria: ${JSON.stringify(criteria)}`,
      );

      // Get available technicians
      const availableTechnicians = await this.getAvailableTechnicians(
        criteria.excludeTechnicians,
      );

      if (availableTechnicians.length === 0) {
        throw new Error('No available technicians found');
      }

      // Score each technician
      const technicianScores = await Promise.all(
        availableTechnicians.map((technician) =>
          this.scoreTechnician(technician, criteria),
        ),
      );

      // Sort by total score (descending)
      technicianScores.sort((a, b) => b.totalScore - a.totalScore);

      const bestTechnician = technicianScores[0];
      const alternatives = technicianScores
        .slice(1, 4)
        .map((score) => score.technicianId);

      // Calculate estimated arrival
      const estimatedArrival = await this.calculateEstimatedArrival(
        bestTechnician.technicianId,
        criteria.location,
      );

      // Generate reasoning
      const reasoning = this.generateAssignmentReasoning(bestTechnician);

      // Check for warnings
      const warnings = this.checkAssignmentWarnings(bestTechnician, criteria);

      const result: AssignmentResult = {
        assignedTechnicianId: bestTechnician.technicianId,
        confidence: Math.round(bestTechnician.totalScore),
        alternativeTechnicians: alternatives,
        estimatedArrival,
        reasoning,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      this.logger.log(
        `Optimal technician found: ${bestTechnician.technicianId} (confidence: ${result.confidence}%)`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to find optimal technician:', error);
      throw error;
    }
  }

  /**
   * Get workload balance across all technicians
   */
  async getWorkloadBalance(): Promise<WorkloadBalance[]> {
    try {
      const technicians = await this.technicianRepository.find({
        where: { status: HvacTechnicianStatus.AVAILABLE },
      });

      const workloadBalances = await Promise.all(
        technicians.map(async (technician) => {
          const currentTasks = await this.getCurrentTaskCount(technician.id);
          const scheduledHours = await this.getScheduledHours(technician.id);
          const capacity = technician.weeklyCapacity || 40; // Default 40 hours
          const utilizationRate = (scheduledHours / capacity) * 100;
          const nextAvailableSlot = await this.getNextAvailableSlot(
            technician.id,
          );

          return {
            technicianId: technician.id,
            currentTasks,
            scheduledHours,
            capacity,
            utilizationRate,
            nextAvailableSlot,
          };
        }),
      );

      return workloadBalances.sort(
        (a, b) => a.utilizationRate - b.utilizationRate,
      );
    } catch (error) {
      this.logger.error('Failed to get workload balance:', error);
      throw error;
    }
  }

  /**
   * Reassign tickets for load balancing
   */
  async rebalanceWorkload(): Promise<{
    reassignments: Array<{
      ticketId: string;
      fromTechnician: string;
      toTechnician: string;
      reason: string;
    }>;
    improvementMetrics: {
      workloadVariance: number;
      utilizationImprovement: number;
    };
  }> {
    try {
      const workloadBalances = await this.getWorkloadBalance();
      const reassignments: Array<{
        ticketId: string;
        fromTechnician: string;
        toTechnician: string;
        reason: string;
      }> = [];

      // Find overloaded and underloaded technicians
      const averageUtilization =
        workloadBalances.reduce((sum, wb) => sum + wb.utilizationRate, 0) /
        workloadBalances.length;
      const overloadedTechnicians = workloadBalances.filter(
        (wb) => wb.utilizationRate > averageUtilization + 20,
      );
      const underloadedTechnicians = workloadBalances.filter(
        (wb) => wb.utilizationRate < averageUtilization - 20,
      );

      // Reassign tickets from overloaded to underloaded technicians
      for (const overloaded of overloadedTechnicians) {
        const reassignableTickets = await this.getReassignableTickets(
          overloaded.technicianId,
        );

        for (const ticket of reassignableTickets.slice(0, 2)) {
          // Limit reassignments
          const bestUnderloaded = underloadedTechnicians.find(
            (ul) =>
              ul.utilizationRate < 80 &&
              this.canHandleTicket(ul.technicianId, ticket),
          );

          if (bestUnderloaded) {
            reassignments.push({
              ticketId: ticket.id,
              fromTechnician: overloaded.technicianId,
              toTechnician: bestUnderloaded.technicianId,
              reason: `Load balancing: ${overloaded.utilizationRate.toFixed(1)}% -> ${bestUnderloaded.utilizationRate.toFixed(1)}%`,
            });

            // Update utilization rates for next iteration
            overloaded.utilizationRate -= 10; // Approximate reduction
            bestUnderloaded.utilizationRate += 10; // Approximate increase
          }
        }
      }

      // Calculate improvement metrics
      const originalVariance = this.calculateWorkloadVariance(workloadBalances);
      const newWorkloadBalances = await this.getWorkloadBalance(); // Would be updated after reassignments
      const newVariance = this.calculateWorkloadVariance(newWorkloadBalances);

      const improvementMetrics = {
        workloadVariance:
          ((originalVariance - newVariance) / originalVariance) * 100,
        utilizationImprovement: reassignments.length * 5, // Approximate improvement
      };

      this.logger.log(
        `Workload rebalancing completed: ${reassignments.length} reassignments`,
      );

      return { reassignments, improvementMetrics };
    } catch (error) {
      this.logger.error('Failed to rebalance workload:', error);
      throw error;
    }
  }

  /**
   * Get technician performance metrics for assignment decisions
   */
  async getTechnicianPerformanceMetrics(technicianId: string): Promise<{
    completionRate: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
    firstCallResolution: number;
    skillProficiency: Record<string, number>;
  }> {
    try {
      // Get completed tickets for this technician
      const completedTickets = await this.ticketRepository.find({
        where: {
          assignedTechnician: { id: technicianId },
          status: HvacServiceTicketStatus.COMPLETED,
        },
      });

      const totalTickets = await this.ticketRepository.count({
        where: { assignedTechnician: { id: technicianId } },
      });

      const completionRate =
        totalTickets > 0 ? (completedTickets.length / totalTickets) * 100 : 0;

      // Calculate average resolution time
      const resolutionTimes = completedTickets
        .filter((ticket) => ticket.completedDate && ticket.startedAt)
        .map(
          (ticket) =>
            new Date(ticket.completedDate!).getTime() -
            new Date(ticket.startedAt!).getTime(),
        );

      const averageResolutionTime =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
            resolutionTimes.length /
            (1000 * 60 * 60)
          : 0;

      // Mock other metrics (would come from surveys and detailed tracking)
      const customerSatisfaction = 4.2;
      const firstCallResolution = 85;
      const skillProficiency = {
        HVAC_BASICS: 90,
        REFRIGERATION: 85,
        ELECTRICAL: 80,
        CONTROLS: 75,
      };

      return {
        completionRate,
        averageResolutionTime,
        customerSatisfaction,
        firstCallResolution,
        skillProficiency,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get performance metrics for technician ${technicianId}:`,
        error,
      );
      throw error;
    }
  }

  // Private helper methods
  private async getAvailableTechnicians(
    excludeIds?: string[],
  ): Promise<HvacTechnicianWorkspaceEntity[]> {
    const whereCondition: any = { status: HvacTechnicianStatus.AVAILABLE };

    if (excludeIds && excludeIds.length > 0) {
      whereCondition.id = { not: { in: excludeIds } };
    }

    return await this.technicianRepository.find({ where: whereCondition });
  }

  private async scoreTechnician(
    technician: HvacTechnicianWorkspaceEntity,
    criteria: AssignmentCriteria,
  ): Promise<TechnicianScore> {
    const reasoning: string[] = [];

    // Skills score (40% weight)
    const skillsScore = this.calculateSkillsScore(
      technician,
      criteria.requiredSkills,
      reasoning,
    );

    // Location score (25% weight)
    const locationScore = this.calculateLocationScore(
      technician,
      criteria.location,
      reasoning,
    );

    // Workload score (20% weight)
    const workloadScore = await this.calculateWorkloadScore(
      technician.id,
      reasoning,
    );

    // Performance score (10% weight)
    const performanceScore = await this.calculatePerformanceScore(
      technician.id,
      reasoning,
    );

    // Availability score (5% weight)
    const availabilityScore = this.calculateAvailabilityScore(
      technician,
      criteria.estimatedDuration,
      reasoning,
    );

    // Calculate weighted total score
    const totalScore =
      skillsScore * 0.4 +
      locationScore * 0.25 +
      workloadScore * 0.2 +
      performanceScore * 0.1 +
      availabilityScore * 0.05;

    return {
      technicianId: technician.id,
      totalScore,
      skillsScore,
      locationScore,
      workloadScore,
      performanceScore,
      availabilityScore,
      reasoning,
    };
  }

  private calculateSkillsScore(
    technician: HvacTechnicianWorkspaceEntity,
    requiredSkills: string[],
    reasoning: string[],
  ): number {
    if (requiredSkills.length === 0) {
      reasoning.push('No specific skills required');

      return 100;
    }

    const technicianSkills = technician.skills || [];
    const matchedSkills = requiredSkills.filter((skill) =>
      technicianSkills.includes(skill),
    );
    const score = (matchedSkills.length / requiredSkills.length) * 100;

    reasoning.push(
      `Skills match: ${matchedSkills.length}/${requiredSkills.length} (${score.toFixed(1)}%)`,
    );

    return score;
  }

  private calculateLocationScore(
    technician: HvacTechnicianWorkspaceEntity,
    location: string,
    reasoning: string[],
  ): number {
    // Simplified location scoring - in reality would use GPS coordinates and routing
    const technicianLocation = technician.location || 'Unknown';

    if (technicianLocation === location) {
      reasoning.push('Same location - optimal');

      return 100;
    }

    // Mock distance calculation
    const distance = Math.random() * 50; // 0-50 km
    const score = Math.max(0, 100 - distance * 2); // 2 points per km

    reasoning.push(`Distance: ${distance.toFixed(1)}km (${score.toFixed(1)}%)`);

    return score;
  }

  private async calculateWorkloadScore(
    technicianId: string,
    reasoning: string[],
  ): Promise<number> {
    const currentTasks = await this.getCurrentTaskCount(technicianId);
    const maxTasks = 8; // Assume max 8 tasks per day

    const score = Math.max(0, ((maxTasks - currentTasks) / maxTasks) * 100);

    reasoning.push(
      `Workload: ${currentTasks}/${maxTasks} tasks (${score.toFixed(1)}%)`,
    );

    return score;
  }

  private async calculatePerformanceScore(
    technicianId: string,
    reasoning: string[],
  ): Promise<number> {
    const metrics = await this.getTechnicianPerformanceMetrics(technicianId);
    const score =
      (metrics.completionRate + metrics.customerSatisfaction * 20) / 2;

    reasoning.push(
      `Performance: ${score.toFixed(1)}% (completion + satisfaction)`,
    );

    return score;
  }

  private calculateAvailabilityScore(
    technician: HvacTechnicianWorkspaceEntity,
    estimatedDuration: number,
    reasoning: string[],
  ): number {
    // Simplified availability check
    const isAvailable = technician.status === HvacTechnicianStatus.AVAILABLE;
    const score = isAvailable ? 100 : 0;

    reasoning.push(
      `Availability: ${isAvailable ? 'Available' : 'Unavailable'}`,
    );

    return score;
  }

  private async getCurrentTaskCount(technicianId: string): Promise<number> {
    const assignedCount = await this.ticketRepository.count({
      where: {
        assignedTechnician: { id: technicianId },
        status: HvacServiceTicketStatus.ASSIGNED,
      },
    });

    const inProgressCount = await this.ticketRepository.count({
      where: {
        assignedTechnician: { id: technicianId },
        status: HvacServiceTicketStatus.IN_PROGRESS,
      },
    });

    return assignedCount + inProgressCount;
  }

  private async getScheduledHours(_technicianId: string): Promise<number> {
    // Mock implementation - would calculate from actual schedule
    return Math.random() * 40; // 0-40 hours
  }

  private async getNextAvailableSlot(_technicianId: string): Promise<Date> {
    // Mock implementation - would check actual schedule
    return new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000); // Within 24 hours
  }

  private async calculateEstimatedArrival(
    _technicianId: string,
    _location: string,
  ): Promise<Date> {
    // Mock implementation - would use real routing
    const travelTime = Math.random() * 60; // 0-60 minutes

    return new Date(Date.now() + travelTime * 60 * 1000);
  }

  private generateAssignmentReasoning(score: TechnicianScore): string {
    return `Best match with ${score.totalScore.toFixed(1)}% confidence. ${score.reasoning.join(', ')}.`;
  }

  private checkAssignmentWarnings(
    score: TechnicianScore,
    criteria: AssignmentCriteria,
  ): string[] {
    const warnings: string[] = [];

    if (score.skillsScore < 70) {
      warnings.push('Skills match below optimal threshold');
    }

    if (score.workloadScore < 30) {
      warnings.push('Technician has high workload');
    }

    if (score.locationScore < 50) {
      warnings.push('Technician is far from service location');
    }

    return warnings;
  }

  private async getReassignableTickets(
    technicianId: string,
  ): Promise<HvacServiceTicketWorkspaceEntity[]> {
    return await this.ticketRepository.find({
      where: {
        assignedTechnician: { id: technicianId },
        status: HvacServiceTicketStatus.ASSIGNED, // Only reassign tickets not yet started
      },
      order: { priority: 'ASC' }, // Reassign lower priority tickets first
    });
  }

  private canHandleTicket(
    _technicianId: string,
    _ticket: HvacServiceTicketWorkspaceEntity,
  ): boolean {
    // Simplified check - would verify skills, location, etc.
    return true;
  }

  private calculateWorkloadVariance(
    workloadBalances: WorkloadBalance[],
  ): number {
    const utilizationRates = workloadBalances.map((wb) => wb.utilizationRate);
    const mean =
      utilizationRates.reduce((sum, rate) => sum + rate, 0) /
      utilizationRates.length;
    const variance =
      utilizationRates.reduce(
        (sum, rate) => sum + Math.pow(rate - mean, 2),
        0,
      ) / utilizationRates.length;

    return variance;
  }
}
