/**
 * HVAC Service Ticket Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional HVAC Service Management
 *
 * Simplified workspace entity definition for HVAC service tickets
 */

import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

// HVAC Service Ticket Types
export enum HvacServiceTicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum HvacServiceTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY',
}

export enum HvacServiceTicketType {
  INSTALLATION = 'INSTALLATION',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  EMERGENCY = 'EMERGENCY',
}

export class HvacServiceTicketWorkspaceEntity {
  id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(HvacServiceTicketStatus)
  status: HvacServiceTicketStatus;

  @IsEnum(HvacServiceTicketPriority)
  priority: HvacServiceTicketPriority;

  @IsEnum(HvacServiceTicketType)
  type: HvacServiceTicketType;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @IsOptional()
  @IsString()
  assignedTechnician?: string;

  @IsOptional()
  @IsString()
  serviceLocation?: string;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @IsOptional()
  @IsNumber()
  actualDuration?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // Relations - simplified
  customer?: any;
  equipment?: any;
  technician?: any;
}