/**
 * HVAC Technician Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional HVAC Technician Management
 *
 * Simplified workspace entity definition for HVAC technicians
 */

import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

// HVAC Technician Types
export enum HvacTechnicianStatus {
  AVAILABLE = 'AVAILABLE',
  ACTIVE = 'ACTIVE',
  BUSY = 'BUSY',
  OFF_DUTY = 'OFF_DUTY',
  ON_BREAK = 'ON_BREAK',
  SICK_LEAVE = 'SICK_LEAVE',
  VACATION = 'VACATION',
}

export enum HvacTechnicianLevel {
  APPRENTICE = 'APPRENTICE',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  SUPERVISOR = 'SUPERVISOR',
  SPECIALIST = 'SPECIALIST',
}

export class HvacTechnicianWorkspaceEntity {
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsEnum(HvacTechnicianStatus)
  status: HvacTechnicianStatus;

  @IsEnum(HvacTechnicianLevel)
  level: HvacTechnicianLevel;

  @IsOptional()
  @IsString()
  specializations?: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  skills?: string[];

  @IsOptional()
  specialties?: string[];

  @IsOptional()
  @IsNumber()
  weeklyCapacity?: number;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  completedTickets?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // Relations - simplified
  serviceTickets?: any[];
}