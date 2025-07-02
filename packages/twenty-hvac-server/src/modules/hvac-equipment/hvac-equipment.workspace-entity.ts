/**
 * HVAC Equipment Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional HVAC Equipment Management
 * 
 * Workspace entity definition for HVAC equipment
 * Compatible with TwentyCRM workspace entity system
 */

import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

// HVAC Equipment Types
export enum HvacEquipmentType {
  HEATING_SYSTEM = 'HEATING_SYSTEM',
  COOLING_SYSTEM = 'COOLING_SYSTEM',
  VENTILATION = 'VENTILATION',
  HEAT_PUMP = 'HEAT_PUMP',
  BOILER = 'BOILER',
  AIR_CONDITIONER = 'AIR_CONDITIONER',
  THERMOSTAT = 'THERMOSTAT',
  DUCTWORK = 'DUCTWORK',
  FILTER = 'FILTER',
  OTHER = 'OTHER',
}

export enum HvacEquipmentStatus {
  OPERATIONAL = 'OPERATIONAL',
  ACTIVE = 'ACTIVE',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  DECOMMISSIONED = 'DECOMMISSIONED',
  UNDER_WARRANTY = 'UNDER_WARRANTY',
}

export enum HvacEquipmentCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL',
}

export class HvacEquipmentWorkspaceEntity {
  id: string;

  @IsString()
  name: string;

  @IsEnum(HvacEquipmentType)
  type: HvacEquipmentType;

  @IsOptional()
  @IsString()
  equipmentType?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsEnum(HvacEquipmentStatus)
  status: HvacEquipmentStatus;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(HvacEquipmentCondition)
  condition?: HvacEquipmentCondition;

  @IsOptional()
  @IsString()
  energyRating?: string;

  // Relations - simplified
  customer?: any;
  serviceTickets?: any[];
  maintenanceRecords?: any[];
}
