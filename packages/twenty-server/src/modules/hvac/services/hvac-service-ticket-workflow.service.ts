/**
 * HVAC Service Ticket Workflow Service
 * "Pasja rodzi profesjonalizm" - Professional service ticket management
 *
 * Handles complete service ticket lifecycle from creation to completion,
 * including status transitions, escalations, and customer communications.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
    HvacServiceTicketPriority,
    HvacServiceTicketStatus,
    HvacServiceTicketWorkspaceEntity,
} from 'src/modules/hvac/standard-objects/hvac-service-ticket.workspace-entity';
import { HvacTechnicianWorkspaceEntity } from 'src/modules/hvac/standard-objects/hvac-technician.workspace-entity';

import { HvacTechnicianAssignmentService } from './hvac-technician-assignment.service';

export interface ServiceTicketWorkflow {
  ticketId: string;
  currentStatus: HvacServiceTicketStatus;
  allowedTransitions: HvacServiceTicketStatus[];
  nextActions: string[];
  escalationRequired: boolean;
  estimatedCompletion?: Date;
}

export interface TicketEscalation {
  ticketId: string;
  reason:
    | 'overdue'
    | 'high_priority'
    | 'customer_complaint'
    | 'technical_complexity';
  escalationLevel: 'supervisor' | 'manager' | 'director';
  escalatedTo: string;
  escalatedAt: Date;
  originalAssignee?: string;
}

export interface WorkflowMetrics {
  averageResolutionTime: number; // hours
  firstCallResolution: number; // percentage
  customerSatisfaction: number; // 1-5 scale
  technicianEfficiency: number; // percentage
  escalationRate: number; // percentage
  slaCompliance: number; // percentage
}

export interface TicketAutomation {
  triggerId: string;
  condition: string;
  action:
    | 'assign_technician'
    | 'escalate'
    | 'notify_customer'
    | 'schedule_followup';
  parameters: Record<string, any>;
  enabled: boolean;
}

@Injectable()
export class HvacServiceTicketWorkflowService {
  private readonly logger = new Logger(HvacServiceTicketWorkflowService.name);

  constructor(
    @InjectRepository(HvacServiceTicketWorkspaceEntity)
    private readonly ticketRepository: Repository<HvacServiceTicketWorkspaceEntity>,
    @InjectRepository(HvacTechnicianWorkspaceEntity)
    private readonly technicianRepository: Repository<HvacTechnicianWorkspaceEntity>,
    private readonly technicianAssignmentService: HvacTechnicianAssignmentService,
  ) {}

  /**
   * Create new service ticket with automatic workflow initialization
   */
  async createServiceTicket(ticketData: {
    title: string;
    description: string;
    customerId: string;
    equipmentId?: string;
    priority: HvacServiceTicketPriority;
    reportedBy: string;
    contactInfo: string;
  }): Promise<Partial<HvacServiceTicketWorkspaceEntity>> {
    try {
      const ticket: Partial<HvacServiceTicketWorkspaceEntity> = {
        ...ticketData,
        status: HvacServiceTicketStatus.OPEN,
        ticketNumber: this.generateTicketNumber(),
      };

      // Initialize workflow
      await this.initializeWorkflow(ticket.ticketNumber!);

      this.logger.log(
        `Service ticket created: ${ticket.ticketNumber} with priority: ${ticketData.priority}`,
      );

      return ticket;
    } catch (error) {
      this.logger.error('Failed to create service ticket:', error);
      throw error;
    }
  }

  /**
   * Get current workflow state for a ticket
   */
  async getWorkflowState(ticketId: string): Promise<ServiceTicketWorkflow> {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['assignedTechnician'],
      });

      if (!ticket) {
        throw new Error(`Service ticket not found: ${ticketId}`);
      }

      const allowedTransitions = this.getAllowedStatusTransitions(
        ticket.status,
      );
      const nextActions = this.getNextActions(ticket);
      const escalationRequired = await this.checkEscalationRequired(ticket);
      const estimatedCompletion = this.calculateEstimatedCompletion(ticket);

      return {
        ticketId,
        currentStatus: ticket.status,
        allowedTransitions,
        nextActions,
        escalationRequired,
        estimatedCompletion,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get workflow state for ticket ${ticketId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Transition ticket to new status with validation
   */
  async transitionTicketStatus(
    ticketId: string,
    newStatus: HvacServiceTicketStatus,
    notes?: string,
    performedBy?: string,
  ): Promise<void> {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error(`Service ticket not found: ${ticketId}`);
      }

      const allowedTransitions = this.getAllowedStatusTransitions(
        ticket.status,
      );

      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${ticket.status} to ${newStatus}`,
        );
      }

      // Update ticket status
      ticket.status = newStatus;

      // Handle status-specific logic
      await this.handleStatusTransition(ticket, newStatus, notes, performedBy);

      await this.ticketRepository.save(ticket);

      this.logger.log(
        `Ticket ${ticketId} transitioned from ${ticket.status} to ${newStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to transition ticket ${ticketId} to ${newStatus}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Assign technician to ticket with skill matching
   */
  async assignTechnician(
    ticketId: string,
    technicianId?: string,
  ): Promise<string> {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['equipment'],
      });

      if (!ticket) {
        throw new Error(`Service ticket not found: ${ticketId}`);
      }

      let assignedTechnicianId: string;

      if (technicianId) {
        // Manual assignment
        const technician = await this.technicianRepository.findOne({
          where: { id: technicianId },
        });

        if (!technician) {
          throw new Error(`Technician not found: ${technicianId}`);
        }

        assignedTechnicianId = technicianId;
      } else {
        // Automatic assignment based on skills and availability
        assignedTechnicianId = await this.findBestTechnician(ticket);
      }

      // Update ticket
      ticket.assignedTechnician = { id: assignedTechnicianId } as any;
      ticket.status = HvacServiceTicketStatus.ASSIGNED;

      await this.ticketRepository.save(ticket);

      this.logger.log(
        `Technician ${assignedTechnicianId} assigned to ticket ${ticketId}`,
      );

      return assignedTechnicianId;
    } catch (error) {
      this.logger.error(
        `Failed to assign technician to ticket ${ticketId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle ticket escalation
   */
  async escalateTicket(
    ticketId: string,
    reason: TicketEscalation['reason'],
  ): Promise<TicketEscalation> {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['assignedTechnician'],
      });

      if (!ticket) {
        throw new Error(`Service ticket not found: ${ticketId}`);
      }

      const escalationLevel = this.determineEscalationLevel(ticket, reason);
      const escalatedTo = await this.findEscalationTarget(escalationLevel);

      const escalation: TicketEscalation = {
        ticketId,
        reason,
        escalationLevel,
        escalatedTo,
        escalatedAt: new Date(),
        originalAssignee: ticket.assignedTechnician?.id,
      };

      // Update ticket priority if needed
      if (reason === 'high_priority' || reason === 'customer_complaint') {
        ticket.priority = HvacServiceTicketPriority.HIGH;
      }

      // updatedAt is automatically handled by the ORM
      await this.ticketRepository.save(ticket);

      this.logger.log(
        `Ticket ${ticketId} escalated to ${escalationLevel}: ${reason}`,
      );

      return escalation;
    } catch (error) {
      this.logger.error(`Failed to escalate ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow metrics for analysis
   */
  async getWorkflowMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<WorkflowMetrics> {
    try {
      const tickets = await this.ticketRepository.find({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          } as any,
        },
        relations: ['assignedTechnician'],
      });

      const completedTickets = tickets.filter(
        (ticket) => ticket.status === HvacServiceTicketStatus.COMPLETED,
      );

      // Calculate average resolution time
      const resolutionTimes = completedTickets
        .filter((ticket) => ticket.completedDate)
        .map(
          (ticket) =>
            new Date(ticket.completedDate!).getTime() -
            new Date(ticket.createdAt).getTime(),
        );

      const averageResolutionTime =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
            resolutionTimes.length /
            (1000 * 60 * 60)
          : 0;

      // Calculate first call resolution (simplified - assume tickets without reassignment are first call)
      const firstCallResolved = completedTickets.filter(
        (ticket) => ticket.priority !== HvacServiceTicketPriority.EMERGENCY,
      ).length;
      const firstCallResolution =
        completedTickets.length > 0
          ? (firstCallResolved / completedTickets.length) * 100
          : 0;

      // Calculate customer satisfaction (would come from surveys)
      const customerSatisfaction = 4.2; // Placeholder

      // Calculate technician efficiency
      const technicianEfficiency = this.calculateTechnicianEfficiency(tickets);

      // Calculate escalation rate (simplified - use emergency priority as proxy for escalation)
      const escalatedTickets = tickets.filter(
        (ticket) => ticket.priority === HvacServiceTicketPriority.EMERGENCY,
      ).length;
      const escalationRate =
        tickets.length > 0 ? (escalatedTickets / tickets.length) * 100 : 0;

      // Calculate SLA compliance
      const slaCompliance = this.calculateSLACompliance(tickets);

      return {
        averageResolutionTime,
        firstCallResolution,
        customerSatisfaction,
        technicianEfficiency,
        escalationRate,
        slaCompliance,
      };
    } catch (error) {
      this.logger.error('Failed to get workflow metrics:', error);
      throw error;
    }
  }

  /**
   * Set up automated workflow rules
   */
  async setupAutomation(automation: TicketAutomation): Promise<void> {
    try {
      // Store automation rule (would be in database)
      this.logger.log(`Automation rule created: ${automation.triggerId}`);

      // In a real implementation, this would:
      // 1. Store the automation rule in database
      // 2. Set up event listeners
      // 3. Configure trigger conditions
    } catch (error) {
      this.logger.error('Failed to setup automation:', error);
      throw error;
    }
  }

  // Private helper methods
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);

    return `HVAC-${timestamp}-${random}`.toUpperCase();
  }

  private async initializeWorkflow(ticketId: string): Promise<void> {
    // Initialize workflow state, set up notifications, etc.
    this.logger.log(`Workflow initialized for ticket: ${ticketId}`);
  }

  private getAllowedStatusTransitions(
    currentStatus: HvacServiceTicketStatus,
  ): HvacServiceTicketStatus[] {
    const transitions: Record<
      HvacServiceTicketStatus,
      HvacServiceTicketStatus[]
    > = {
      [HvacServiceTicketStatus.OPEN]: [
        HvacServiceTicketStatus.ASSIGNED,
        HvacServiceTicketStatus.SCHEDULED,
        HvacServiceTicketStatus.CANCELLED,
      ],
      [HvacServiceTicketStatus.ASSIGNED]: [
        HvacServiceTicketStatus.IN_PROGRESS,
        HvacServiceTicketStatus.SCHEDULED,
        HvacServiceTicketStatus.ON_HOLD,
        HvacServiceTicketStatus.CANCELLED,
      ],
      [HvacServiceTicketStatus.SCHEDULED]: [
        HvacServiceTicketStatus.IN_PROGRESS,
        HvacServiceTicketStatus.ON_HOLD,
        HvacServiceTicketStatus.CANCELLED,
      ],
      [HvacServiceTicketStatus.IN_PROGRESS]: [
        HvacServiceTicketStatus.COMPLETED,
        HvacServiceTicketStatus.ON_HOLD,
        HvacServiceTicketStatus.CANCELLED,
      ],
      [HvacServiceTicketStatus.ON_HOLD]: [
        HvacServiceTicketStatus.IN_PROGRESS,
        HvacServiceTicketStatus.CANCELLED,
      ],
      [HvacServiceTicketStatus.COMPLETED]: [],
      [HvacServiceTicketStatus.CANCELLED]: [],
    };

    return transitions[currentStatus] ?? [];
  }

  private getNextActions(ticket: HvacServiceTicketWorkspaceEntity): string[] {
    const actions: string[] = [];

    switch (ticket.status) {
      case HvacServiceTicketStatus.OPEN:
        actions.push('Assign Technician', 'Gather More Information');
        break;
      case HvacServiceTicketStatus.ASSIGNED:
        actions.push('Start Work', 'Schedule Appointment');
        break;
      case HvacServiceTicketStatus.IN_PROGRESS:
        actions.push('Complete Work', 'Request Parts', 'Update Customer');
        break;
      case HvacServiceTicketStatus.ON_HOLD:
        actions.push('Resume Work', 'Escalate');
        break;
    }

    return actions;
  }

  private async checkEscalationRequired(
    ticket: HvacServiceTicketWorkspaceEntity,
  ): Promise<boolean> {
    const now = new Date();
    const createdAt = new Date(ticket.createdAt);
    const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Escalation rules based on priority and time
    const escalationThresholds: Record<HvacServiceTicketPriority, number> = {
      [HvacServiceTicketPriority.LOW]: 72, // 3 days
      [HvacServiceTicketPriority.MEDIUM]: 48, // 2 days
      [HvacServiceTicketPriority.HIGH]: 24, // 1 day
      [HvacServiceTicketPriority.CRITICAL]: 12, // 12 hours
      [HvacServiceTicketPriority.EMERGENCY]: 4, // 4 hours
    };

    const threshold = escalationThresholds[ticket.priority] ?? 48;

    return (
      hoursOpen > threshold &&
      ticket.status !== HvacServiceTicketStatus.COMPLETED
    );
  }

  private calculateEstimatedCompletion(
    ticket: HvacServiceTicketWorkspaceEntity,
  ): Date | undefined {
    if (ticket.status === HvacServiceTicketStatus.COMPLETED) {
      return undefined;
    }

    const now = new Date();
    const estimatedHours: Record<HvacServiceTicketPriority, number> = {
      [HvacServiceTicketPriority.LOW]: 48,
      [HvacServiceTicketPriority.MEDIUM]: 24,
      [HvacServiceTicketPriority.HIGH]: 8,
      [HvacServiceTicketPriority.CRITICAL]: 6,
      [HvacServiceTicketPriority.EMERGENCY]: 4,
    };

    const hours = estimatedHours[ticket.priority] ?? 24;

    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  private async handleStatusTransition(
    ticket: HvacServiceTicketWorkspaceEntity,
    newStatus: HvacServiceTicketStatus,
    notes?: string,
    performedBy?: string,
  ): Promise<void> {
    switch (newStatus) {
      case HvacServiceTicketStatus.IN_PROGRESS:
        ticket.startedAt = new Date();
        break;
      case HvacServiceTicketStatus.COMPLETED:
        ticket.completedDate = new Date();
        break;
    }

    // Log status change (would integrate with audit system)
    this.logger.log(
      `Status change: ${ticket.id} -> ${newStatus} by ${performedBy || 'system'}`,
    );
  }

  private async findBestTechnician(
    ticket: HvacServiceTicketWorkspaceEntity,
  ): Promise<string> {
    // Use the intelligent assignment service
    const criteria = {
      requiredSkills: this.getRequiredSkillsForTicket(ticket),
      equipmentType: ticket.equipment?.equipmentType,
      priority: ticket.priority,
      location: ticket.serviceLocation || 'Unknown',
      estimatedDuration: this.estimateTicketDuration(ticket),
    };

    const assignmentResult =
      await this.technicianAssignmentService.findOptimalTechnician(criteria);

    return assignmentResult.assignedTechnicianId;
  }

  private getRequiredSkillsForTicket(
    ticket: HvacServiceTicketWorkspaceEntity,
  ): string[] {
    const baseSkills = ['HVAC_BASICS'];

    if (ticket.equipment?.equipmentType) {
      const typeSkills: Record<string, string[]> = {
        AIR_CONDITIONER: ['REFRIGERATION', 'ELECTRICAL'],
        HEAT_PUMP: ['REFRIGERATION', 'ELECTRICAL', 'CONTROLS'],
        FURNACE: ['GAS_SYSTEMS', 'ELECTRICAL'],
        BOILER: ['HYDRONIC_SYSTEMS', 'GAS_SYSTEMS'],
        VENTILATION_SYSTEM: ['AIRFLOW', 'ELECTRICAL'],
        THERMOSTAT: ['CONTROLS', 'ELECTRICAL'],
        DUCTWORK: ['AIRFLOW', 'INSTALLATION'],
        RADIATOR: ['HYDRONIC_SYSTEMS'],
        HEAT_EXCHANGER: ['HYDRONIC_SYSTEMS', 'REFRIGERATION'],
        OTHER: ['GENERAL_MAINTENANCE'],
      };

      const additionalSkills = typeSkills[ticket.equipment.equipmentType] ?? [];

      return [...baseSkills, ...additionalSkills];
    }

    return baseSkills;
  }

  private estimateTicketDuration(
    ticket: HvacServiceTicketWorkspaceEntity,
  ): number {
    const baseDurations: Record<HvacServiceTicketPriority, number> = {
      [HvacServiceTicketPriority.LOW]: 2,
      [HvacServiceTicketPriority.MEDIUM]: 3,
      [HvacServiceTicketPriority.HIGH]: 4,
      [HvacServiceTicketPriority.CRITICAL]: 5,
      [HvacServiceTicketPriority.EMERGENCY]: 6,
    };

    return baseDurations[ticket.priority] ?? 3;
  }

  private determineEscalationLevel(
    ticket: HvacServiceTicketWorkspaceEntity,
    reason: TicketEscalation['reason'],
  ): TicketEscalation['escalationLevel'] {
    if (
      reason === 'customer_complaint' ||
      ticket.priority === HvacServiceTicketPriority.EMERGENCY
    ) {
      return 'manager';
    }

    if (
      reason === 'technical_complexity' ||
      ticket.priority === HvacServiceTicketPriority.HIGH
    ) {
      return 'supervisor';
    }

    return 'supervisor';
  }

  private async findEscalationTarget(
    level: TicketEscalation['escalationLevel'],
  ): Promise<string> {
    // Would query management hierarchy
    return `${level}_user_id`;
  }

  private calculateTechnicianEfficiency(
    tickets: HvacServiceTicketWorkspaceEntity[],
  ): number {
    // Simplified efficiency calculation
    const completedTickets = tickets.filter(
      (ticket) => ticket.status === HvacServiceTicketStatus.COMPLETED,
    );

    return tickets.length > 0
      ? (completedTickets.length / tickets.length) * 100
      : 0;
  }

  private calculateSLACompliance(
    tickets: HvacServiceTicketWorkspaceEntity[],
  ): number {
    // Simplified SLA compliance calculation
    const slaCompliantTickets = tickets.filter((ticket) => {
      if (!ticket.completedDate) return false;

      const resolutionTime =
        new Date(ticket.completedDate).getTime() -
        new Date(ticket.createdAt).getTime();
      const slaThresholds: Record<HvacServiceTicketPriority, number> = {
        [HvacServiceTicketPriority.EMERGENCY]: 4 * 60 * 60 * 1000, // 4 hours
        [HvacServiceTicketPriority.CRITICAL]: 8 * 60 * 60 * 1000, // 8 hours
        [HvacServiceTicketPriority.HIGH]: 24 * 60 * 60 * 1000, // 24 hours
        [HvacServiceTicketPriority.MEDIUM]: 48 * 60 * 60 * 1000, // 48 hours
        [HvacServiceTicketPriority.LOW]: 72 * 60 * 60 * 1000, // 72 hours
      };

      const threshold = slaThresholds[ticket.priority] ?? 48 * 60 * 60 * 1000;

      return resolutionTime <= threshold;
    });

    return tickets.length > 0
      ? (slaCompliantTickets.length / tickets.length) * 100
      : 0;
  }
}
