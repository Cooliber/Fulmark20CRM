/**
 * HVAC Domain Service - Domain-Driven Design Implementation
 * "Pasja rodzi profesjonalizm" - Professional domain modeling
 *
 * Implements clean architecture patterns for long-term maintainability
 */

import { Injectable, Logger } from '@nestjs/common';

// Value Objects and Types
export type CustomerId = string;
export type PropertyId = string;
export type ServiceTicketId = string;
export type EquipmentId = string;
export type TechnicianId = string;

// Enums
export enum ServiceTicketStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ServiceType {
  INSTALLATION = 'installation',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  EMERGENCY = 'emergency',
  HEATING_INSTALLATION = 'heating_installation',
  HEATING_FAILURE = 'heating_failure',
  COOLING_FAILURE = 'cooling_failure',
  GAS_LEAK = 'gas_leak',
  ELECTRICAL_HAZARD = 'electrical_hazard',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum Skill {
  GENERAL_MAINTENANCE = 'general_maintenance',
  HVAC_INSTALLATION = 'hvac_installation',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  REFRIGERATION = 'refrigeration',
  HEATING_SYSTEMS = 'heating_systems',
  COOLING_SYSTEMS = 'cooling_systems',
  GAS_SYSTEMS = 'gas_systems',
  DIAGNOSTICS = 'diagnostics',
  REPAIR = 'repair',
  EMERGENCY_RESPONSE = 'emergency_response',
  SAFETY = 'safety',
}

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

// Technician interface
export interface Technician {
  id: TechnicianId;
  name: string;
  skills: Skill[];
  currentLocation: Location;
  isAvailable: boolean;
}

export interface CustomerPersonalInfo {
  name: string;
  nip?: string;
  regon?: string;
  companyName?: string;
}

export interface CustomerContactInfo {
  email: string;
  phone: string;
  address: string;
}

export interface CustomerPreferences {
  preferredContactMethod: 'email' | 'phone' | 'sms';
  serviceReminders: boolean;
  marketingConsent: boolean;
}

// Domain Events
export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }
}

export class CustomerPropertyAddedEvent extends DomainEvent {
  constructor(
    public readonly customerId: CustomerId,
    public readonly propertyId: PropertyId,
  ) {
    super();
  }
}

export class CustomerContactUpdatedEvent extends DomainEvent {
  constructor(
    public readonly customerId: CustomerId,
    public readonly contactInfo: CustomerContactInfo,
  ) {
    super();
  }
}

// Domain Exceptions
export class InvalidContactInfoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContactInfoError';
  }
}

export class Property {
  constructor(
    public readonly id: PropertyId,
    public readonly address: string,
    public readonly type: 'residential' | 'commercial',
    public readonly size: number,
  ) {}
}

// Domain Entities - Core business objects
export class Customer {
  constructor(
    public readonly id: CustomerId,
    public readonly personalInfo: CustomerPersonalInfo,
    public readonly contactInfo: CustomerContactInfo,
    public readonly properties: Property[],
    public readonly preferences: CustomerPreferences,
    private readonly domainEvents: DomainEvent[] = [],
  ) {}

  addProperty(property: Property): void {
    this.properties.push(property);
    this.addDomainEvent(new CustomerPropertyAddedEvent(this.id, property.id));
  }

  updateContactInfo(contactInfo: CustomerContactInfo): void {
    // Business rule: Contact info must be validated
    if (!this.isValidContactInfo(contactInfo)) {
      throw new InvalidContactInfoError('Contact information is invalid');
    }

    Object.assign(this.contactInfo, contactInfo);
    this.addDomainEvent(new CustomerContactUpdatedEvent(this.id, contactInfo));
  }

  private isValidContactInfo(contactInfo: CustomerContactInfo): boolean {
    // Polish phone number validation
    const polishPhoneRegex = /^(\+48|48)?[1-9]\d{8}$/;

    return polishPhoneRegex.test(contactInfo.phone);
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents.length = 0;
  }
}

export class ServiceTicket {
  constructor(
    public readonly id: ServiceTicketId,
    public readonly customerId: CustomerId,
    public readonly equipmentId: EquipmentId,
    public status: ServiceTicketStatus,
    public readonly serviceType: ServiceType,
    public readonly priority: Priority,
    public readonly scheduledDate: Date,
    public readonly description: string,
    public technicianId?: TechnicianId,
    public completionDate?: Date,
    private readonly domainEvents: DomainEvent[] = [],
  ) {}

  assignTechnician(technicianId: TechnicianId): void {
    // Business rule: Can only assign if ticket is not completed
    if (this.status === ServiceTicketStatus.COMPLETED) {
      throw new TicketAlreadyCompletedError(
        'Cannot assign technician to completed ticket',
      );
    }

    this.technicianId = technicianId;
    this.status = ServiceTicketStatus.ASSIGNED;
    this.addDomainEvent(new TechnicianAssignedEvent(this.id, technicianId));
  }

  complete(completionNotes: string): void {
    // Business rule: Must have assigned technician to complete
    if (!this.technicianId) {
      throw new NoTechnicianAssignedError(
        'Cannot complete ticket without assigned technician',
      );
    }

    this.status = ServiceTicketStatus.COMPLETED;
    this.completionDate = new Date();
    this.addDomainEvent(
      new ServiceTicketCompletedEvent(
        this.id,
        this.technicianId,
        completionNotes,
      ),
    );
  }

  reschedule(newDate: Date, reason: string): void {
    // Business rule: Cannot reschedule completed tickets
    if (this.status === ServiceTicketStatus.COMPLETED) {
      throw new TicketAlreadyCompletedError(
        'Cannot reschedule completed ticket',
      );
    }

    // Business rule: Cannot schedule in the past
    if (newDate < new Date()) {
      throw new InvalidScheduleDateError('Cannot schedule ticket in the past');
    }

    const oldDate = this.scheduledDate;

    Object.assign(this, { scheduledDate: newDate });
    this.addDomainEvent(
      new ServiceTicketRescheduledEvent(this.id, oldDate, newDate, reason),
    );
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents.length = 0;
  }
}

// Value Objects - Immutable objects that describe characteristics

// Polish NIP validation utility
export class NIPValidator {
  static isValidNIP(nip: string): boolean {
    // Polish NIP validation algorithm
    const cleanNip = nip.replace(/[-\s]/g, '');

    if (cleanNip.length !== 10) return false;

    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = cleanNip.split('').map(Number);

    const sum = weights.reduce(
      (acc, weight, index) => acc + weight * digits[index],
      0,
    );
    const checksum = sum % 11;

    return checksum === digits[9];
  }
}

// Domain Services - Business logic that doesn't belong to entities
@Injectable()
export class ServiceTicketDomainService {
  private readonly logger = new Logger(ServiceTicketDomainService.name);

  /**
   * Business rule: Automatic technician assignment based on skills and location
   */
  assignOptimalTechnician(
    ticket: ServiceTicket,
    availableTechnicians: Technician[],
    customerLocation: Location,
  ): TechnicianId {
    // Filter technicians by required skills
    const qualifiedTechnicians = availableTechnicians.filter((tech) =>
      this.hasRequiredSkills(tech, ticket.serviceType),
    );

    if (qualifiedTechnicians.length === 0) {
      throw new NoQualifiedTechnicianError('No qualified technician available');
    }

    // Find closest technician
    const closestTechnician = this.findClosestTechnician(
      qualifiedTechnicians,
      customerLocation,
    );

    this.logger.log(
      `Assigned technician ${closestTechnician.id} to ticket ${ticket.id}`,
    );

    return closestTechnician.id;
  }

  /**
   * Business rule: Emergency ticket prioritization
   */
  prioritizeEmergencyTicket(ticket: ServiceTicket): void {
    if (this.isEmergencyService(ticket.serviceType)) {
      // Emergency tickets get highest priority and immediate scheduling
      Object.assign(ticket, {
        priority: Priority.EMERGENCY,
        scheduledDate: this.getNextAvailableEmergencySlot(),
      });
    }
  }

  private hasRequiredSkills(
    technician: Technician,
    serviceType: ServiceType,
  ): boolean {
    const requiredSkills = this.getRequiredSkillsForService(serviceType);

    return requiredSkills.every((skill) => technician.skills.includes(skill));
  }

  private findClosestTechnician(
    technicians: Technician[],
    location: Location,
  ): Technician {
    return technicians.reduce((closest, current) => {
      const currentDistance = this.calculateDistance(
        current.currentLocation,
        location,
      );
      const closestDistance = this.calculateDistance(
        closest.currentLocation,
        location,
      );

      return currentDistance < closestDistance ? current : closest;
    });
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) *
        Math.cos(this.toRadians(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private isEmergencyService(serviceType: ServiceType): boolean {
    const emergencyServices = [
      ServiceType.HEATING_FAILURE,
      ServiceType.COOLING_FAILURE,
      ServiceType.GAS_LEAK,
      ServiceType.ELECTRICAL_HAZARD,
    ];

    return emergencyServices.includes(serviceType);
  }

  private getNextAvailableEmergencySlot(): Date {
    // Business rule: Emergency services within 4 hours
    const now = new Date();

    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  }

  private getRequiredSkillsForService(serviceType: ServiceType): Skill[] {
    const skillMap: Partial<Record<ServiceType, Skill[]>> = {
      [ServiceType.INSTALLATION]: [Skill.HVAC_INSTALLATION, Skill.ELECTRICAL],
      [ServiceType.HEATING_INSTALLATION]: [
        Skill.HEATING_SYSTEMS,
        Skill.PLUMBING,
      ],
      [ServiceType.MAINTENANCE]: [Skill.GENERAL_MAINTENANCE],
      [ServiceType.REPAIR]: [Skill.DIAGNOSTICS, Skill.REPAIR],
      [ServiceType.EMERGENCY]: [Skill.EMERGENCY_RESPONSE, Skill.SAFETY],
      [ServiceType.HEATING_FAILURE]: [
        Skill.HEATING_SYSTEMS,
        Skill.EMERGENCY_RESPONSE,
      ],
      [ServiceType.COOLING_FAILURE]: [
        Skill.COOLING_SYSTEMS,
        Skill.EMERGENCY_RESPONSE,
      ],
      [ServiceType.GAS_LEAK]: [
        Skill.GAS_SYSTEMS,
        Skill.EMERGENCY_RESPONSE,
        Skill.SAFETY,
      ],
      [ServiceType.ELECTRICAL_HAZARD]: [
        Skill.ELECTRICAL,
        Skill.EMERGENCY_RESPONSE,
        Skill.SAFETY,
      ],
    };

    return skillMap[serviceType] || [Skill.GENERAL_MAINTENANCE];
  }
}

// Additional domain events for service tickets
export class TechnicianAssignedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: ServiceTicketId,
    public readonly technicianId: TechnicianId,
  ) {
    super();
  }
}

export class ServiceTicketCompletedEvent extends DomainEvent {
  constructor(
    public readonly ticketId: ServiceTicketId,
    public readonly technicianId: TechnicianId,
    public readonly completionNotes: string,
  ) {
    super();
  }
}

export class ServiceTicketRescheduledEvent extends DomainEvent {
  constructor(
    public readonly ticketId: ServiceTicketId,
    public readonly oldDate: Date,
    public readonly newDate: Date,
    public readonly reason: string,
  ) {
    super();
  }
}

// Additional domain exceptions
export class TicketAlreadyCompletedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TicketAlreadyCompletedError';
  }
}

export class NoTechnicianAssignedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoTechnicianAssignedError';
  }
}

export class InvalidScheduleDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidScheduleDateError';
  }
}

export class NoQualifiedTechnicianError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoQualifiedTechnicianError';
  }
}
