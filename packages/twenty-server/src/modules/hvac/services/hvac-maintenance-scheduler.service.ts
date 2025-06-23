/**
 * HVAC Maintenance Scheduler Service
 * "Pasja rodzi profesjonalizm" - Professional maintenance scheduling
 * 
 * Handles intelligent scheduling of maintenance tasks, technician assignment,
 * and optimization of maintenance routes and timing.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HvacMaintenanceRecordWorkspaceEntity, HvacMaintenanceType, HvacMaintenanceStatus } from '../standard-objects/hvac-maintenance-record.workspace-entity';
import { HvacTechnicianWorkspaceEntity, HvacTechnicianStatus } from '../standard-objects/hvac-technician.workspace-entity';
import { HvacEquipmentWorkspaceEntity } from '../standard-objects/hvac-equipment.workspace-entity';

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentLocation: string;
  maintenanceType: HvacMaintenanceType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // hours
  requiredSkills: string[];
  requiredParts: string[];
  scheduledDate: Date;
  assignedTechnicianId?: string;
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  specialInstructions?: string;
}

export interface TechnicianSchedule {
  technicianId: string;
  technicianName: string;
  date: Date;
  tasks: MaintenanceTask[];
  totalHours: number;
  travelTime: number;
  efficiency: number;
  route: string[];
}

export interface ScheduleOptimization {
  originalSchedule: TechnicianSchedule[];
  optimizedSchedule: TechnicianSchedule[];
  improvements: {
    travelTimeReduction: number;
    efficiencyIncrease: number;
    costSavings: number;
  };
}

@Injectable()
export class HvacMaintenanceSchedulerService {
  private readonly logger = new Logger(HvacMaintenanceSchedulerService.name);

  constructor(
    @InjectRepository(HvacMaintenanceRecordWorkspaceEntity)
    private readonly maintenanceRepository: Repository<HvacMaintenanceRecordWorkspaceEntity>,
    @InjectRepository(HvacTechnicianWorkspaceEntity)
    private readonly technicianRepository: Repository<HvacTechnicianWorkspaceEntity>,
    @InjectRepository(HvacEquipmentWorkspaceEntity)
    private readonly equipmentRepository: Repository<HvacEquipmentWorkspaceEntity>,
  ) {}

  /**
   * Create maintenance task from equipment needs
   */
  async createMaintenanceTask(
    equipmentId: string,
    maintenanceType: HvacMaintenanceType,
    priority: 'low' | 'medium' | 'high' | 'critical',
    scheduledDate: Date,
    specialInstructions?: string
  ): Promise<MaintenanceTask> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const task: MaintenanceTask = {
        id: this.generateTaskId(),
        equipmentId,
        equipmentName: equipment.name,
        equipmentLocation: equipment.location || 'Unknown',
        maintenanceType,
        priority,
        estimatedDuration: this.estimateTaskDuration(maintenanceType, equipment.equipmentType),
        requiredSkills: this.getRequiredSkills(maintenanceType, equipment.equipmentType),
        requiredParts: this.getRequiredParts(maintenanceType, equipment.equipmentType),
        scheduledDate,
        status: 'scheduled',
        specialInstructions,
      };

      this.logger.log(`Created maintenance task: ${task.id} for equipment: ${equipmentId}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to create maintenance task for equipment ${equipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Assign technician to maintenance task using intelligent matching
   */
  async assignTechnician(taskId: string): Promise<string | null> {
    try {
      // This would be implemented with actual task storage
      // For now, we'll simulate the assignment logic
      
      const availableTechnicians = await this.technicianRepository.find({
        where: { status: HvacTechnicianStatus.AVAILABLE },
      });

      if (availableTechnicians.length === 0) {
        this.logger.warn(`No available technicians for task: ${taskId}`);
        return null;
      }

      // Find best technician based on skills, location, and workload
      const bestTechnician = this.findBestTechnician(availableTechnicians, taskId);
      
      if (bestTechnician) {
        this.logger.log(`Assigned technician ${bestTechnician.id} to task: ${taskId}`);
        return bestTechnician.id;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to assign technician to task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Generate optimized daily schedule for technicians
   */
  async generateDailySchedule(date: Date): Promise<TechnicianSchedule[]> {
    try {
      const technicians = await this.technicianRepository.find({
        where: { status: HvacTechnicianStatus.AVAILABLE },
      });

      const schedules: TechnicianSchedule[] = [];

      for (const technician of technicians) {
        const tasks = await this.getTasksForTechnician(technician.id, date);
        const optimizedTasks = this.optimizeTaskOrder(tasks, technician.location);
        
        const schedule: TechnicianSchedule = {
          technicianId: technician.id,
          technicianName: `${technician.firstName} ${technician.lastName}`,
          date,
          tasks: optimizedTasks,
          totalHours: this.calculateTotalHours(optimizedTasks),
          travelTime: this.calculateTravelTime(optimizedTasks),
          efficiency: this.calculateEfficiency(optimizedTasks),
          route: this.generateRoute(optimizedTasks),
        };

        schedules.push(schedule);
      }

      this.logger.log(`Generated daily schedule for ${schedules.length} technicians on ${date.toDateString()}`);
      return schedules;
    } catch (error) {
      this.logger.error(`Failed to generate daily schedule for ${date.toDateString()}:`, error);
      throw error;
    }
  }

  /**
   * Optimize schedule to minimize travel time and maximize efficiency
   */
  async optimizeSchedule(originalSchedule: TechnicianSchedule[]): Promise<ScheduleOptimization> {
    try {
      const optimizedSchedule: TechnicianSchedule[] = [];

      for (const schedule of originalSchedule) {
        const optimizedTasks = this.optimizeTaskOrder(schedule.tasks, schedule.tasks[0]?.equipmentLocation);
        
        const optimized: TechnicianSchedule = {
          ...schedule,
          tasks: optimizedTasks,
          totalHours: this.calculateTotalHours(optimizedTasks),
          travelTime: this.calculateTravelTime(optimizedTasks),
          efficiency: this.calculateEfficiency(optimizedTasks),
          route: this.generateRoute(optimizedTasks),
        };

        optimizedSchedule.push(optimized);
      }

      const improvements = this.calculateImprovements(originalSchedule, optimizedSchedule);

      this.logger.log(`Schedule optimization completed. Travel time reduced by ${improvements.travelTimeReduction}%`);

      return {
        originalSchedule,
        optimizedSchedule,
        improvements,
      };
    } catch (error) {
      this.logger.error('Failed to optimize schedule:', error);
      throw error;
    }
  }

  /**
   * Handle emergency maintenance scheduling
   */
  async scheduleEmergencyMaintenance(
    equipmentId: string,
    description: string,
    urgency: 'high' | 'critical'
  ): Promise<MaintenanceTask> {
    try {
      const task = await this.createMaintenanceTask(
        equipmentId,
        HvacMaintenanceType.EMERGENCY,
        urgency,
        new Date(), // Immediate
        `EMERGENCY: ${description}`
      );

      // Try to assign immediately
      const assignedTechnicianId = await this.assignTechnician(task.id);
      
      if (assignedTechnicianId) {
        task.assignedTechnicianId = assignedTechnicianId;
        task.status = 'assigned';
        
        // Notify technician (would integrate with notification service)
        this.logger.log(`Emergency task ${task.id} assigned to technician ${assignedTechnicianId}`);
      } else {
        this.logger.warn(`No technician available for emergency task: ${task.id}`);
        // Would trigger escalation process
      }

      return task;
    } catch (error) {
      this.logger.error(`Failed to schedule emergency maintenance for equipment ${equipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get maintenance workload analytics
   */
  async getWorkloadAnalytics(startDate: Date, endDate: Date): Promise<{
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    technicianUtilization: { [technicianId: string]: number };
    equipmentMaintenanceFrequency: { [equipmentType: string]: number };
    costAnalysis: {
      totalCost: number;
      averageCostPerTask: number;
      costByType: { [type: string]: number };
    };
  }> {
    try {
      const maintenanceRecords = await this.maintenanceRepository.find({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          } as any,
        },
        relations: ['equipment', 'technician'],
      });

      const totalTasks = maintenanceRecords.length;
      const completedTasks = maintenanceRecords.filter(
        record => record.status === HvacMaintenanceStatus.COMPLETED
      ).length;

      const completionTimes = maintenanceRecords
        .filter(record => record.completedDate && record.scheduledDate)
        .map(record => 
          new Date(record.completedDate!).getTime() - new Date(record.scheduledDate).getTime()
        );

      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length / (1000 * 60 * 60) // hours
        : 0;

      // Calculate technician utilization
      const technicianUtilization: { [technicianId: string]: number } = {};
      const technicianTasks: { [technicianId: string]: number } = {};
      
      maintenanceRecords.forEach(record => {
        if (record.technician?.id) {
          technicianTasks[record.technician.id] = (technicianTasks[record.technician.id] || 0) + 1;
        }
      });

      Object.keys(technicianTasks).forEach(technicianId => {
        const workingDays = this.calculateWorkingDays(startDate, endDate);
        const tasksPerDay = technicianTasks[technicianId] / workingDays;
        technicianUtilization[technicianId] = Math.min(tasksPerDay / 8 * 100, 100); // Assuming 8 tasks per day max
      });

      // Equipment maintenance frequency
      const equipmentMaintenanceFrequency: { [equipmentType: string]: number } = {};
      maintenanceRecords.forEach(record => {
        if (record.equipment?.equipmentType) {
          const type = record.equipment.equipmentType;
          equipmentMaintenanceFrequency[type] = (equipmentMaintenanceFrequency[type] || 0) + 1;
        }
      });

      // Cost analysis
      const totalCost = maintenanceRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
      const averageCostPerTask = totalTasks > 0 ? totalCost / totalTasks : 0;
      
      const costByType: { [type: string]: number } = {};
      maintenanceRecords.forEach(record => {
        const type = record.maintenanceType;
        costByType[type] = (costByType[type] || 0) + (record.cost || 0);
      });

      return {
        totalTasks,
        completedTasks,
        averageCompletionTime,
        technicianUtilization,
        equipmentMaintenanceFrequency,
        costAnalysis: {
          totalCost,
          averageCostPerTask,
          costByType,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get workload analytics:', error);
      throw error;
    }
  }

  // Private helper methods
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateTaskDuration(maintenanceType: HvacMaintenanceType, equipmentType: string): number {
    const baseDurations = {
      [HvacMaintenanceType.ROUTINE]: 2,
      [HvacMaintenanceType.PREVENTIVE]: 4,
      [HvacMaintenanceType.CORRECTIVE]: 6,
      [HvacMaintenanceType.EMERGENCY]: 8,
    };

    const typeMultipliers = {
      'AIR_CONDITIONER': 1.0,
      'HEAT_PUMP': 1.2,
      'FURNACE': 0.8,
      'BOILER': 1.5,
      'CHILLER': 2.0,
    };

    const baseDuration = baseDurations[maintenanceType] || 4;
    const multiplier = typeMultipliers[equipmentType] || 1.0;

    return Math.round(baseDuration * multiplier);
  }

  private getRequiredSkills(maintenanceType: HvacMaintenanceType, equipmentType: string): string[] {
    const baseSkills = ['HVAC_BASICS', 'SAFETY_PROTOCOLS'];
    
    const typeSkills = {
      'AIR_CONDITIONER': ['REFRIGERATION', 'ELECTRICAL'],
      'HEAT_PUMP': ['REFRIGERATION', 'ELECTRICAL', 'CONTROLS'],
      'FURNACE': ['GAS_SYSTEMS', 'ELECTRICAL'],
      'BOILER': ['HYDRONIC_SYSTEMS', 'GAS_SYSTEMS'],
      'CHILLER': ['REFRIGERATION', 'CONTROLS', 'ELECTRICAL'],
    };

    const maintenanceSkills = {
      [HvacMaintenanceType.EMERGENCY]: ['TROUBLESHOOTING', 'EMERGENCY_REPAIR'],
      [HvacMaintenanceType.CORRECTIVE]: ['TROUBLESHOOTING', 'REPAIR'],
    };

    return [
      ...baseSkills,
      ...(typeSkills[equipmentType] || []),
      ...(maintenanceSkills[maintenanceType] || []),
    ];
  }

  private getRequiredParts(maintenanceType: HvacMaintenanceType, equipmentType: string): string[] {
    const routineParts = ['Air Filter', 'Cleaning Supplies'];
    const preventiveParts = [...routineParts, 'Belts', 'Lubricants'];
    
    switch (maintenanceType) {
      case HvacMaintenanceType.ROUTINE:
        return routineParts;
      case HvacMaintenanceType.PREVENTIVE:
        return preventiveParts;
      case HvacMaintenanceType.CORRECTIVE:
      case HvacMaintenanceType.EMERGENCY:
        return []; // Parts determined during diagnosis
      default:
        return routineParts;
    }
  }

  private findBestTechnician(technicians: HvacTechnicianWorkspaceEntity[], taskId: string): HvacTechnicianWorkspaceEntity | null {
    // Simplified technician matching logic
    // In a real implementation, this would consider:
    // - Skills match
    // - Geographic proximity
    // - Current workload
    // - Availability
    // - Performance ratings
    
    return technicians.length > 0 ? technicians[0] : null;
  }

  private async getTasksForTechnician(technicianId: string, date: Date): Promise<MaintenanceTask[]> {
    // This would query actual task storage
    // For now, return empty array
    return [];
  }

  private optimizeTaskOrder(tasks: MaintenanceTask[], startLocation: string): MaintenanceTask[] {
    // Simplified task ordering - in reality would use traveling salesman algorithm
    return tasks.sort((a, b) => {
      // Sort by priority first, then by location proximity
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then by estimated duration (shorter tasks first)
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  private calculateTotalHours(tasks: MaintenanceTask[]): number {
    return tasks.reduce((total, task) => total + task.estimatedDuration, 0);
  }

  private calculateTravelTime(tasks: MaintenanceTask[]): number {
    // Simplified travel time calculation
    return Math.max(0, (tasks.length - 1) * 0.5); // 30 minutes between tasks
  }

  private calculateEfficiency(tasks: MaintenanceTask[]): number {
    if (tasks.length === 0) return 0;
    
    const workTime = this.calculateTotalHours(tasks);
    const travelTime = this.calculateTravelTime(tasks);
    const totalTime = workTime + travelTime;
    
    return totalTime > 0 ? (workTime / totalTime) * 100 : 0;
  }

  private generateRoute(tasks: MaintenanceTask[]): string[] {
    return tasks.map(task => task.equipmentLocation);
  }

  private calculateImprovements(original: TechnicianSchedule[], optimized: TechnicianSchedule[]): {
    travelTimeReduction: number;
    efficiencyIncrease: number;
    costSavings: number;
  } {
    const originalTravelTime = original.reduce((sum, schedule) => sum + schedule.travelTime, 0);
    const optimizedTravelTime = optimized.reduce((sum, schedule) => sum + schedule.travelTime, 0);
    
    const originalEfficiency = original.reduce((sum, schedule) => sum + schedule.efficiency, 0) / original.length;
    const optimizedEfficiency = optimized.reduce((sum, schedule) => sum + schedule.efficiency, 0) / optimized.length;
    
    const travelTimeReduction = originalTravelTime > 0 
      ? ((originalTravelTime - optimizedTravelTime) / originalTravelTime) * 100 
      : 0;
    
    const efficiencyIncrease = originalEfficiency > 0 
      ? ((optimizedEfficiency - originalEfficiency) / originalEfficiency) * 100 
      : 0;
    
    const costSavings = travelTimeReduction * 50; // $50 per hour saved
    
    return {
      travelTimeReduction: Math.round(travelTimeReduction),
      efficiencyIncrease: Math.round(efficiencyIncrease),
      costSavings: Math.round(costSavings),
    };
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const workingDays = Math.floor(days * 5 / 7); // Assuming 5-day work week
    return Math.max(1, workingDays);
  }
}
