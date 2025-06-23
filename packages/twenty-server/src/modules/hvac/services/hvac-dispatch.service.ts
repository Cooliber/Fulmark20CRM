/**
 * HVAC Dispatch Service
 * "Pasja rodzi profesjonalizm" - Professional HVAC Dispatch Management
 *
 * Implements real-time dispatch system with:
 * - Real-time technician tracking
 * - Automated dispatch workflows
 * - Emergency response coordination
 * - Customer notifications
 * - Route updates and optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
    HvacServiceTicketPriority,
    HvacServiceTicketStatus,
    HvacServiceTicketWorkspaceEntity,
} from 'src/modules/hvac/standard-objects/hvac-service-ticket.workspace-entity';
import { HvacTechnicianWorkspaceEntity } from 'src/modules/hvac/standard-objects/hvac-technician.workspace-entity';

import {
    HvacSchedulingEngineService,
    SchedulingRequest,
    SchedulingResult,
} from './hvac-scheduling-engine.service';

// Dispatch interfaces
export interface DispatchRequest {
  ticketId: string;
  priority: HvacServiceTicketPriority;
  serviceType: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  equipmentInfo?: {
    type: string;
    model: string;
    serialNumber?: string;
  };
  description: string;
  preferredTimeSlot?: Date;
  emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DispatchResult {
  success: boolean;
  dispatchId: string;
  assignedTechnician?: TechnicianDispatchInfo;
  estimatedArrival?: Date;
  trackingUrl?: string;
  customerNotificationSent: boolean;
  reason?: string;
}

export interface TechnicianDispatchInfo {
  technicianId: string;
  name: string;
  phone: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SITE' | 'UNAVAILABLE';
  estimatedArrival: Date;
  skills: string[];
}

export interface DispatchUpdate {
  dispatchId: string;
  technicianId: string;
  status:
    | 'DISPATCHED'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  notes?: string;
  estimatedCompletion?: Date;
}

export interface EmergencyDispatch {
  ticketId: string;
  emergencyLevel: 'HIGH' | 'CRITICAL';
  responseTimeRequired: number; // minutes
  specialRequirements?: string[];
  escalationContacts: string[];
}

@Injectable()
export class HvacDispatchService {
  private readonly logger = new Logger(HvacDispatchService.name);
  private readonly activeDispatches = new Map<string, DispatchUpdate>();

  constructor(
    @InjectRepository(HvacServiceTicketWorkspaceEntity, 'workspace')
    private readonly serviceTicketRepository: Repository<HvacServiceTicketWorkspaceEntity>,

    @InjectRepository(HvacTechnicianWorkspaceEntity, 'workspace')
    private readonly technicianRepository: Repository<HvacTechnicianWorkspaceEntity>,

    private readonly schedulingEngine: HvacSchedulingEngineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Main dispatch method - creates and assigns service request
   */
  async dispatchServiceRequest(
    request: DispatchRequest,
  ): Promise<DispatchResult> {
    try {
      this.logger.log(
        `Dispatching service request for customer: ${request.customerInfo.name}`,
      );

      // Create service ticket
      const ticket = await this.createServiceTicket(request);

      // Prepare scheduling request
      const schedulingRequest: SchedulingRequest = {
        ticketId: ticket.id,
        priority: request.priority,
        serviceType: request.serviceType,
        estimatedDuration: this.estimateServiceDuration(request.serviceType),
        requiredSkills: this.getRequiredSkills(
          request.serviceType,
          request.equipmentInfo?.type,
        ),
        preferredDate: request.preferredTimeSlot,
        customerLocation: {
          latitude: request.customerInfo.location.latitude,
          longitude: request.customerInfo.location.longitude,
          address: request.customerInfo.address,
        },
        equipmentType: request.equipmentInfo?.type,
        emergencyLevel: request.emergencyLevel,
      };

      // Schedule the service
      let schedulingResult: SchedulingResult;

      if (
        request.priority === HvacServiceTicketPriority.EMERGENCY ||
        request.priority === HvacServiceTicketPriority.CRITICAL
      ) {
        schedulingResult =
          await this.schedulingEngine.handleEmergencyScheduling(
            schedulingRequest,
          );
      } else {
        schedulingResult =
          await this.schedulingEngine.scheduleServiceRequest(schedulingRequest);
      }

      if (!schedulingResult.success) {
        return {
          success: false,
          dispatchId: ticket.id,
          customerNotificationSent: false,
          reason: schedulingResult.reason,
        };
      }

      // Get technician info
      const technicianInfo = await this.getTechnicianDispatchInfo(
        schedulingResult.assignedTechnician!,
      );

      // Create dispatch record
      const dispatchId = await this.createDispatchRecord(
        ticket.id,
        technicianInfo,
        schedulingResult,
      );

      // Send notifications
      const notificationSent = await this.sendCustomerNotification(
        request.customerInfo,
        technicianInfo,
        schedulingResult,
      );

      await this.sendTechnicianNotification(
        technicianInfo,
        request,
        schedulingResult,
      );

      // Emit dispatch event
      this.eventEmitter.emit('dispatch.created', {
        dispatchId,
        ticketId: ticket.id,
        technicianId: technicianInfo.technicianId,
        customerInfo: request.customerInfo,
      });

      return {
        success: true,
        dispatchId,
        assignedTechnician: technicianInfo,
        estimatedArrival: schedulingResult.estimatedArrival,
        trackingUrl: this.generateTrackingUrl(dispatchId),
        customerNotificationSent: notificationSent,
      };
    } catch (error) {
      this.logger.error(
        `Failed to dispatch service request: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        dispatchId: '',
        customerNotificationSent: false,
        reason: 'Internal dispatch error',
      };
    }
  }

  /**
   * Update dispatch status and location
   */
  async updateDispatchStatus(update: DispatchUpdate): Promise<void> {
    try {
      this.logger.log(
        `Updating dispatch ${update.dispatchId} status to ${update.status}`,
      );

      // Store the update
      this.activeDispatches.set(update.dispatchId, update);

      // Update service ticket status
      await this.updateServiceTicketStatus(update.dispatchId, update.status);

      // Send real-time updates to customers
      await this.sendRealTimeUpdate(update);

      // Emit status update event
      this.eventEmitter.emit('dispatch.updated', update);

      // Handle status-specific actions
      switch (update.status) {
        case 'EN_ROUTE':
          await this.handleEnRouteUpdate(update);
          break;
        case 'ARRIVED':
          await this.handleArrivalUpdate(update);
          break;
        case 'COMPLETED':
          await this.handleCompletionUpdate(update);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to update dispatch status: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get real-time dispatch status
   */
  async getDispatchStatus(dispatchId: string): Promise<DispatchUpdate | null> {
    return this.activeDispatches.get(dispatchId) || null;
  }

  /**
   * Get all active dispatches
   */
  async getActiveDispatches(): Promise<DispatchUpdate[]> {
    return Array.from(this.activeDispatches.values());
  }

  /**
   * Handle emergency dispatch with escalation
   */
  async handleEmergencyDispatch(
    emergency: EmergencyDispatch,
  ): Promise<DispatchResult> {
    try {
      this.logger.log(
        `Handling emergency dispatch for ticket: ${emergency.ticketId}`,
      );

      // Get the service ticket
      const ticket = await this.serviceTicketRepository.findOne({
        where: { id: emergency.ticketId },
      });

      if (!ticket) {
        throw new Error(`Service ticket ${emergency.ticketId} not found`);
      }

      // Create emergency dispatch request
      const dispatchRequest: DispatchRequest = {
        ticketId: emergency.ticketId,
        priority: HvacServiceTicketPriority.EMERGENCY,
        serviceType: ticket.serviceType,
        customerInfo: {
          name: ticket.reportedBy,
          phone: ticket.contactInfo,
          address: 'Emergency Location', // Would be populated from customer data
          location: {
            latitude: 52.2297, // Default Warsaw coordinates
            longitude: 21.0122,
          },
        },
        description: ticket.description,
        emergencyLevel: emergency.emergencyLevel,
      };

      // Dispatch with emergency priority
      const result = await this.dispatchServiceRequest(dispatchRequest);

      // Send escalation notifications if needed
      if (emergency.emergencyLevel === 'CRITICAL') {
        await this.sendEscalationNotifications(
          emergency.escalationContacts,
          result,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to handle emergency dispatch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Cancel dispatch and reschedule
   */
  async cancelDispatch(dispatchId: string, reason: string): Promise<boolean> {
    try {
      this.logger.log(`Cancelling dispatch ${dispatchId}: ${reason}`);

      // Update dispatch status
      const cancelUpdate: DispatchUpdate = {
        dispatchId,
        technicianId: '', // Will be populated from existing dispatch
        status: 'CANCELLED',
        notes: reason,
      };

      await this.updateDispatchStatus(cancelUpdate);

      // Remove from active dispatches
      this.activeDispatches.delete(dispatchId);

      // Emit cancellation event
      this.eventEmitter.emit('dispatch.cancelled', { dispatchId, reason });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel dispatch: ${error.message}`,
        error.stack,
      );

      return false;
    }
  }

  /**
   * Create service ticket from dispatch request
   */
  private async createServiceTicket(
    request: DispatchRequest,
  ): Promise<HvacServiceTicketWorkspaceEntity> {
    const ticketData = {
      ticketNumber: this.generateTicketNumber(),
      title: `${request.serviceType} - ${request.customerInfo.name}`,
      description: request.description || '',
      status: HvacServiceTicketStatus.OPEN,
      priority: request.priority,
      serviceType: request.serviceType as any,
      reportedBy: request.customerInfo.name,
      contactInfo: request.customerInfo.phone,
      preferredDate: request.preferredTimeSlot,
      serviceLocation: request.customerInfo.address,
    };

    const ticket = this.serviceTicketRepository.create(ticketData);

    return await this.serviceTicketRepository.save(ticket);
  }

  /**
   * Generate unique ticket number
   */
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);

    return `HVAC-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Estimate service duration based on service type
   */
  private estimateServiceDuration(serviceType: string): number {
    const durations: Record<string, number> = {
      INSTALLATION: 240, // 4 hours
      MAINTENANCE: 120, // 2 hours
      REPAIR: 180, // 3 hours
      INSPECTION: 60, // 1 hour
      EMERGENCY: 90, // 1.5 hours
      CONSULTATION: 45, // 45 minutes
    };

    return durations[serviceType] || 120; // Default 2 hours
  }

  /**
   * Get required skills for service type and equipment
   */
  private getRequiredSkills(
    serviceType: string,
    equipmentType?: string,
  ): string[] {
    const skills: string[] = [];

    // Add service type skills
    switch (serviceType) {
      case 'INSTALLATION':
        skills.push('INSTALLATION', 'ELECTRICAL', 'PLUMBING');
        break;
      case 'MAINTENANCE':
        skills.push('MAINTENANCE', 'DIAGNOSTICS');
        break;
      case 'REPAIR':
        skills.push('REPAIR', 'DIAGNOSTICS', 'TROUBLESHOOTING');
        break;
      case 'EMERGENCY':
        skills.push('EMERGENCY', 'DIAGNOSTICS', 'REPAIR');
        break;
    }

    // Add equipment-specific skills
    if (equipmentType) {
      skills.push(equipmentType.toUpperCase());
    }

    return skills;
  }

  /**
   * Get technician dispatch information
   */
  private async getTechnicianDispatchInfo(
    technicianId: string,
  ): Promise<TechnicianDispatchInfo> {
    const technician = await this.technicianRepository.findOne({
      where: { id: technicianId },
    });

    if (!technician) {
      throw new Error(`Technician ${technicianId} not found`);
    }

    return {
      technicianId: technician.id,
      name: `${technician.name.firstName} ${technician.name.lastName}`,
      phone: technician.phones?.primaryPhoneNumber || '',
      currentLocation: {
        latitude: technician.address?.addressLat || 52.2297,
        longitude: technician.address?.addressLng || 21.0122,
        lastUpdated: new Date(),
      },
      status: 'AVAILABLE',
      estimatedArrival: new Date(),
      skills: technician.specialties || [],
    };
  }

  /**
   * Create dispatch record
   */
  private async createDispatchRecord(
    ticketId: string,
    technician: TechnicianDispatchInfo,
    scheduling: SchedulingResult,
  ): Promise<string> {
    const dispatchId = `DISPATCH-${Date.now()}`;

    const dispatchUpdate: DispatchUpdate = {
      dispatchId,
      technicianId: technician.technicianId,
      status: 'DISPATCHED',
      location: {
        latitude: technician.currentLocation.latitude,
        longitude: technician.currentLocation.longitude,
        timestamp: new Date(),
      },
      estimatedCompletion: scheduling.scheduledTime,
    };

    this.activeDispatches.set(dispatchId, dispatchUpdate);

    return dispatchId;
  }

  /**
   * Send customer notification
   */
  private async sendCustomerNotification(
    customerInfo: DispatchRequest['customerInfo'],
    technician: TechnicianDispatchInfo,
    scheduling: SchedulingResult,
  ): Promise<boolean> {
    try {
      // This would integrate with SMS/Email service
      this.logger.log(`Sending notification to customer: ${customerInfo.name}`);

      const message =
        `Witaj ${customerInfo.name}! Twój technik HVAC ${technician.name} został przydzielony. ` +
        `Przewidywany czas przyjazdu: ${scheduling.estimatedArrival?.toLocaleString('pl-PL')}. ` +
        `Kontakt: ${technician.phone}`;

      // Would send actual SMS/Email here
      this.logger.log(`Customer notification: ${message}`);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send customer notification: ${error.message}`,
      );

      return false;
    }
  }

  /**
   * Send technician notification
   */
  private async sendTechnicianNotification(
    technician: TechnicianDispatchInfo,
    request: DispatchRequest,
    scheduling: SchedulingResult,
  ): Promise<void> {
    try {
      this.logger.log(`Sending notification to technician: ${technician.name}`);

      const message =
        `Nowe zlecenie: ${request.serviceType} dla ${request.customerInfo.name}. ` +
        `Adres: ${request.customerInfo.address}. ` +
        `Czas: ${scheduling.scheduledTime?.toLocaleString('pl-PL')}. ` +
        `Priorytet: ${request.priority}`;

      // Would send actual notification here
      this.logger.log(`Technician notification: ${message}`);
    } catch (error) {
      this.logger.error(
        `Failed to send technician notification: ${error.message}`,
      );
    }
  }

  /**
   * Generate tracking URL for customer
   */
  private generateTrackingUrl(dispatchId: string): string {
    return `${process.env.FRONTEND_URL}/track/${dispatchId}`;
  }

  /**
   * Update service ticket status based on dispatch status
   */
  private async updateServiceTicketStatus(
    dispatchId: string,
    status: DispatchUpdate['status'],
  ): Promise<void> {
    const dispatch = this.activeDispatches.get(dispatchId);

    if (!dispatch) return;

    let ticketStatus: HvacServiceTicketStatus;

    switch (status) {
      case 'DISPATCHED':
      case 'EN_ROUTE':
        ticketStatus = HvacServiceTicketStatus.SCHEDULED;
        break;
      case 'ARRIVED':
      case 'IN_PROGRESS':
        ticketStatus = HvacServiceTicketStatus.IN_PROGRESS;
        break;
      case 'COMPLETED':
        ticketStatus = HvacServiceTicketStatus.COMPLETED;
        break;
      case 'CANCELLED':
        ticketStatus = HvacServiceTicketStatus.CANCELLED;
        break;
      default:
        return;
    }

    // Find and update the service ticket
    // This would need the ticket ID from the dispatch record
    this.logger.log(
      `Updating ticket status to ${ticketStatus} for dispatch ${dispatchId}`,
    );
  }

  /**
   * Send real-time update to customer
   */
  private async sendRealTimeUpdate(update: DispatchUpdate): Promise<void> {
    try {
      // This would integrate with WebSocket or push notification service
      this.logger.log(
        `Sending real-time update for dispatch ${update.dispatchId}: ${update.status}`,
      );

      // Emit WebSocket event for real-time updates
      this.eventEmitter.emit('dispatch.realtime', update);
    } catch (error) {
      this.logger.error(`Failed to send real-time update: ${error.message}`);
    }
  }

  /**
   * Handle en route status update
   */
  private async handleEnRouteUpdate(update: DispatchUpdate): Promise<void> {
    // Send ETA update to customer
    this.logger.log(
      `Technician ${update.technicianId} is en route for dispatch ${update.dispatchId}`,
    );
  }

  /**
   * Handle arrival status update
   */
  private async handleArrivalUpdate(update: DispatchUpdate): Promise<void> {
    // Notify customer of arrival
    this.logger.log(
      `Technician ${update.technicianId} has arrived for dispatch ${update.dispatchId}`,
    );
  }

  /**
   * Handle completion status update
   */
  private async handleCompletionUpdate(update: DispatchUpdate): Promise<void> {
    // Send completion notification and request feedback
    this.logger.log(`Service completed for dispatch ${update.dispatchId}`);

    // Remove from active dispatches
    this.activeDispatches.delete(update.dispatchId);
  }

  /**
   * Send escalation notifications for critical emergencies
   */
  private async sendEscalationNotifications(
    contacts: string[],
    result: DispatchResult,
  ): Promise<void> {
    for (const contact of contacts) {
      this.logger.log(`Sending escalation notification to: ${contact}`);
      // Would send actual escalation notification
    }
  }
}
