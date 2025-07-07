/**
 * HVAC Customer Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional HVAC Customer Management
 * 
 * Workspace entity definition for HVAC customers
 * Compatible with TwentyCRM workspace entity system
 */

import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

// HVAC Customer Types
export enum HvacCustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
}

export enum HvacCustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PROSPECT = 'PROSPECT',
}

export class HvacCustomerWorkspaceEntity {
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
  nip?: string;

  @IsOptional()
  @IsString()
  regon?: string;

  @IsEnum(HvacCustomerType)
  type: HvacCustomerType;

  @IsEnum(HvacCustomerStatus)
  status: HvacCustomerStatus;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Relations - simplified
  serviceTickets?: any[];
  equipment?: any[];
}
