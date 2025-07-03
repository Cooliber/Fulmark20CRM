/**
 * HVAC Maintenance Record Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional HVAC Maintenance Management
 * 
 * Simplified workspace entity definition for HVAC maintenance records
 */

import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';

// HVAC Maintenance Record Types
export enum HvacMaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  INSPECTION = 'INSPECTION',
  INSTALLATION = 'INSTALLATION',
  REPLACEMENT = 'REPLACEMENT',
  ROUTINE = 'ROUTINE',
  CLEANING = 'CLEANING',
  CALIBRATION = 'CALIBRATION',
}

export enum HvacMaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export class HvacMaintenanceRecordWorkspaceEntity {
  id: string;
  
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(HvacMaintenanceType)
  type: HvacMaintenanceType;

  @IsOptional()
  @IsString()
  maintenanceType?: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsDateString()
  performedDate?: string;

  @IsEnum(HvacMaintenanceStatus)
  status: HvacMaintenanceStatus;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsString()
  workPerformed?: string;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Relations - simplified
  equipment?: any;
  technician?: any;
  serviceTicket?: any;
}
