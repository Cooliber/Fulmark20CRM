/**
 * HVAC Scheduling Engine Service
 * "Pasja rodzi profesjonalizm" - Professional HVAC Service Planning
 * 
 * Implements comprehensive scheduling engine with:
 * - Real-time scheduling and dispatch
 * - Technician skill-based assignment
 * - Route optimization
 * - Emergency prioritization
 * - Workload balancing
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HvacServiceTicketWorkspaceEntity, HvacServiceTicketStatus, HvacServiceTicketPriority } from '../standard-objects/hvac-service-ticket.workspace-entity';
import { HvacTechnicianWorkspaceEntity, HvacTechnicianStatus, HvacTechnicianLevel } from '../standard-objects/hvac-technician.workspace-entity';
import { HvacEquipmentWorkspaceEntity } from '../standard-objects/hvac-equipment.workspace-entity';

// Scheduling interfaces
export interface SchedulingRequest {
  ticketId: string;
  priority: HvacServiceTicketPriority;
  serviceType: string;
  estimatedDuration: number; // in minutes
  requiredSkills: string[];
  preferredDate?: Date;
  customerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  equipmentType?: string;
  emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TechnicianAvailability {
  technicianId: string;
  name: string;
  status: HvacTechnicianStatus;
  level: HvacTechnicianLevel;
  skills: string[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  workingHours: {
    start: string; // HH:mm format
    end: string;
  };
  scheduledJobs: ScheduledJob[];
  maxJobsPerDay: number;
  travelTimeBuffer: number; // minutes
}

export interface ScheduledJob {
  jobId: string;
  ticketId: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  travelTime?: number; // minutes to reach this job
}

export interface SchedulingResult {
  success: boolean;
  assignedTechnician?: string;
  scheduledTime?: Date;
  estimatedArrival?: Date;
  alternativeOptions?: AlternativeSchedule[];
  reason?: string;
  confidence: number; // 0-100
}

export interface AlternativeSchedule {
  technicianId: string;
  technicianName: string;
  scheduledTime: Date;
  estimatedArrival: Date;
  confidence: number;
  reason: string;
}

export interface RouteOptimization {
  technicianId: string;
  optimizedJobs: ScheduledJob[];
  totalTravelTime: number;
  totalWorkTime: number;
  efficiency: number; // percentage
  fuelSavings: number; // estimated PLN
}

@Injectable()
export class HvacSchedulingEngineService {
  private readonly logger = new Logger(HvacSchedulingEngineService.name);

  constructor(
    @InjectRepository(HvacServiceTicketWorkspaceEntity, 'workspace')
    private readonly serviceTicketRepository: Repository<HvacServiceTicketWorkspaceEntity>,
    
    @InjectRepository(HvacTechnicianWorkspaceEntity, 'workspace')
    private readonly technicianRepository: Repository<HvacTechnicianWorkspaceEntity>,
    
    @InjectRepository(HvacEquipmentWorkspaceEntity, 'workspace')
    private readonly equipmentRepository: Repository<HvacEquipmentWorkspaceEntity>,
  ) {}

  /**
   * Main scheduling method - assigns technician to service request
   */
  async scheduleServiceRequest(request: SchedulingRequest): Promise<SchedulingResult> {
    try {
      this.logger.log(`Scheduling service request for ticket: ${request.ticketId}`);

      // Get available technicians
      const availableTechnicians = await this.getAvailableTechnicians(request.preferredDate);
      
      if (availableTechnicians.length === 0) {
        return {
          success: false,
          reason: 'No technicians available for the requested time',
          confidence: 0,
        };
      }

      // Score and rank technicians
      const rankedTechnicians = await this.rankTechniciansForJob(request, availableTechnicians);
      
      if (rankedTechnicians.length === 0) {
        return {
          success: false,
          reason: 'No suitable technicians found for this job',
          confidence: 0,
        };
      }

      // Try to schedule with best technician
      const bestTechnician = rankedTechnicians[0];
      const scheduledTime = await this.findOptimalTimeSlot(request, bestTechnician);

      if (!scheduledTime) {
        // Generate alternative options
        const alternatives = await this.generateAlternativeSchedules(request, rankedTechnicians.slice(1, 4));
        
        return {
          success: false,
          reason: 'No available time slots with preferred technician',
          alternativeOptions: alternatives,
          confidence: 0,
        };
      }

      // Calculate estimated arrival time
      const estimatedArrival = await this.calculateEstimatedArrival(
        bestTechnician.technicianId,
        request.customerLocation,
        scheduledTime
      );

      // Create the scheduled job
      await this.createScheduledJob({
        jobId: `JOB-${Date.now()}`,
        ticketId: request.ticketId,
        startTime: scheduledTime,
        endTime: new Date(scheduledTime.getTime() + request.estimatedDuration * 60000),
        location: request.customerLocation,
        status: 'SCHEDULED',
        travelTime: await this.calculateTravelTime(bestTechnician.currentLocation, request.customerLocation),
      }, bestTechnician.technicianId);

      return {
        success: true,
        assignedTechnician: bestTechnician.technicianId,
        scheduledTime,
        estimatedArrival,
        confidence: bestTechnician.score,
      };

    } catch (error) {
      this.logger.error(`Failed to schedule service request: ${error.message}`, error.stack);
      return {
        success: false,
        reason: 'Internal scheduling error',
        confidence: 0,
      };
    }
  }

  /**
   * Get available technicians for a specific date
   */
  private async getAvailableTechnicians(date?: Date): Promise<TechnicianAvailability[]> {
    const targetDate = date || new Date();
    
    const technicians = await this.technicianRepository.find({
      where: {
        status: HvacTechnicianStatus.ACTIVE,
      },
      relations: ['assignedTickets'],
    });

    const availabilityPromises = technicians.map(async (tech) => {
      const scheduledJobs = await this.getScheduledJobsForTechnician(tech.id, targetDate);
      
      return {
        technicianId: tech.id,
        name: `${tech.name.firstName} ${tech.name.lastName}`,
        status: tech.status,
        level: tech.level,
        skills: tech.specialties || [],
        currentLocation: {
          latitude: tech.address?.latitude || 52.2297, // Warsaw default
          longitude: tech.address?.longitude || 21.0122,
        },
        workingHours: {
          start: '08:00',
          end: '17:00',
        },
        scheduledJobs,
        maxJobsPerDay: this.getMaxJobsPerDay(tech.level),
        travelTimeBuffer: 15, // 15 minutes buffer
      };
    });

    return Promise.all(availabilityPromises);
  }

  /**
   * Get maximum jobs per day based on technician level
   */
  private getMaxJobsPerDay(level: HvacTechnicianLevel): number {
    switch (level) {
      case HvacTechnicianLevel.APPRENTICE:
        return 3;
      case HvacTechnicianLevel.JUNIOR:
        return 4;
      case HvacTechnicianLevel.SENIOR:
        return 6;
      case HvacTechnicianLevel.LEAD:
        return 5; // Less jobs due to supervision duties
      case HvacTechnicianLevel.SUPERVISOR:
        return 3; // Mostly supervision
      default:
        return 4;
    }
  }

  /**
   * Get scheduled jobs for a technician on a specific date
   */
  private async getScheduledJobsForTechnician(technicianId: string, date: Date): Promise<ScheduledJob[]> {
    // This would typically query a scheduling database
    // For now, return empty array - will be implemented with proper scheduling storage
    return [];
  }

  /**
   * Rank technicians based on job requirements
   */
  private async rankTechniciansForJob(
    request: SchedulingRequest, 
    technicians: TechnicianAvailability[]
  ): Promise<(TechnicianAvailability & { score: number })[]> {
    const scoredTechnicians = technicians.map(tech => {
      let score = 0;

      // Skill matching (40% of score)
      const skillMatch = this.calculateSkillMatch(request.requiredSkills, tech.skills);
      score += skillMatch * 40;

      // Experience level (20% of score)
      const experienceScore = this.getExperienceScore(tech.level);
      score += experienceScore * 20;

      // Location proximity (25% of score)
      const proximityScore = this.calculateProximityScore(tech.currentLocation, request.customerLocation);
      score += proximityScore * 25;

      // Workload balance (15% of score)
      const workloadScore = this.calculateWorkloadScore(tech.scheduledJobs, tech.maxJobsPerDay);
      score += workloadScore * 15;

      return { ...tech, score: Math.round(score) };
    });

    // Filter out technicians with score below threshold and sort by score
    return scoredTechnicians
      .filter(tech => tech.score >= 30) // Minimum 30% match
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate skill match percentage
   */
  private calculateSkillMatch(requiredSkills: string[], technicianSkills: string[]): number {
    if (requiredSkills.length === 0) return 100;
    
    const matchedSkills = requiredSkills.filter(skill => 
      technicianSkills.some(techSkill => 
        techSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return (matchedSkills.length / requiredSkills.length) * 100;
  }

  /**
   * Get experience score based on technician level
   */
  private getExperienceScore(level: HvacTechnicianLevel): number {
    switch (level) {
      case HvacTechnicianLevel.APPRENTICE:
        return 60;
      case HvacTechnicianLevel.JUNIOR:
        return 70;
      case HvacTechnicianLevel.SENIOR:
        return 90;
      case HvacTechnicianLevel.LEAD:
        return 95;
      case HvacTechnicianLevel.SUPERVISOR:
        return 100;
      default:
        return 70;
    }
  }

  /**
   * Calculate proximity score based on distance
   */
  private calculateProximityScore(techLocation: { latitude: number; longitude: number }, customerLocation: { latitude: number; longitude: number }): number {
    const distance = this.calculateDistance(techLocation, customerLocation);
    
    // Score decreases with distance (max 50km for full score)
    if (distance <= 5) return 100;
    if (distance <= 15) return 80;
    if (distance <= 30) return 60;
    if (distance <= 50) return 40;
    return 20;
  }

  /**
   * Calculate workload score (lower workload = higher score)
   */
  private calculateWorkloadScore(scheduledJobs: ScheduledJob[], maxJobs: number): number {
    const currentJobs = scheduledJobs.filter(job => job.status === 'SCHEDULED').length;
    const utilization = currentJobs / maxJobs;
    
    return Math.max(0, (1 - utilization) * 100);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find optimal time slot for a job with a specific technician
   */
  private async findOptimalTimeSlot(request: SchedulingRequest, technician: TechnicianAvailability): Promise<Date | null> {
    const targetDate = request.preferredDate || new Date();
    const workStart = this.parseTime(technician.workingHours.start);
    const workEnd = this.parseTime(technician.workingHours.end);

    // Create time slots (30-minute intervals)
    const timeSlots = this.generateTimeSlots(targetDate, workStart, workEnd, 30);

    for (const slot of timeSlots) {
      if (await this.isTimeSlotAvailable(technician, slot, request.estimatedDuration)) {
        return slot;
      }
    }

    return null;
  }

  /**
   * Generate alternative scheduling options
   */
  private async generateAlternativeSchedules(
    request: SchedulingRequest,
    technicians: (TechnicianAvailability & { score: number })[]
  ): Promise<AlternativeSchedule[]> {
    const alternatives: AlternativeSchedule[] = [];

    for (const tech of technicians.slice(0, 3)) { // Top 3 alternatives
      const timeSlot = await this.findOptimalTimeSlot(request, tech);

      if (timeSlot) {
        const estimatedArrival = await this.calculateEstimatedArrival(
          tech.technicianId,
          request.customerLocation,
          timeSlot
        );

        alternatives.push({
          technicianId: tech.technicianId,
          technicianName: tech.name,
          scheduledTime: timeSlot,
          estimatedArrival,
          confidence: tech.score,
          reason: `Alternative technician with ${tech.score}% match`,
        });
      }
    }

    return alternatives;
  }

  /**
   * Calculate estimated arrival time including travel
   */
  private async calculateEstimatedArrival(
    technicianId: string,
    customerLocation: { latitude: number; longitude: number },
    scheduledTime: Date
  ): Promise<Date> {
    // Get technician's current or last known location
    const techLocation = await this.getTechnicianLocation(technicianId);
    const travelTime = await this.calculateTravelTime(techLocation, customerLocation);

    return new Date(scheduledTime.getTime() + travelTime * 60000);
  }

  /**
   * Calculate travel time between two locations
   */
  private async calculateTravelTime(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<number> {
    const distance = this.calculateDistance(from, to);

    // Estimate travel time based on distance (average 40 km/h in city)
    const averageSpeed = 40; // km/h
    const travelTimeHours = distance / averageSpeed;
    const travelTimeMinutes = travelTimeHours * 60;

    // Add buffer for traffic and parking
    return Math.round(travelTimeMinutes + 10);
  }

  /**
   * Create a scheduled job entry
   */
  private async createScheduledJob(job: ScheduledJob, technicianId: string): Promise<void> {
    // This would typically save to a scheduling database
    // For now, log the scheduled job
    this.logger.log(`Scheduled job ${job.jobId} for technician ${technicianId} at ${job.startTime}`);

    // Update service ticket status
    await this.serviceTicketRepository.update(job.ticketId, {
      status: HvacServiceTicketStatus.SCHEDULED,
      assignedTechnician: { id: technicianId } as any,
      scheduledDate: job.startTime,
    });
  }

  /**
   * Get technician's current location
   */
  private async getTechnicianLocation(technicianId: string): Promise<{ latitude: number; longitude: number }> {
    const technician = await this.technicianRepository.findOne({
      where: { id: technicianId },
    });

    return {
      latitude: technician?.address?.latitude || 52.2297,
      longitude: technician?.address?.longitude || 21.0122,
    };
  }

  /**
   * Parse time string to minutes from midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Generate time slots for a day
   */
  private generateTimeSlots(date: Date, startMinutes: number, endMinutes: number, intervalMinutes: number): Date[] {
    const slots: Date[] = [];
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
      const slot = new Date(baseDate.getTime() + minutes * 60000);
      slots.push(slot);
    }

    return slots;
  }

  /**
   * Check if a time slot is available for a technician
   */
  private async isTimeSlotAvailable(
    technician: TechnicianAvailability,
    startTime: Date,
    durationMinutes: number
  ): Promise<boolean> {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // Check against existing scheduled jobs
    for (const job of technician.scheduledJobs) {
      if (job.status === 'SCHEDULED' || job.status === 'IN_PROGRESS') {
        const jobStart = new Date(job.startTime);
        const jobEnd = new Date(job.endTime);

        // Add travel time buffer
        const bufferStart = new Date(jobStart.getTime() - technician.travelTimeBuffer * 60000);
        const bufferEnd = new Date(jobEnd.getTime() + technician.travelTimeBuffer * 60000);

        // Check for overlap
        if (startTime < bufferEnd && endTime > bufferStart) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Optimize daily routes for all technicians
   */
  async optimizeDailyRoutes(date: Date): Promise<RouteOptimization[]> {
    try {
      const technicians = await this.getAvailableTechnicians(date);
      const optimizations: RouteOptimization[] = [];

      for (const tech of technicians) {
        if (tech.scheduledJobs.length > 1) {
          const optimizedRoute = await this.optimizeTechnicianRoute(tech);
          optimizations.push(optimizedRoute);
        }
      }

      return optimizations;
    } catch (error) {
      this.logger.error(`Failed to optimize daily routes: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Optimize route for a single technician
   */
  private async optimizeTechnicianRoute(technician: TechnicianAvailability): Promise<RouteOptimization> {
    const jobs = [...technician.scheduledJobs].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Simple nearest neighbor optimization
    const optimizedJobs = await this.nearestNeighborOptimization(jobs, technician.currentLocation);

    const totalTravelTime = await this.calculateTotalTravelTime(optimizedJobs, technician.currentLocation);
    const totalWorkTime = optimizedJobs.reduce((sum, job) => {
      return sum + (job.endTime.getTime() - job.startTime.getTime()) / 60000;
    }, 0);

    const efficiency = totalWorkTime / (totalWorkTime + totalTravelTime) * 100;
    const fuelSavings = this.calculateFuelSavings(totalTravelTime);

    return {
      technicianId: technician.technicianId,
      optimizedJobs,
      totalTravelTime,
      totalWorkTime,
      efficiency,
      fuelSavings,
    };
  }

  /**
   * Nearest neighbor route optimization
   */
  private async nearestNeighborOptimization(
    jobs: ScheduledJob[],
    startLocation: { latitude: number; longitude: number }
  ): Promise<ScheduledJob[]> {
    if (jobs.length <= 1) return jobs;

    const optimized: ScheduledJob[] = [];
    const remaining = [...jobs];
    let currentLocation = startLocation;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(currentLocation, remaining[0].location);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(currentLocation, remaining[i].location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearestJob = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearestJob);
      currentLocation = nearestJob.location;
    }

    return optimized;
  }

  /**
   * Calculate total travel time for a route
   */
  private async calculateTotalTravelTime(
    jobs: ScheduledJob[],
    startLocation: { latitude: number; longitude: number }
  ): Promise<number> {
    if (jobs.length === 0) return 0;

    let totalTime = 0;
    let currentLocation = startLocation;

    for (const job of jobs) {
      totalTime += await this.calculateTravelTime(currentLocation, job.location);
      currentLocation = job.location;
    }

    return totalTime;
  }

  /**
   * Calculate estimated fuel savings in PLN
   */
  private calculateFuelSavings(travelTimeMinutes: number): number {
    const fuelCostPerKm = 0.6; // PLN per km
    const averageSpeed = 40; // km/h
    const distance = (travelTimeMinutes / 60) * averageSpeed;

    // Assume 10% savings from optimization
    return distance * fuelCostPerKm * 0.1;
  }

  /**
   * Emergency rescheduling for high-priority tickets
   */
  async handleEmergencyScheduling(request: SchedulingRequest): Promise<SchedulingResult> {
    try {
      this.logger.log(`Handling emergency scheduling for ticket: ${request.ticketId}`);

      // Get all active technicians regardless of current schedule
      const allTechnicians = await this.getAvailableTechnicians();

      // Find technician who can respond fastest
      const emergencyTechnician = await this.findFastestResponseTechnician(allTechnicians, request.customerLocation);

      if (!emergencyTechnician) {
        return {
          success: false,
          reason: 'No technicians available for emergency response',
          confidence: 0,
        };
      }

      // Calculate immediate response time
      const responseTime = await this.calculateTravelTime(
        emergencyTechnician.currentLocation,
        request.customerLocation
      );

      const emergencyTime = new Date(Date.now() + responseTime * 60000);

      // Create emergency job (may require rescheduling other jobs)
      await this.createScheduledJob({
        jobId: `EMERGENCY-${Date.now()}`,
        ticketId: request.ticketId,
        startTime: emergencyTime,
        endTime: new Date(emergencyTime.getTime() + request.estimatedDuration * 60000),
        location: request.customerLocation,
        status: 'SCHEDULED',
        travelTime: responseTime,
      }, emergencyTechnician.technicianId);

      return {
        success: true,
        assignedTechnician: emergencyTechnician.technicianId,
        scheduledTime: emergencyTime,
        estimatedArrival: emergencyTime,
        confidence: 95, // High confidence for emergency response
      };

    } catch (error) {
      this.logger.error(`Failed to handle emergency scheduling: ${error.message}`, error.stack);
      return {
        success: false,
        reason: 'Emergency scheduling failed',
        confidence: 0,
      };
    }
  }

  /**
   * Find technician who can respond fastest to emergency
   */
  private async findFastestResponseTechnician(
    technicians: TechnicianAvailability[],
    emergencyLocation: { latitude: number; longitude: number }
  ): Promise<TechnicianAvailability | null> {
    let fastestTechnician: TechnicianAvailability | null = null;
    let fastestTime = Infinity;

    for (const tech of technicians) {
      const travelTime = await this.calculateTravelTime(tech.currentLocation, emergencyLocation);

      if (travelTime < fastestTime) {
        fastestTime = travelTime;
        fastestTechnician = tech;
      }
    }

    return fastestTechnician;
  }

  /**
   * Automated daily schedule optimization (runs at 6 AM)
   */
  @Cron('0 6 * * *')
  async optimizeTodaysSchedule(): Promise<void> {
    try {
      this.logger.log('Running daily schedule optimization');

      const today = new Date();
      const optimizations = await this.optimizeDailyRoutes(today);

      this.logger.log(`Optimized routes for ${optimizations.length} technicians`);

      // Log optimization results
      for (const opt of optimizations) {
        this.logger.log(
          `Technician ${opt.technicianId}: ${opt.efficiency.toFixed(1)}% efficiency, ` +
          `${opt.fuelSavings.toFixed(2)} PLN fuel savings`
        );
      }

    } catch (error) {
      this.logger.error(`Daily schedule optimization failed: ${error.message}`, error.stack);
    }
  }
}
